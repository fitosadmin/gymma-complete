import 'package:flutter/material.dart';
import '../data/fitos_repository.dart';
import '../theme.dart';
import 'assessment_screen.dart';
import 'active_workout_screen.dart';

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

    // Next day number: cycle through plan's weekly frequency
    final int sessionsDone = _recentSessions.length;
    final int nextDay = (sessionsDone % freq) + 1;

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Active Plan Card
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
              ],
            ),
          ),

          const SizedBox(height: 32),
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
            ..._recentSessions.map((session) {
              final dateStr = session['sessionDate'] as String? ?? '';
              final parsed = DateTime.tryParse(dateStr)?.toLocal();
              final displayDate = parsed != null
                  ? '${parsed.day}/${parsed.month}/${parsed.year}'
                  : dateStr;
              final duration = (session['durationMinutes'] as num?)?.toInt() ?? 0;
              final dayNum = session['dayNumber'] as int? ?? 0;
              final status = session['status'] as String? ?? '';
              final statusColor = status == 'completed'
                  ? AppColors.success
                  : status == 'partial'
                      ? AppColors.warning
                      : AppColors.neutral400;

              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  border: Border.all(color: AppColors.neutral200),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      child: Icon(Icons.fitness_center,
                          color: statusColor, size: 22),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Day $dayNum${status.isNotEmpty ? ' · ${status[0].toUpperCase()}${status.substring(1)}' : ''}',
                            style: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 15),
                          ),
                          const SizedBox(height: 2),
                          Text(displayDate,
                              style: const TextStyle(
                                  color: AppColors.neutral500, fontSize: 12)),
                        ],
                      ),
                    ),
                    if (duration > 0)
                      Text('$duration min',
                          style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              color: AppColors.neutral700)),
                  ],
                ),
              );
            }).toList(),
        ],
      ),
    );
  }
}
