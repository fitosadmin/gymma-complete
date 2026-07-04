import 'package:flutter/material.dart';
import '../data/fitos_repository.dart';
import '../theme.dart';

class ActiveWorkoutScreen extends StatefulWidget {
  final String planId;
  final int dayNumber; // 1-based; cycled into plan's session array

  const ActiveWorkoutScreen({
    super.key,
    required this.planId,
    required this.dayNumber,
  });

  @override
  State<ActiveWorkoutScreen> createState() => _ActiveWorkoutScreenState();
}

class _ActiveWorkoutScreenState extends State<ActiveWorkoutScreen> {
  bool _isLoading = true;
  bool _isSubmitting = false;
  Map<String, dynamic>? _todaySession;
  List<Map<String, dynamic>> _exercises = [];
  int _effectiveDayNumber = 1;
  final DateTime _startTime = DateTime.now();
  // exerciseIndex → completed
  final Map<int, bool> _completed = {};

  @override
  void initState() {
    super.initState();
    _loadPlan();
  }

  Future<void> _loadPlan() async {
    try {
      final plan = await FitosRepository.instance.getWorkoutPlan(widget.planId);
      final rawSessions = (plan['sessions'] as List?) ?? [];

      if (rawSessions.isEmpty) {
        if (mounted) setState(() => _isLoading = false);
        return;
      }

      // Cycle dayNumber into the actual sessions count
      final count = rawSessions.length;
      final cycledIdx = (widget.dayNumber - 1) % count;
      _effectiveDayNumber = (rawSessions[cycledIdx] as Map)['dayNumber'] as int? ?? cycledIdx + 1;

      final session = rawSessions[cycledIdx] as Map<String, dynamic>;
      final exercises = (session['exercises'] as List? ?? [])
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();

      if (mounted) {
        setState(() {
          _todaySession = session;
          _exercises = exercises;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Failed to load plan: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  int _parseMinReps(String repsStr) {
    final parts = repsStr.split('-');
    return int.tryParse(parts.first.trim()) ?? 10;
  }

  Future<void> _finishWorkout() async {
    final completedCount = _completed.values.where((v) => v).length;
    final String status = completedCount == 0
        ? 'missed'
        : (completedCount == _exercises.length ? 'completed' : 'partial');

    // Ask for RPE before logging
    final rpe = await _showRpeDialog();
    if (!mounted || rpe == null) return;

    setState(() => _isSubmitting = true);
    final durationMinutes = DateTime.now().difference(_startTime).inMinutes;

    try {
      final exerciseLogs = <Map<String, dynamic>>[];
      for (var i = 0; i < _exercises.length; i++) {
        final ex = _exercises[i];
        final done = _completed[i] ?? false;
        final targetSets = (ex['sets'] as num?)?.toInt() ?? 3;
        final minReps = _parseMinReps(ex['reps'] as String? ?? '10');
        exerciseLogs.add({
          'exerciseId': ex['exerciseId'] as String,
          'targetSets': targetSets,
          'sets': List.generate(
            targetSets,
            (j) => {
              'setNumber': j + 1,
              'reps': minReps,
              'completed': done,
            },
          ),
        });
      }

      await FitosRepository.instance.logSession({
        'planId': widget.planId,
        'dayNumber': _effectiveDayNumber,
        'sessionDate': DateTime.now().toUtc().toIso8601String(),
        'status': status,
        'durationMinutes': durationMinutes < 1 ? 1 : durationMinutes,
        'rpeAverage': rpe,
        'exercises': exerciseLogs,
      });

      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      debugPrint('Error logging session: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to log workout: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<double?> _showRpeDialog() {
    double rpe = 7.0;
    return showDialog<double>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => AlertDialog(
          title: const Text('How was this session?'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Effort: ${rpe.round()} / 10',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary500,
                ),
              ),
              Slider(
                value: rpe,
                min: 1,
                max: 10,
                divisions: 9,
                activeColor: AppColors.primary500,
                label: rpe.round().toString(),
                onChanged: (v) => setLocal(() => rpe = v),
              ),
              const Text(
                '1 = Very Easy  ·  10 = Maximum Effort',
                style: TextStyle(fontSize: 12, color: AppColors.neutral500),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, rpe),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary500,
                foregroundColor: Colors.white,
              ),
              child: const Text('Log Session'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_exercises.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Active Session')),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'No exercises found for this session.\nThe plan may still be generating.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.neutral500, fontSize: 16),
            ),
          ),
        ),
      );
    }

    final completedCount = _completed.values.where((v) => v).length;
    final progress = completedCount / _exercises.length;
    final focus = _todaySession?['focus'] as String? ?? 'Training';
    final durationTarget = _todaySession?['durationMinutes'] as int?;

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: Text('Day $_effectiveDayNumber · $focus'),
        backgroundColor: Colors.white,
        actions: [
          if (!_isSubmitting)
            TextButton(
              onPressed: _finishWorkout,
              child: const Text(
                'FINISH',
                style: TextStyle(
                    fontWeight: FontWeight.bold, color: AppColors.primary500),
              ),
            )
          else
            const Padding(
              padding: EdgeInsets.all(14),
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Progress bar + count label
          LinearProgressIndicator(
            value: progress,
            backgroundColor: AppColors.neutral200,
            color: AppColors.primary500,
            minHeight: 6,
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '$completedCount / ${_exercises.length} exercises done',
                  style: const TextStyle(
                      color: AppColors.neutral500, fontSize: 13),
                ),
                if (durationTarget != null)
                  Text(
                    '~$durationTarget min',
                    style: const TextStyle(
                        color: AppColors.neutral500, fontSize: 13),
                  ),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _exercises.length,
              itemBuilder: (context, i) {
                final ex = _exercises[i];
                final done = _completed[i] ?? false;
                final name = ex['name'] as String? ?? 'Exercise';
                final sets = (ex['sets'] as num?)?.toInt() ?? 3;
                final reps = ex['reps'] as String? ?? '10';
                final restSec = (ex['restSeconds'] as num?)?.toInt();
                final category = ex['category'] as String? ?? '';
                final rpe = ex['rpe'] as num?;

                return GestureDetector(
                  onTap: () => setState(() => _completed[i] = !done),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      border: Border.all(
                        color: done ? AppColors.success : AppColors.neutral200,
                        width: done ? 2 : 1,
                      ),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 6),
                      leading: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: done
                              ? AppColors.success.withOpacity(0.12)
                              : AppColors.primary500.withOpacity(0.10),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          done ? Icons.check : Icons.fitness_center,
                          color: done
                              ? AppColors.success
                              : AppColors.primary500,
                          size: 20,
                        ),
                      ),
                      title: Text(
                        name,
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          decoration:
                              done ? TextDecoration.lineThrough : null,
                          color: done
                              ? AppColors.neutral400
                              : AppColors.ink,
                        ),
                      ),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '$sets sets × $reps reps'
                            '${restSec != null ? ' · ${restSec}s rest' : ''}'
                            '${rpe != null ? ' · RPE ${rpe.round()}' : ''}',
                            style: const TextStyle(fontSize: 13),
                          ),
                          if (category.isNotEmpty)
                            Text(
                              category.toUpperCase(),
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.neutral400,
                                letterSpacing: 0.8,
                              ),
                            ),
                        ],
                      ),
                      trailing: Checkbox(
                        value: done,
                        activeColor: AppColors.success,
                        onChanged: (val) =>
                            setState(() => _completed[i] = val ?? false),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
