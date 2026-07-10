import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../data/fitos_repository.dart';
import '../theme.dart';

class ActiveWorkoutScreen extends StatefulWidget {
  final String planId;
  final int dayNumber;

  const ActiveWorkoutScreen({
    super.key,
    required this.planId,
    required this.dayNumber,
  });

  @override
  State<ActiveWorkoutScreen> createState() => _ActiveWorkoutScreenState();
}

class _ActiveWorkoutScreenState extends State<ActiveWorkoutScreen>
    with TickerProviderStateMixin {
  bool _isLoading = true;
  bool _isSubmitting = false;
  Map<String, dynamic>? _todaySession;
  List<Map<String, dynamic>> _exercises = [];
  int _effectiveDayNumber = 1;
  final DateTime _startTime = DateTime.now();

  // Per-set tracking
  final Map<int, List<TextEditingController>> _repsControllers = {};
  final Map<int, List<TextEditingController>> _loadControllers = {};
  final Map<int, List<bool>> _setCompleted = {};
  final Map<int, bool> _expanded = {};

  // Live workout timer
  late Timer _timer;
  Duration _elapsed = Duration.zero;

  // Animation controllers
  late AnimationController _progressAnimCtrl;
  late Animation<double> _progressAnim;
  double _lastProgress = 0.0;

  @override
  void initState() {
    super.initState();
    _progressAnimCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 500));
    _progressAnim = Tween<double>(begin: 0, end: 0).animate(
        CurvedAnimation(parent: _progressAnimCtrl, curve: Curves.easeOut));

    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() => _elapsed = DateTime.now().difference(_startTime));
      }
    });

    _loadPlan();
  }

  @override
  void dispose() {
    _timer.cancel();
    _progressAnimCtrl.dispose();
    for (final ctrls in _repsControllers.values) {
      for (final c in ctrls) {
        c.dispose();
      }
    }
    for (final ctrls in _loadControllers.values) {
      for (final c in ctrls) {
        c.dispose();
      }
    }
    super.dispose();
  }

  Future<void> _loadPlan() async {
    try {
      final plan =
          await FitosRepository.instance.getWorkoutPlan(widget.planId);
      final rawSessions = (plan['sessions'] as List?) ?? [];

      if (rawSessions.isEmpty) {
        if (mounted) setState(() => _isLoading = false);
        return;
      }

      final count = rawSessions.length;
      final cycledIdx = (widget.dayNumber - 1) % count;
      _effectiveDayNumber =
          (rawSessions[cycledIdx] as Map)['dayNumber'] as int? ??
              cycledIdx + 1;

      final session = rawSessions[cycledIdx] as Map<String, dynamic>;
      final exercises = (session['exercises'] as List? ?? [])
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();

      for (var i = 0; i < exercises.length; i++) {
        final ex = exercises[i];
        final targetSets = (ex['sets'] as num?)?.toInt() ?? 3;
        final minReps = _parseMinReps(ex['reps'] as String? ?? '10');

        _repsControllers[i] = List.generate(
            targetSets, (_) => TextEditingController(text: minReps.toString()));
        _loadControllers[i] =
            List.generate(targetSets, (_) => TextEditingController(text: '0'));
        _setCompleted[i] = List.generate(targetSets, (_) => false);
        _expanded[i] = false;
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

  int get _completedSets => _setCompleted.values
      .fold(0, (sum, sets) => sum + sets.where((v) => v).length);

  void _onSetToggled(int exerciseIdx, int setIdx, bool value) {
    HapticFeedback.lightImpact();
    setState(() {
      _setCompleted[exerciseIdx]![setIdx] = value;
    });

    // Animate progress bar
    final newProgress = _totalSets > 0 ? _completedSets / _totalSets : 0.0;
    _progressAnim = Tween<double>(begin: _lastProgress, end: newProgress)
        .animate(
            CurvedAnimation(parent: _progressAnimCtrl, curve: Curves.easeOut));
    _progressAnimCtrl.forward(from: 0);
    _lastProgress = newProgress;
  }

  Future<void> _finishWorkout() async {
    final completedSetsCount = _completedSets;
    final totalSetsCount = _totalSets;

    final String status = completedSetsCount == 0
        ? 'missed'
        : completedSetsCount == totalSetsCount
            ? 'completed'
            : 'partial';

    final rpe = await _showRpeDialog();
    if (!mounted) return;
    if (rpe == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Nothing lost — your logged sets are saved. Finish whenever you\'re ready.')));
      return;
    }

    setState(() => _isSubmitting = true);
    final durationMinutes = _elapsed.inMinutes;

    try {
      final exerciseLogs = <Map<String, dynamic>>[];
      for (var i = 0; i < _exercises.length; i++) {
        final ex = _exercises[i];
        final exerciseId = ex['exerciseId'] as String? ?? '';
        if (ex['category'] == 'conditioning' ||
            exerciseId == '00000000-0000-0000-0000-000000000000') {
          continue;
        }

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
              'reps': j < repsCtrl.length
                  ? (int.tryParse(repsCtrl[j].text) ?? 0)
                  : 0,
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
    return showModalBottomSheet<double>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => Container(
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(
                top: Radius.circular(AppRadius.xxl)),
          ),
          padding: EdgeInsets.fromLTRB(
              24, 8, 24, MediaQuery.of(ctx).viewInsets.bottom + 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(top: 12, bottom: 24),
                  decoration: BoxDecoration(
                    color: AppColors.divider,
                    borderRadius: BorderRadius.circular(AppRadius.full),
                  ),
                ),
              ),
              const Text(
                'How was this session?',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Rate your perceived effort for this workout.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
              ),
              const SizedBox(height: 32),
              // Big RPE number
              TweenAnimationBuilder<double>(
                tween: Tween<double>(begin: rpe, end: rpe),
                duration: const Duration(milliseconds: 200),
                builder: (_, v, __) => Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    gradient: AppGradients.brandGradient,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.brandCopper.withOpacity(0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      )
                    ],
                  ),
                  child: Center(
                    child: Text(
                      rpe.round().toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 42,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _rpeLabel(rpe.round()),
                style: const TextStyle(
                  color: AppColors.brandCopper,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 24),
              SliderTheme(
                data: SliderTheme.of(ctx).copyWith(
                  activeTrackColor: AppColors.brandCopper,
                  inactiveTrackColor: AppColors.divider,
                  thumbColor: AppColors.brandCopper,
                  overlayColor: AppColors.brandCopper.withOpacity(0.15),
                  trackHeight: 6,
                  thumbShape:
                      const RoundSliderThumbShape(enabledThumbRadius: 12),
                ),
                child: Slider(
                  value: rpe,
                  min: 1,
                  max: 10,
                  divisions: 9,
                  label: rpe.round().toString(),
                  onChanged: (v) => setLocal(() => rpe = v),
                ),
              ),
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('1 · Easy',
                      style: TextStyle(
                          fontSize: 11, color: AppColors.textSecondary)),
                  Text('10 · Max Effort',
                      style: TextStyle(
                          fontSize: 11, color: AppColors.textSecondary)),
                ],
              ),
              const SizedBox(height: 32),
              // Buttons
              Row(children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textSecondary,
                      side: const BorderSide(color: AppColors.divider),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(AppRadius.md)),
                    ),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: AppGradients.brandGradient,
                      borderRadius: BorderRadius.circular(AppRadius.md),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.brandCopper.withOpacity(0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        )
                      ],
                    ),
                    child: TextButton(
                      onPressed: () => Navigator.pop(ctx, rpe),
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(AppRadius.md)),
                      ),
                      child: const Text(
                        'Log Session ✓',
                        style: TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 15),
                      ),
                    ),
                  ),
                ),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  String _rpeLabel(int rpe) {
    if (rpe <= 2) return 'Very Easy';
    if (rpe <= 4) return 'Light';
    if (rpe <= 6) return 'Moderate';
    if (rpe <= 8) return 'Hard';
    if (rpe == 9) return 'Very Hard';
    return 'Maximum Effort 🔥';
  }

  String _formatElapsed() {
    final m = _elapsed.inMinutes.toString().padLeft(2, '0');
    final s = (_elapsed.inSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppColors.brandNavyDark,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: const BoxDecoration(
                  gradient: AppGradients.brandGradient,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.fitness_center_rounded,
                    color: Colors.white, size: 36),
              ),
              const SizedBox(height: 20),
              const Text('Loading workout...',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600)),
              const SizedBox(height: 16),
              const SizedBox(
                width: 32,
                height: 32,
                child: CircularProgressIndicator(
                    color: AppColors.brandCopper, strokeWidth: 2.5),
              ),
            ],
          ),
        ),
      );
    }

    if (_exercises.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.paperBackground,
        appBar: AppBar(title: const Text('Active Session')),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'No exercises found for this session.\nThe plan may still be generating.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary, fontSize: 16),
            ),
          ),
        ),
      );
    }

    final total = _totalSets;
    final done = _completedSets;
    final focus = _todaySession?['focus'] as String? ?? 'Training';
    final durationTarget = _todaySession?['durationMinutes'] as int?;
    final isAllDone = total > 0 && done == total;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.paperBackground,
        body: Column(
          children: [
            // ── Sticky header (dark navy) ───────────────────────────────
            _WorkoutHeader(
              dayNumber: _effectiveDayNumber,
              focus: focus,
              elapsed: _formatElapsed(),
              done: done,
              total: total,
              durationTarget: durationTarget,
              progressAnim: _progressAnim,
              progressAnimCtrl: _progressAnimCtrl,
              isSubmitting: _isSubmitting,
              isAllDone: isAllDone,
              onFinish: _finishWorkout,
            ),

            // ── Exercise list ───────────────────────────────────────────
            Expanded(
              child: ListView(
                padding:
                    const EdgeInsets.fromLTRB(14, 14, 14, 100),
                children: [
                  // Category group labels
                  ...List.generate(_exercises.length, (i) {
                    final showLabel = i == 0 ||
                        (_exercises[i]['category'] as String? ?? '') !=
                            (_exercises[i - 1]['category'] as String? ?? '');
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (showLabel)
                          Padding(
                            padding:
                                const EdgeInsets.fromLTRB(4, 8, 4, 8),
                            child: _CategoryLabel(
                                _exercises[i]['category'] as String? ?? ''),
                          ),
                        _buildExerciseCard(i),
                      ],
                    );
                  }),
                ],
              ),
            ),
          ],
        ),

        // ── Floating finish button (appears when workout is done) ───
        floatingActionButton: isAllDone && !_isSubmitting
            ? FloatingActionButton.extended(
                onPressed: _finishWorkout,
                backgroundColor: AppColors.success,
                icon: const Icon(Icons.check_circle_rounded,
                    color: Colors.white),
                label: const Text('All Done! Finish',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w700)),
              )
            : null,
        floatingActionButtonLocation:
            FloatingActionButtonLocation.centerFloat,
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
    final isExpanded = _expanded[i] ?? false;

    final completed = _setCompleted[i] ?? [];
    final doneCount = completed.where((v) => v).length;
    final allDone = completed.isNotEmpty && completed.every((v) => v);
    final anyDone = completed.any((v) => v);

    // Card accent color based on state
    final cardBorderColor = allDone
        ? AppColors.success
        : anyDone
            ? AppColors.brandCopper
            : AppColors.divider;
    final cardBorderWidth = (allDone || anyDone) ? 1.5 : 1.0;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: allDone
            ? AppColors.success.withOpacity(0.04)
            : AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: cardBorderColor, width: cardBorderWidth),
        boxShadow: [
          BoxShadow(
            color: (allDone
                    ? AppColors.success
                    : anyDone
                        ? AppColors.brandCopper
                        : AppColors.brandNavy)
                .withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Exercise header ─────────────────────────────────────────
          InkWell(
            onTap: () =>
                setState(() => _expanded[i] = !isExpanded),
            borderRadius: BorderRadius.circular(AppRadius.xl),
            splashColor: AppColors.brandCopper.withOpacity(0.08),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
              child: Row(
                children: [
                  // Icon / check indicator
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: allDone
                          ? AppColors.success.withOpacity(0.15)
                          : anyDone
                              ? AppColors.brandCopper.withOpacity(0.12)
                              : AppColors.paperBackground,
                      borderRadius: BorderRadius.circular(AppRadius.lg),
                      border: Border.all(
                        color: allDone
                            ? AppColors.success.withOpacity(0.3)
                            : anyDone
                                ? AppColors.brandCopper.withOpacity(0.3)
                                : AppColors.divider,
                      ),
                    ),
                    child: Center(
                      child: allDone
                          ? const Icon(Icons.check_rounded,
                              color: AppColors.success, size: 22)
                          : Text(
                              '$doneCount/$targetSets',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                color: anyDone
                                    ? AppColors.brandCopper
                                    : AppColors.textSecondary,
                              ),
                            ),
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
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                            color: allDone
                                ? AppColors.textSecondary
                                : AppColors.textPrimary,
                            decoration: allDone
                                ? TextDecoration.lineThrough
                                : null,
                            decorationColor: AppColors.success,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          '$targetSets sets × $reps reps'
                          '${restSec != null ? ' · ${restSec}s rest' : ''}'
                          '${targetRpe != null ? ' · RPE ${targetRpe.round()}' : ''}',
                          style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary),
                        ),
                        if (category.isNotEmpty)
                          Container(
                            margin: const EdgeInsets.only(top: 4),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 7, vertical: 2),
                            decoration: BoxDecoration(
                              color: _categoryColor(category)
                                  .withOpacity(0.12),
                              borderRadius:
                                  BorderRadius.circular(AppRadius.sm),
                            ),
                            child: Text(
                              category.toUpperCase(),
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w700,
                                color: _categoryColor(category),
                                letterSpacing: 1.2,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  // Expand chevron with animation
                  AnimatedRotation(
                    turns: isExpanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: const Icon(
                      Icons.keyboard_arrow_down_rounded,
                      color: AppColors.textSecondary,
                      size: 22,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Expanded set rows ───────────────────────────────────────
          AnimatedCrossFade(
            duration: const Duration(milliseconds: 220),
            crossFadeState: isExpanded
                ? CrossFadeState.showFirst
                : CrossFadeState.showSecond,
            firstChild: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Divider(
                    height: 1,
                    thickness: 1,
                    color: AppColors.divider,
                    indent: 16,
                    endIndent: 16),
                // Column header
                const Padding(
                  padding: EdgeInsets.fromLTRB(16, 10, 16, 6),
                  child: Row(
                    children: [
                      _HeaderCell('SET', width: 36),
                      SizedBox(width: 10),
                      _HeaderCell('REPS', expanded: true,
                          align: TextAlign.center),
                      SizedBox(width: 8),
                      _HeaderCell('KG', expanded: true,
                          align: TextAlign.center),
                      SizedBox(width: 8),
                      _HeaderCell('✓', width: 48,
                          align: TextAlign.center),
                    ],
                  ),
                ),
                for (var j = 0; j < targetSets; j++)
                  _buildSetRow(i, j),
                const SizedBox(height: 12),
              ],
            ),
            secondChild: const SizedBox.shrink(),
          ),
        ],
      ),
    );
  }

  Widget _buildSetRow(int exerciseIdx, int setIdx) {
    final repsCtrl = _repsControllers[exerciseIdx]?[setIdx];
    final loadCtrl = _loadControllers[exerciseIdx]?[setIdx];
    final done = _setCompleted[exerciseIdx]?[setIdx] ?? false;
    if (repsCtrl == null || loadCtrl == null) return const SizedBox.shrink();

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      margin: const EdgeInsets.fromLTRB(12, 3, 12, 3),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: done
            ? AppColors.success.withOpacity(0.07)
            : (setIdx % 2 == 0
                ? AppColors.paperBackground
                : Colors.transparent),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: done
            ? Border.all(color: AppColors.success.withOpacity(0.25))
            : null,
      ),
      child: Row(
        children: [
          // Set number badge
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: done
                  ? AppColors.success.withOpacity(0.15)
                  : AppColors.brandNavy.withOpacity(0.08),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Center(
              child: Text(
                '${setIdx + 1}',
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                  color: done
                      ? AppColors.success
                      : AppColors.brandNavy,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),

          // Reps field
          Expanded(
            child: _SetField(
              controller: repsCtrl,
              done: done,
              keyboardType: TextInputType.number,
              suffix: 'r',
            ),
          ),
          const SizedBox(width: 8),

          // Weight field
          Expanded(
            child: _SetField(
              controller: loadCtrl,
              done: done,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              suffix: 'kg',
            ),
          ),
          const SizedBox(width: 8),

          // Done toggle — large tap target
          GestureDetector(
            onTap: () => _onSetToggled(exerciseIdx, setIdx, !done),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: 48,
              height: 40,
              decoration: BoxDecoration(
                color: done
                    ? AppColors.success
                    : AppColors.paperBackground,
                borderRadius: BorderRadius.circular(AppRadius.md),
                border: Border.all(
                  color: done
                      ? AppColors.success
                      : AppColors.divider,
                  width: done ? 0 : 1.5,
                ),
              ),
              child: Center(
                child: Icon(
                  done
                      ? Icons.check_rounded
                      : Icons.radio_button_unchecked_rounded,
                  color: done ? Colors.white : AppColors.divider,
                  size: done ? 20 : 18,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _categoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'warmup':
        return AppColors.warning;
      case 'primary':
        return AppColors.brandCopper;
      case 'accessory':
        return AppColors.brandNavy;
      case 'conditioning':
        return AppColors.success;
      default:
        return AppColors.textSecondary;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sticky workout header widget
// ─────────────────────────────────────────────────────────────────────────────

class _WorkoutHeader extends StatelessWidget {
  final int dayNumber;
  final String focus;
  final String elapsed;
  final int done;
  final int total;
  final int? durationTarget;
  final Animation<double> progressAnim;
  final AnimationController progressAnimCtrl;
  final bool isSubmitting;
  final bool isAllDone;
  final VoidCallback onFinish;

  const _WorkoutHeader({
    required this.dayNumber,
    required this.focus,
    required this.elapsed,
    required this.done,
    required this.total,
    required this.durationTarget,
    required this.progressAnim,
    required this.progressAnimCtrl,
    required this.isSubmitting,
    required this.isAllDone,
    required this.onFinish,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: AppGradients.navyGradient,
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top row: back + title + finish
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
              child: Row(
                children: [
                  IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      child: const Icon(Icons.arrow_back_rounded,
                          color: Colors.white, size: 18),
                    ),
                    onPressed: () => Navigator.maybePop(context),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Day $dayNumber',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.55),
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1.5,
                          ),
                        ),
                        Text(
                          focus,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.3,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  // Finish button — an early-exit option while the workout
                  // is still in progress. Once every set is done, the
                  // floating "All Done!" button below takes over as the
                  // single finish action, so this one steps aside instead
                  // of showing two buttons that do the same thing at once.
                  isSubmitting
                      ? const Padding(
                          padding: EdgeInsets.all(16),
                          child: SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2),
                          ),
                        )
                      : isAllDone
                          ? const SizedBox(width: 8)
                          : GestureDetector(
                          onTap: onFinish,
                          child: Container(
                            margin: const EdgeInsets.only(right: 8),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            decoration: BoxDecoration(
                              gradient: AppGradients.copperGradient,
                              borderRadius:
                                  BorderRadius.circular(AppRadius.md),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.brandCopper
                                      .withOpacity(0.35),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                )
                              ],
                            ),
                            child: const Text(
                              'FINISH',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1,
                              ),
                            ),
                          ),
                        ),
                ],
              ),
            ),

            // Live stats row
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 6),
              child: Row(
                children: [
                  _StatPill(
                    icon: Icons.timer_outlined,
                    value: elapsed,
                    label: 'elapsed',
                  ),
                  const SizedBox(width: 12),
                  _StatPill(
                    icon: Icons.fitness_center_rounded,
                    value: '$done/$total',
                    label: 'sets',
                  ),
                  if (durationTarget != null) ...[
                    const SizedBox(width: 12),
                    _StatPill(
                      icon: Icons.flag_outlined,
                      value: '~${durationTarget}m',
                      label: 'target',
                    ),
                  ],
                ],
              ),
            ),

            // Animated progress bar
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 6, 20, 6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '$done of $total sets complete',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.55),
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      AnimatedBuilder(
                        animation: progressAnim,
                        builder: (_, __) => Text(
                          '${(progressAnim.value * 100).round()}%',
                          style: const TextStyle(
                            color: AppColors.brandCopperSoft,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(AppRadius.full),
                    child: AnimatedBuilder(
                      animation: progressAnim,
                      builder: (_, __) => LinearProgressIndicator(
                        value: progressAnim.value,
                        backgroundColor: Colors.white.withOpacity(0.12),
                        valueColor: const AlwaysStoppedAnimation<Color>(
                            AppColors.brandCopper),
                        minHeight: 8,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  const _StatPill(
      {required this.icon, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppRadius.md),
        border:
            Border.all(color: Colors.white.withOpacity(0.15)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, color: AppColors.brandCopperSoft, size: 14),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w800)),
            Text(label,
                style: TextStyle(
                    color: Colors.white.withOpacity(0.5),
                    fontSize: 9,
                    fontWeight: FontWeight.w500)),
          ],
        ),
      ]),
    );
  }
}

class _CategoryLabel extends StatelessWidget {
  final String category;
  const _CategoryLabel(this.category);

  @override
  Widget build(BuildContext context) {
    Color color;
    IconData icon;
    switch (category.toLowerCase()) {
      case 'warmup':
        color = AppColors.warning;
        icon = Icons.whatshot_rounded;
        break;
      case 'primary':
        color = AppColors.brandCopper;
        icon = Icons.bolt_rounded;
        break;
      case 'accessory':
        color = AppColors.brandNavy;
        icon = Icons.add_circle_outline_rounded;
        break;
      case 'conditioning':
        color = AppColors.success;
        icon = Icons.directions_run_rounded;
        break;
      default:
        color = AppColors.textSecondary;
        icon = Icons.fitness_center_rounded;
    }

    return Row(
      children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: 6),
        Text(
          category.toUpperCase(),
          style: TextStyle(
            color: color,
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 2,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sub-widgets
// ─────────────────────────────────────────────────────────────────────────────

class _HeaderCell extends StatelessWidget {
  final String text;
  final double? width;
  final bool expanded;
  final TextAlign align;
  const _HeaderCell(this.text,
      {this.width, this.expanded = false, this.align = TextAlign.left});

  @override
  Widget build(BuildContext context) {
    final child = Text(text,
        textAlign: align,
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondary,
          letterSpacing: 1.5,
        ));
    if (width != null) return SizedBox(width: width, child: child);
    return expanded ? Expanded(child: child) : child;
  }
}

class _SetField extends StatelessWidget {
  final TextEditingController controller;
  final bool done;
  final TextInputType keyboardType;
  final String suffix;

  const _SetField({
    required this.controller,
    required this.done,
    required this.keyboardType,
    required this.suffix,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      textAlign: TextAlign.center,
      style: TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w700,
        color: done ? AppColors.success : AppColors.textPrimary,
      ),
      decoration: InputDecoration(
        isDense: true,
        suffixText: suffix,
        suffixStyle: TextStyle(
            fontSize: 11,
            color: done
                ? AppColors.success.withOpacity(0.7)
                : AppColors.textSecondary),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
        filled: true,
        fillColor: done
            ? AppColors.success.withOpacity(0.08)
            : AppColors.paperBackground,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: BorderSide(
            color: done
                ? AppColors.success.withOpacity(0.3)
                : AppColors.divider,
            width: 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.md),
          borderSide: const BorderSide(
            color: AppColors.brandCopper,
            width: 1.5,
          ),
        ),
      ),
    );
  }
}
