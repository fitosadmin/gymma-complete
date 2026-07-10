import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../data/fitos_repository.dart';
import '../theme.dart';
import '../widgets/shimmer.dart';
import '../widgets/gradient_button.dart';
import '../widgets/branded_expansion_tile.dart';
import 'assessment_screen.dart';
import 'active_workout_screen.dart';
import 'workout_plan_view_screen.dart';

class WorkoutDashboardScreen extends StatefulWidget {
  const WorkoutDashboardScreen({super.key});

  @override
  State<WorkoutDashboardScreen> createState() =>
      _WorkoutDashboardScreenState();
}

class _WorkoutDashboardScreenState extends State<WorkoutDashboardScreen>
    with TickerProviderStateMixin {
  bool _isLoading = true;
  Map<String, dynamic>? _activePlan;
  List<dynamic> _recentSessions = [];

  late AnimationController _entranceCtrl;

  @override
  void initState() {
    super.initState();
    _entranceCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _loadData();
  }

  @override
  void dispose() {
    _entranceCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final plans = await FitosRepository.instance.listUserPlans();
      if (plans.isNotEmpty) {
        _activePlan = plans.first;
        final planId = _activePlan!['id'];
        _recentSessions =
            await FitosRepository.instance.listSessions(planId: planId);
      } else {
        _activePlan = null;
        _recentSessions = [];
      }
    } catch (e) {
      debugPrint('Error loading workout data: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
        _entranceCtrl.forward(from: 0);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: AppColors.paperBackground,
        body: _isLoading
            ? _buildShimmer()
            : _activePlan == null
                ? _buildEmptyState()
                : _buildActiveState(),
      ),
    );
  }

  // ── Shimmer loading ─────────────────────────────────────────────────────
  Widget _buildShimmer() {
    return CustomScrollView(
      physics: const NeverScrollableScrollPhysics(),
      slivers: [
        _appBar(title: 'My Workouts', loading: true),
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              const ShimmerCard(height: 220),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(child: ShimmerBox(width: double.infinity, height: 90, borderRadius: BorderRadius.circular(AppRadius.xl))),
                const SizedBox(width: 12),
                Expanded(child: ShimmerBox(width: double.infinity, height: 90, borderRadius: BorderRadius.circular(AppRadius.xl))),
                const SizedBox(width: 12),
                Expanded(child: ShimmerBox(width: double.infinity, height: 90, borderRadius: BorderRadius.circular(AppRadius.xl))),
              ]),
              const SizedBox(height: 16),
              ShimmerBox(width: double.infinity, height: 74, borderRadius: BorderRadius.circular(AppRadius.xl)),
              const SizedBox(height: 10),
              ShimmerBox(width: double.infinity, height: 74, borderRadius: BorderRadius.circular(AppRadius.xl)),
              const SizedBox(height: 10),
              ShimmerBox(width: double.infinity, height: 74, borderRadius: BorderRadius.circular(AppRadius.xl)),
            ]),
          ),
        ),
      ],
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  Widget _buildEmptyState() {
    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        _appBar(title: 'My Workouts'),
        SliverFillRemaining(
          hasScrollBody: false,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      gradient: AppGradients.brandGradient,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.brandCopper.withOpacity(0.3),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                        )
                      ],
                    ),
                    child: const Icon(Icons.fitness_center_rounded,
                        color: Colors.white, size: 48),
                  ),
                  const SizedBox(height: 28),
                  const Text(
                    'No Active Plan',
                    style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: AppColors.textPrimary,
                        letterSpacing: -0.5),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Let our AI build a custom workout plan\ntailored to your fitness goals.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 15,
                        color: AppColors.textSecondary,
                        height: 1.5),
                  ),
                  const SizedBox(height: 36),
                  GradientButton(
                    label: 'Generate My Plan',
                    icon: Icons.auto_awesome_rounded,
                    onPressed: () async {
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const AssessmentScreen()),
                      );
                      _loadData();
                    },
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Powered by AI · Takes ~3 min',
                    style: TextStyle(
                        color: AppColors.textSecondary.withOpacity(0.7),
                        fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ── Active state ────────────────────────────────────────────────────────
  Widget _buildActiveState() {
    final programParams =
        (_activePlan?['programParameters'] as Map<String, dynamic>?);
    final String planName =
        programParams?['split']?.toString() ?? 'Custom Plan';
    final int freq = (programParams?['frequency'] as num?)?.toInt() ?? 4;
    final int totalWeeks =
        (programParams?['totalWeeks'] as num?)?.toInt() ?? 8;
    final int sessionsDone = _recentSessions.length;
    final int nextDay = (sessionsDone % freq) + 1;
    final double progress = (sessionsDone / (totalWeeks * freq)).clamp(0.0, 1.0);

    final totalVolume = _recentSessions.fold<double>(0, (sum, s) {
      final logs = (s['performanceLogs'] as List?) ?? [];
      return sum + logs.fold<double>(0, (lSum, l) {
        final max = (l['maxLoad'] as num?)?.toDouble() ?? 0;
        final completed = (l['completedSets'] as num?)?.toInt() ?? 0;
        return lSum + max * completed;
      });
    });

    return RefreshIndicator(
      color: AppColors.brandCopper,
      backgroundColor: AppColors.surface,
      onRefresh: _loadData,
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          _appBar(title: 'My Workouts'),

          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // ── Active Plan Hero Card ─────────────────────────────
                _FadeSlide(
                  index: 0,
                  ctrl: _entranceCtrl,
                  child: _PlanHeroCard(
                    planName: planName,
                    freq: freq,
                    totalWeeks: totalWeeks,
                    nextDay: nextDay,
                    progress: progress,
                    onStartWorkout: () async {
                      final result = await Navigator.push<bool>(
                        context,
                        MaterialPageRoute(
                          builder: (_) => ActiveWorkoutScreen(
                            planId: _activePlan!['id'] as String,
                            dayNumber: nextDay,
                          ),
                        ),
                      );
                      if (result == true) _loadData();
                    },
                    onViewPlan: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => WorkoutPlanViewScreen(
                            planId: _activePlan!['id'] as String,
                          ),
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(height: 28),

                // ── Stats row ─────────────────────────────────────────
                if (_recentSessions.isNotEmpty) ...[
                  _FadeSlide(
                    index: 1,
                    ctrl: _entranceCtrl,
                    child: const _SectionLabel(
                        eyebrow: 'OVERVIEW', title: 'Progress'),
                  ),
                  const SizedBox(height: 14),
                  _FadeSlide(
                    index: 2,
                    ctrl: _entranceCtrl,
                    child: Row(
                      children: [
                        Expanded(
                            child: _StatCard(
                          value: sessionsDone.toString(),
                          label: 'Sessions',
                          icon: Icons.calendar_today_rounded,
                          color: AppColors.brandCopper,
                        )),
                        const SizedBox(width: 10),
                        Expanded(
                            child: _StatCard(
                          value: '${(totalVolume / 1000).toStringAsFixed(1)}t',
                          label: 'Volume',
                          icon: Icons.bar_chart_rounded,
                          color: AppColors.brandNavy,
                        )),
                        const SizedBox(width: 10),
                        Expanded(
                            child: _StatCard(
                          value: _computeStreak().toString(),
                          label: 'Streak',
                          icon: Icons.local_fire_department_rounded,
                          color: AppColors.warning,
                          onInfoTap: () => _showStreakInfo(context),
                        )),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),
                ],

                // ── Session History ───────────────────────────────────
                _FadeSlide(
                  index: 3,
                  ctrl: _entranceCtrl,
                  child: const _SectionLabel(
                      eyebrow: 'HISTORY', title: 'Sessions'),
                ),
                const SizedBox(height: 14),

                if (_recentSessions.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: Column(children: [
                        Icon(Icons.inbox_rounded,
                            color: AppColors.divider, size: 40),
                        SizedBox(height: 10),
                        Text(
                            'No sessions logged yet.\nStart your first workout!',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                color: AppColors.textSecondary, height: 1.5)),
                      ]),
                    ),
                  )
                else
                  ..._recentSessions.asMap().entries.map((e) => _FadeSlide(
                        index: 4 + e.key,
                        ctrl: _entranceCtrl,
                        child: _buildSessionCard(e.value),
                      )),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  SliverAppBar _appBar({required String title, bool loading = false}) {
    return SliverAppBar(
      pinned: true,
      backgroundColor: AppColors.paperBackground,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 1,
      shadowColor: AppColors.divider,
      title: Text(title,
          style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 20,
              color: AppColors.textPrimary,
              letterSpacing: -0.3)),
      actions: [
        if (!loading)
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.divider.withOpacity(0.5),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: const Icon(Icons.refresh_rounded,
                  color: AppColors.textPrimary, size: 18),
            ),
            onPressed: _loadData,
          ),
        const SizedBox(width: 4),
      ],
    );
  }

  void _showStreakInfo(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('How streak works'),
        content: const Text(
            'Counts consecutive workout days, most recent first. A gap of more '
            'than 2 days — or a session marked "missed" — resets it back to zero.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Got it')),
        ],
      ),
    );
  }

  int _computeStreak() {
    if (_recentSessions.isEmpty) return 0;
    var streak = 0;
    DateTime? prev;
    for (final s in _recentSessions) {
      if (s['status'] == 'missed') break;
      final dateStr = s['sessionDate'] as String? ?? '';
      final dt = DateTime.tryParse(dateStr)?.toLocal();
      if (dt == null) break;
      final day = DateTime(dt.year, dt.month, dt.day);
      if (prev == null || prev.difference(day).inDays <= 2) {
        streak++;
        prev = day;
      } else {
        break;
      }
    }
    return streak;
  }

  Widget _buildSessionCard(dynamic session) {
    final dateStr = session['sessionDate'] as String? ?? '';
    final parsed = DateTime.tryParse(dateStr)?.toLocal();
    final displayDate = parsed != null
        ? '${parsed.day}/${parsed.month}/${parsed.year}'
        : dateStr;
    final duration = (session['durationMinutes'] as num?)?.toInt() ?? 0;
    final dayNum = session['dayNumber'] as int? ?? 0;
    final status = session['status'] as String? ?? '';
    final rpeAvg = (session['rpeAverage'] as num?)?.toStringAsFixed(1);
    final performanceLogs = (session['performanceLogs'] as List?) ?? [];

    final statusColor = status == 'completed'
        ? AppColors.success
        : status == 'partial'
            ? AppColors.warning
            : AppColors.neutral400;

    final totalCompleted = performanceLogs.fold<int>(
        0, (sum, l) => sum + ((l['completedSets'] as num?)?.toInt() ?? 0));
    final totalTarget = performanceLogs.fold<int>(
        0, (sum, l) => sum + ((l['targetSets'] as num?)?.toInt() ?? 0));
    final maxLoadAll = performanceLogs.fold<double>(0, (max, l) {
      final load = (l['maxLoad'] as num?)?.toDouble() ?? 0;
      return load > max ? load : max;
    });

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: AppColors.divider),
        boxShadow: [
          BoxShadow(
            color: AppColors.brandNavy.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          )
        ],
      ),
      child: BrandedExpansionTile(
          tilePadding: const EdgeInsets.fromLTRB(16, 6, 16, 6),
          leading: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(
                  color: statusColor.withOpacity(0.3), width: 1.5),
            ),
            child: Icon(Icons.fitness_center_rounded,
                color: statusColor, size: 18),
          ),
          title: Text(
            'Day $dayNum · ${_capitalise(status)}',
            style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 15,
                color: AppColors.textPrimary),
          ),
          subtitle: Text(
            displayDate,
            style: const TextStyle(
                color: AppColors.textSecondary, fontSize: 12),
          ),
          trailingExtra: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (duration > 0)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.brandCopper.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(AppRadius.full),
                  ),
                  child: Text('$duration min',
                      style: const TextStyle(
                          fontWeight: FontWeight.w700,
                          color: AppColors.brandCopper,
                          fontSize: 12)),
                ),
              if (rpeAvg != null) ...[
                const SizedBox(height: 4),
                Text('RPE $rpeAvg',
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 11)),
              ]
            ],
          ),
          children: [
            Container(
              margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.paperBackground,
                borderRadius: BorderRadius.circular(AppRadius.lg),
              ),
              child: performanceLogs.isEmpty
                  ? const Text('No exercise data logged.',
                      style: TextStyle(
                          color: AppColors.textSecondary, fontSize: 13))
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Summary row
                        Row(children: [
                          _MiniStat('Sets', '$totalCompleted/$totalTarget'),
                          const SizedBox(width: 20),
                          if (maxLoadAll > 0)
                            _MiniStat('Top Load',
                                '${maxLoadAll.toStringAsFixed(1)} kg'),
                        ]),
                        const SizedBox(height: 10),
                        const Divider(height: 1),
                        const SizedBox(height: 8),
                        ...performanceLogs.map<Widget>((log) {
                          final completed =
                              (log['completedSets'] as num?)?.toInt() ?? 0;
                          final target =
                              (log['targetSets'] as num?)?.toInt() ?? 0;
                          final maxLoad =
                              (log['maxLoad'] as num?)?.toDouble();
                          final done = completed == target;
                          return Padding(
                            padding: const EdgeInsets.symmetric(vertical: 3),
                            child: Row(children: [
                              Icon(
                                done
                                    ? Icons.check_circle_rounded
                                    : Icons.radio_button_unchecked_rounded,
                                size: 14,
                                color: done
                                    ? AppColors.success
                                    : AppColors.divider,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text('$completed/$target sets',
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textPrimary)),
                              ),
                              if (maxLoad != null && maxLoad > 0)
                                Text(
                                  '${maxLoad.toStringAsFixed(1)} kg',
                                  style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary),
                                ),
                            ]),
                          );
                        }),
                      ],
                    ),
            ),
          ],
        ),
    );
  }

  String _capitalise(String s) =>
      s.isEmpty ? '' : '${s[0].toUpperCase()}${s.substring(1)}';
}

// ── Sub-widgets ──────────────────────────────────────────────────────────────

class _PlanHeroCard extends StatelessWidget {
  final String planName;
  final int freq;
  final int totalWeeks;
  final int nextDay;
  final double progress;
  final VoidCallback onStartWorkout;
  final VoidCallback onViewPlan;

  const _PlanHeroCard({
    required this.planName,
    required this.freq,
    required this.totalWeeks,
    required this.nextDay,
    required this.progress,
    required this.onStartWorkout,
    required this.onViewPlan,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: AppGradients.navyGradient,
        borderRadius: BorderRadius.circular(AppRadius.xxl),
        boxShadow: [
          BoxShadow(
            color: AppColors.brandNavy.withOpacity(0.4),
            blurRadius: 28,
            offset: const Offset(0, 12),
          )
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -20,
            top: -20,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.brandCopper.withOpacity(0.1),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppColors.brandCopper.withOpacity(0.2),
                      border: Border.all(
                          color: AppColors.brandCopper.withOpacity(0.4)),
                      borderRadius: BorderRadius.circular(AppRadius.full),
                    ),
                    child: Row(children: [
                      const Icon(Icons.bolt_rounded,
                          color: AppColors.brandCopper, size: 12),
                      const SizedBox(width: 4),
                      Text(
                        '$freq days/week · $totalWeeks weeks',
                        style: const TextStyle(
                            color: AppColors.brandCopper,
                            fontSize: 11,
                            fontWeight: FontWeight.w700),
                      ),
                    ]),
                  ),
                ]),
                const SizedBox(height: 14),
                Text(
                  planName,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5),
                ),
                const SizedBox(height: 4),
                Text(
                  'Day $nextDay up next',
                  style: TextStyle(
                      color: Colors.white.withOpacity(0.55), fontSize: 13),
                ),
                const SizedBox(height: 20),

                // Progress bar
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Overall Progress',
                        style: TextStyle(
                            color: Colors.white.withOpacity(0.5),
                            fontSize: 11,
                            fontWeight: FontWeight.w600),
                      ),
                      Text(
                        '${(progress * 100).round()}%',
                        style: const TextStyle(
                            color: AppColors.brandCopperSoft,
                            fontSize: 11,
                            fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(AppRadius.full),
                    child: LinearProgressIndicator(
                      value: progress,
                      backgroundColor: Colors.white.withOpacity(0.12),
                      valueColor: const AlwaysStoppedAnimation<Color>(
                          AppColors.brandCopper),
                      minHeight: 6,
                    ),
                  ),
                ]),

                const SizedBox(height: 20),
                GradientButton(
                  label: 'Start Day $nextDay',
                  icon: Icons.play_arrow_rounded,
                  onPressed: onStartWorkout,
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 42,
                  child: OutlinedButton(
                    onPressed: onViewPlan,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white70,
                      side: BorderSide(color: Colors.white.withOpacity(0.2)),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md)),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.list_alt_rounded, size: 16),
                        SizedBox(width: 6),
                        Text('View Full Plan',
                            style: TextStyle(fontSize: 13)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback? onInfoTap;
  const _StatCard(
      {required this.value,
      required this.label,
      required this.icon,
      required this.color,
      this.onInfoTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: AppColors.divider),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.07),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Icon(icon, color: color, size: 16),
            ),
            if (onInfoTap != null)
              GestureDetector(
                onTap: onInfoTap,
                child: Icon(Icons.info_outline_rounded,
                    size: 15, color: AppColors.textSecondary.withOpacity(0.6)),
              ),
          ],
        ),
        const SizedBox(height: 10),
        Text(value,
            style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: color)),
        Text(label,
            style: const TextStyle(
                color: AppColors.textSecondary, fontSize: 11)),
      ]),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String eyebrow;
  final String title;
  const _SectionLabel({required this.eyebrow, required this.title});

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(eyebrow,
              style: const TextStyle(
                  color: AppColors.brandCopper,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 2.5)),
          const SizedBox(height: 2),
          Text(title,
              style: const TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.3)),
        ],
      );
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  const _MiniStat(this.label, this.value);
  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 10, color: AppColors.textSecondary)),
          Text(value,
              style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary)),
        ],
      );
}

class _FadeSlide extends StatelessWidget {
  final int index;
  final AnimationController ctrl;
  final Widget child;
  const _FadeSlide(
      {required this.index, required this.ctrl, required this.child});

  @override
  Widget build(BuildContext context) {
    final delay = (index * 0.07).clamp(0.0, 0.8);
    final end = (delay + 0.35).clamp(0.0, 1.0);
    final fade = Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(
            parent: ctrl,
            curve: Interval(delay, end, curve: Curves.easeOut)));
    final slide = Tween<Offset>(
            begin: const Offset(0, 0.09), end: Offset.zero)
        .animate(CurvedAnimation(
            parent: ctrl,
            curve: Interval(delay, end, curve: Curves.easeOut)));
    return FadeTransition(
        opacity: fade, child: SlideTransition(position: slide, child: child));
  }
}
