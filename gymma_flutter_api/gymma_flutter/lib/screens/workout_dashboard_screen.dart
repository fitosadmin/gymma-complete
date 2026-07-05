import 'package:flutter/material.dart';
import '../data/fitos_repository.dart';
import '../theme.dart';
import 'assessment_screen.dart';
import 'active_workout_screen.dart';
import 'workout_plan_view_screen.dart';

class WorkoutDashboardScreen extends StatefulWidget {
  const WorkoutDashboardScreen({super.key});

  @override
  State<WorkoutDashboardScreen> createState() => _WorkoutDashboardScreenState();
}

class _WorkoutDashboardScreenState extends State<WorkoutDashboardScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _activePlan;
  List<dynamic> _recentSessions = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final plans = await FitosRepository.instance.listUserPlans();
      if (plans.isNotEmpty) {
        _activePlan = plans.first;
        final planId = _activePlan!['id'];
        _recentSessions = await FitosRepository.instance.listSessions(planId: planId);
      } else {
        _activePlan = null;
        _recentSessions = [];
      }
    } catch (e) {
      debugPrint('Error loading workout data: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('My Workouts', style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: AppColors.neutral50,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _activePlan == null ? _buildEmptyState() : _buildActiveState(),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.primary500.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.fitness_center, size: 64, color: AppColors.primary500),
            ),
            const SizedBox(height: 24),
            const Text(
              "No Active Plan",
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            const Text(
              "Let our AI build a custom workout plan tailored to your fitness goals.",
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 16, color: AppColors.neutral500),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () async {
                  await Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const AssessmentScreen()),
                  );
                  _loadData();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary500,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                ),
                child: const Text('Generate Custom Plan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveState() {
    final programParams =
        (_activePlan?['programParameters'] as Map<String, dynamic>?);
    final String planName =
        programParams?['split']?.toString() ?? 'Custom Plan';
    final int freq = (programParams?['frequency'] as num?)?.toInt() ?? 4;
    final int totalWeeks =
        (programParams?['totalWeeks'] as num?)?.toInt() ?? 8;
    final String subtitle = '$freq days/week · $totalWeeks weeks';

    final int sessionsDone = _recentSessions.length;
    final int nextDay = (sessionsDone % freq) + 1;

    // Compute simple analytics from logged sessions
    final totalVolume = _recentSessions.fold<double>(0, (sum, s) {
      final logs = (s['performanceLogs'] as List?) ?? [];
      return sum + logs.fold<double>(0, (lSum, l) {
        final max = (l['maxLoad'] as num?)?.toDouble() ?? 0;
        final completed = (l['completedSets'] as num?)?.toInt() ?? 0;
        return lSum + max * completed;
      });
    });

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Active Plan Card ──────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppColors.primary500, AppColors.secondary500],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(AppRadius.lg),
              boxShadow: const [
                BoxShadow(
                    color: Colors.black12, blurRadius: 10, offset: Offset(0, 4)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      subtitle.toUpperCase(),
                      style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.1),
                    ),
                    const Icon(Icons.bolt, color: Colors.white70),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  planName,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  'Day $nextDay up next',
                  style: const TextStyle(color: Colors.white60, fontSize: 13),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () async {
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
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.primary500,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md)),
                    ),
                    child: Text('Start Day $nextDay',
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  height: 40,
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => WorkoutPlanViewScreen(
                            planId: _activePlan!['id'] as String,
                          ),
                        ),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white70,
                      side: const BorderSide(color: Colors.white30),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md)),
                    ),
                    child: const Text('View Full Plan',
                        style: TextStyle(fontSize: 13)),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // ── Progress Analytics ────────────────────────────────────────────
          if (_recentSessions.isNotEmpty) ...[
            const Text('Progress Overview',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _statCard(
                    'Sessions',
                    sessionsDone.toString(),
                    Icons.calendar_today_outlined,
                    AppColors.primary500,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _statCard(
                    'Est. Volume',
                    '${(totalVolume / 1000).toStringAsFixed(1)}t',
                    Icons.bar_chart,
                    AppColors.secondary500,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _statCard(
                    'Streak',
                    _computeStreak().toString(),
                    Icons.local_fire_department,
                    AppColors.warning,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
          ],

          // ── Session History ───────────────────────────────────────────────
          const Text('Session History',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
          const SizedBox(height: 16),

          if (_recentSessions.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Text('No sessions logged yet. Start your first workout!',
                  style: TextStyle(color: AppColors.neutral500)),
            )
          else
            ..._recentSessions.map((session) => _buildSessionCard(session)),
        ],
      ),
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.neutral200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 8),
          Text(value,
              style: TextStyle(
                  fontSize: 22, fontWeight: FontWeight.bold, color: color)),
          Text(label,
              style: const TextStyle(
                  color: AppColors.neutral500, fontSize: 11)),
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

    // Aggregate stats from performance logs
    final totalCompleted =
        performanceLogs.fold<int>(0, (sum, l) => sum + ((l['completedSets'] as num?)?.toInt() ?? 0));
    final totalTarget =
        performanceLogs.fold<int>(0, (sum, l) => sum + ((l['targetSets'] as num?)?.toInt() ?? 0));
    final maxLoadAll = performanceLogs.fold<double>(0, (max, l) {
      final load = (l['maxLoad'] as num?)?.toDouble() ?? 0;
      return load > max ? load : max;
    });
    final bestE1RM = performanceLogs.fold<double>(0, (max, l) {
      final e = (l['estimatedE1RM'] as num?)?.toDouble() ?? 0;
      return e > max ? e : max;
    });

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.neutral200),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.fromLTRB(14, 4, 14, 4),
          leading: Container(
            padding: const EdgeInsets.all(9),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(Icons.fitness_center, color: statusColor, size: 20),
          ),
          title: Text(
            'Day $dayNum${status.isNotEmpty ? ' · ${status[0].toUpperCase()}${status.substring(1)}' : ''}',
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
          ),
          subtitle: Text(
            displayDate,
            style: const TextStyle(color: AppColors.neutral500, fontSize: 12),
          ),
          trailing: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (duration > 0)
                Text('$duration min',
                    style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: AppColors.neutral700,
                        fontSize: 13)),
              if (rpeAvg != null)
                Text('RPE $rpeAvg',
                    style: const TextStyle(
                        color: AppColors.neutral400, fontSize: 11)),
            ],
          ),
          children: [
            if (performanceLogs.isEmpty)
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: Text('No exercise data logged for this session.',
                    style: TextStyle(color: AppColors.neutral400, fontSize: 13)),
              )
            else ...[
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                child: Column(
                  children: [
                    // Summary row
                    Row(
                      children: [
                        _miniStat('Sets done', '$totalCompleted/$totalTarget'),
                        const SizedBox(width: 16),
                        if (maxLoadAll > 0)
                          _miniStat('Top weight', '${maxLoadAll.toStringAsFixed(1)} kg'),
                        const SizedBox(width: 16),
                        if (bestE1RM > 0)
                          _miniStat('Est. 1RM', '${bestE1RM.toStringAsFixed(1)} kg'),
                      ],
                    ),
                    if (performanceLogs.isNotEmpty) ...[
                      const SizedBox(height: 10),
                      const Divider(height: 1),
                      const SizedBox(height: 6),
                      // Per-exercise summary
                      ...performanceLogs.map<Widget>((log) {
                        final completed = (log['completedSets'] as num?)?.toInt() ?? 0;
                        final target = (log['targetSets'] as num?)?.toInt() ?? 0;
                        final maxLoad = (log['maxLoad'] as num?)?.toDouble();
                        final e1rm = (log['estimatedE1RM'] as num?)?.toDouble();
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 3),
                          child: Row(
                            children: [
                              Icon(
                                completed == target
                                    ? Icons.check_circle
                                    : Icons.radio_button_unchecked,
                                size: 14,
                                color: completed == target
                                    ? AppColors.success
                                    : AppColors.neutral300,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  '$completed/$target sets',
                                  style: const TextStyle(
                                      fontSize: 12, color: AppColors.neutral700),
                                ),
                              ),
                              if (maxLoad != null && maxLoad > 0)
                                Text(
                                  '${maxLoad.toStringAsFixed(1)} kg',
                                  style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.neutral700),
                                ),
                              if (e1rm != null && e1rm > 0)
                                Padding(
                                  padding: const EdgeInsets.only(left: 8),
                                  child: Text(
                                    'e1RM: ${e1rm.toStringAsFixed(0)} kg',
                                    style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.neutral400),
                                  ),
                                ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _miniStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(fontSize: 10, color: AppColors.neutral400)),
        Text(value,
            style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: AppColors.neutral800)),
      ],
    );
  }
}
