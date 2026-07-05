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

  // Per-set tracking: exerciseIndex → list of {reps, load, completed}
  // TextEditingControllers track actual user input for reps and weight per set.
  final Map<int, List<TextEditingController>> _repsControllers = {};
  final Map<int, List<TextEditingController>> _loadControllers = {};
  final Map<int, List<bool>> _setCompleted = {};
  // Track which exercise cards are expanded (default: all expanded)
  final Map<int, bool> _expanded = {};

  @override
  void initState() {
    super.initState();
    _loadPlan();
  }

  @override
  void dispose() {
    for (final controllers in _repsControllers.values) {
      for (final c in controllers) { c.dispose(); }
    }
    for (final controllers in _loadControllers.values) {
      for (final c in controllers) { c.dispose(); }
    }
    super.dispose();
  }

  Future<void> _loadPlan() async {
    try {
      final plan = await FitosRepository.instance.getWorkoutPlan(widget.planId);
      final rawSessions = (plan['sessions'] as List?) ?? [];

      if (rawSessions.isEmpty) {
        if (mounted) setState(() => _isLoading = false);
        return;
      }

      final count = rawSessions.length;
      final cycledIdx = (widget.dayNumber - 1) % count;
      _effectiveDayNumber = (rawSessions[cycledIdx] as Map)['dayNumber'] as int? ?? cycledIdx + 1;

      final session = rawSessions[cycledIdx] as Map<String, dynamic>;
      final exercises = (session['exercises'] as List? ?? [])
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();

      // Initialize per-set data for each exercise
      for (var i = 0; i < exercises.length; i++) {
        final ex = exercises[i];
        final targetSets = (ex['sets'] as num?)?.toInt() ?? 3;
        final minReps = _parseMinReps(ex['reps'] as String? ?? '10');

        _repsControllers[i] = List.generate(
          targetSets,
          (_) => TextEditingController(text: minReps.toString()),
        );
        _loadControllers[i] = List.generate(
          targetSets,
          (_) => TextEditingController(text: '0'),
        );
        _setCompleted[i] = List.generate(targetSets, (_) => false);
        _expanded[i] = true; // start expanded so sets are visible immediately
      }

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

  int get _totalSets =>
      _setCompleted.values.fold(0, (sum, sets) => sum + sets.length);

  int get _completedSets =>
      _setCompleted.values.fold(0, (sum, sets) => sum + sets.where((v) => v).length);

  Future<void> _finishWorkout() async {
    final completedSetsCount = _completedSets;
    final totalSetsCount = _totalSets;

    final String status = completedSetsCount == 0
        ? 'missed'
        : completedSetsCount == totalSetsCount
            ? 'completed'
            : 'partial';

    final rpe = await _showRpeDialog();
    if (!mounted || rpe == null) return;

    setState(() => _isSubmitting = true);
    final durationMinutes = DateTime.now().difference(_startTime).inMinutes;

    try {
      final exerciseLogs = <Map<String, dynamic>>[];
      for (var i = 0; i < _exercises.length; i++) {
        final ex = _exercises[i];
        final exerciseId = ex['exerciseId'] as String? ?? '';
        if (ex['category'] == 'conditioning' ||
            exerciseId == '00000000-0000-0000-0000-000000000000') { continue; }

        final targetSets = (ex['sets'] as num?)?.toInt() ?? 3;
        final repsCtrl = _repsControllers[i] ?? [];
        final loadCtrl = _loadControllers[i] ?? [];
        final completed = _setCompleted[i] ?? [];

        exerciseLogs.add({
          'exerciseId': exerciseId,
          'targetSets': targetSets,
          'sets': List.generate(
            targetSets,
            (j) => {
              'setNumber': j + 1,
              'reps': j < repsCtrl.length ? (int.tryParse(repsCtrl[j].text) ?? 0) : 0,
              'load': j < loadCtrl.length
                  ? (double.tryParse(loadCtrl[j].text) ?? 0.0)
                  : 0.0,
              'completed': j < completed.length ? completed[j] : false,
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
                'Session Effort: ${rpe.round()} / 10',
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

    final total = _totalSets;
    final done = _completedSets;
    final progress = total > 0 ? done / total : 0.0;
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
                  '$done / $total sets done',
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
          // Input hint
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 6, 16, 2),
            child: Text(
              'Tap an exercise to expand. Enter actual reps & weight per set, then check it done.',
              style: TextStyle(fontSize: 11, color: AppColors.neutral400),
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: List.generate(
                _exercises.length,
                (i) => _buildExerciseCard(i),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExerciseCard(int i) {
    final ex = _exercises[i];
    final name = ex['name'] as String? ?? 'Exercise';
    final targetSets = (ex['sets'] as num?)?.toInt() ?? 3;
    final reps = ex['reps'] as String? ?? '10';
    final restSec = (ex['restSeconds'] as num?)?.toInt();
    final category = ex['category'] as String? ?? '';
    final targetRpe = ex['rpe'] as num?;
    final isExpanded = _expanded[i] ?? true;

    final completed = _setCompleted[i] ?? [];
    final allDone = completed.isNotEmpty && completed.every((v) => v);
    final anyDone = completed.any((v) => v);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(
          color: allDone
              ? AppColors.success
              : anyDone
                  ? AppColors.warning
                  : AppColors.neutral200,
          width: allDone || anyDone ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Exercise header — tap to expand/collapse
          InkWell(
            onTap: () => setState(() => _expanded[i] = !isExpanded),
            borderRadius: BorderRadius.circular(AppRadius.md),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(9),
                    decoration: BoxDecoration(
                      color: allDone
                          ? AppColors.success.withOpacity(0.12)
                          : AppColors.primary500.withOpacity(0.10),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      allDone ? Icons.check : Icons.fitness_center,
                      color: allDone ? AppColors.success : AppColors.primary500,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                            color: allDone ? AppColors.neutral400 : AppColors.ink,
                            decoration: allDone ? TextDecoration.lineThrough : null,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '$targetSets sets × $reps reps'
                          '${restSec != null ? ' · ${restSec}s rest' : ''}'
                          '${targetRpe != null ? ' · RPE ${targetRpe.round()}' : ''}',
                          style: const TextStyle(fontSize: 12, color: AppColors.neutral500),
                        ),
                        if (category.isNotEmpty)
                          Text(
                            category.toUpperCase(),
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.neutral400,
                              letterSpacing: 0.8,
                            ),
                          ),
                      ],
                    ),
                  ),
                  Icon(
                    isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: AppColors.neutral400,
                  ),
                ],
              ),
            ),
          ),

          // Expanded: per-set logging rows
          if (isExpanded) ...[
            const Divider(height: 1, thickness: 1, color: AppColors.neutral100),
            // Column headers
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 4),
              child: Row(
                children: const [
                  SizedBox(
                    width: 32,
                    child: Text('Set',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.neutral500)),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text('Reps',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.neutral500)),
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text('Weight (kg)',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.neutral500)),
                  ),
                  SizedBox(width: 8),
                  SizedBox(
                    width: 40,
                    child: Text('Done',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: AppColors.neutral500)),
                  ),
                ],
              ),
            ),
            for (var j = 0; j < targetSets; j++) _buildSetRow(i, j),
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }

  Widget _buildSetRow(int exerciseIdx, int setIdx) {
    final repsCtrl = _repsControllers[exerciseIdx]?[setIdx];
    final loadCtrl = _loadControllers[exerciseIdx]?[setIdx];
    final done = _setCompleted[exerciseIdx]?[setIdx] ?? false;
    if (repsCtrl == null || loadCtrl == null) return const SizedBox();

    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 3, 14, 3),
      child: Row(
        children: [
          SizedBox(
            width: 32,
            child: Text(
              '${setIdx + 1}',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 14,
                color: done ? AppColors.success : AppColors.neutral600,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: SizedBox(
              height: 38,
              child: TextField(
                controller: repsCtrl,
                keyboardType: TextInputType.number,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14),
                decoration: InputDecoration(
                  isDense: true,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide: const BorderSide(color: AppColors.neutral200),
                  ),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 9),
                  fillColor:
                      done ? AppColors.success.withOpacity(0.06) : Colors.white,
                  filled: true,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: SizedBox(
              height: 38,
              child: TextField(
                controller: loadCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14),
                decoration: InputDecoration(
                  isDense: true,
                  suffixText: 'kg',
                  suffixStyle: const TextStyle(fontSize: 11, color: AppColors.neutral400),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(6),
                    borderSide: const BorderSide(color: AppColors.neutral200),
                  ),
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 9),
                  fillColor:
                      done ? AppColors.success.withOpacity(0.06) : Colors.white,
                  filled: true,
                ),
              ),
            ),
          ),
          SizedBox(
            width: 40,
            child: Checkbox(
              value: done,
              activeColor: AppColors.success,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              onChanged: (v) => setState(() {
                _setCompleted[exerciseIdx]![setIdx] = v ?? false;
              }),
            ),
          ),
        ],
      ),
    );
  }
}
