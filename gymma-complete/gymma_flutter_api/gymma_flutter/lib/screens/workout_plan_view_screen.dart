import 'package:flutter/material.dart';
import '../data/fitos_repository.dart';
import '../theme.dart';

class WorkoutPlanViewScreen extends StatefulWidget {
  final String planId;
  const WorkoutPlanViewScreen({super.key, required this.planId});

  @override
  State<WorkoutPlanViewScreen> createState() => _WorkoutPlanViewScreenState();
}

class _WorkoutPlanViewScreenState extends State<WorkoutPlanViewScreen> {
  bool _isLoading = true;
  Map<String, dynamic>? _plan;
  List<Map<String, dynamic>> _sessions = [];

  @override
  void initState() {
    super.initState();
    _loadPlan();
  }

  Future<void> _loadPlan() async {
    try {
      final plan = await FitosRepository.instance.getWorkoutPlan(widget.planId);
      final sessions = (plan['sessions'] as List? ?? [])
          .whereType<Map>()
          .map((s) => Map<String, dynamic>.from(s))
          .toList();
      if (mounted) {
        setState(() {
          _plan = plan;
          _sessions = sessions;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading plan: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_plan == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Workout Plan')),
        body: const Center(
          child: Text('Could not load plan.', style: TextStyle(color: AppColors.neutral500)),
        ),
      );
    }

    final programParams = _plan!['programParameters'] as Map<String, dynamic>?;
    final planName = programParams?['split']?.toString() ?? 'Custom Plan';

    return DefaultTabController(
      length: _sessions.length + 1, // Overview + one tab per day
      child: Scaffold(
        backgroundColor: AppColors.neutral50,
        appBar: AppBar(
          title: Text(planName, style: const TextStyle(fontWeight: FontWeight.w700)),
          backgroundColor: Colors.white,
          bottom: TabBar(
            isScrollable: true,
            labelColor: AppColors.primary500,
            unselectedLabelColor: AppColors.neutral500,
            indicatorColor: AppColors.primary500,
            tabAlignment: TabAlignment.start,
            tabs: [
              const Tab(icon: Icon(Icons.dashboard_outlined, size: 18), text: 'Overview'),
              ..._sessions.map((s) => Tab(text: 'Day ${s['dayNumber']}')),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildOverviewTab(programParams),
            ..._sessions.map((s) => _buildDayTab(s)),
          ],
        ),
      ),
    );
  }

  Widget _buildOverviewTab(Map<String, dynamic>? params) {
    if (params == null) {
      return const Center(child: Text('No plan parameters available.'));
    }

    final split = params['split']?.toString() ?? '—';
    final freq = (params['frequency'] as num?)?.toInt() ?? 0;
    final weeks = (params['totalWeeks'] as num?)?.toInt() ?? 0;
    final goal = params['primaryGoal']?.toString() ?? params['goal']?.toString() ?? '—';
    final tier = params['experienceTier']?.toString() ?? '—';
    final safetyFlags = (_plan?['safetyFlags'] as List?)?.cast<String>() ?? [];

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _overviewCard('Plan Structure', [
          ('Split', split),
          ('Frequency', '$freq days / week'),
          ('Duration', '$weeks weeks'),
        ]),
        const SizedBox(height: 16),
        _overviewCard('Training Profile', [
          ('Primary Goal', goal),
          ('Experience Tier', tier),
          ('Days in Plan', '${_sessions.length}'),
        ]),
        if (safetyFlags.isNotEmpty) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.warning.withOpacity(0.1),
              border: Border.all(color: AppColors.warning.withOpacity(0.5)),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.shield_outlined, color: AppColors.warning, size: 18),
                    SizedBox(width: 8),
                    Text('Safety Flags',
                        style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.warning)),
                  ],
                ),
                const SizedBox(height: 8),
                ...safetyFlags.map((f) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Text(
                        '• ${_formatSafetyFlag(f)}',
                        style: const TextStyle(fontSize: 13, color: AppColors.neutral700),
                      ),
                    )),
              ],
            ),
          ),
        ],
        const SizedBox(height: 24),
        const Text(
          'Weekly Schedule',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
        ),
        const SizedBox(height: 12),
        ..._sessions.map((s) {
          final day = s['dayNumber'] as int? ?? 0;
          final focus = s['focus'] as String? ?? 'Training';
          final duration = s['durationMinutes'] as int?;
          final exCount = (s['exercises'] as List?)?.length ?? 0;
          return Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(color: AppColors.neutral200),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.primary500.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text(
                      '$day',
                      style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary500,
                          fontSize: 15),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(focus,
                          style: const TextStyle(
                              fontWeight: FontWeight.w600, fontSize: 14)),
                      Text(
                        '$exCount exercises${duration != null ? ' · ~$duration min' : ''}',
                        style: const TextStyle(
                            color: AppColors.neutral500, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: AppColors.neutral300),
              ],
            ),
          );
        }),
      ],
    );
  }

  Widget _overviewCard(String title, List<(String, String)> rows) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.neutral200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          const SizedBox(height: 12),
          ...rows.map((r) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(r.$1,
                        style: const TextStyle(
                            color: AppColors.neutral500, fontSize: 13)),
                    Text(r.$2,
                        style: const TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 13)),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildDayTab(Map<String, dynamic> session) {
    final focus = session['focus'] as String? ?? 'Training';
    final duration = session['durationMinutes'] as int?;
    final exercises = (session['exercises'] as List? ?? [])
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();

    // Group exercises by category for display
    final grouped = <String, List<Map<String, dynamic>>>{};
    for (final ex in exercises) {
      final cat = ex['category'] as String? ?? 'other';
      grouped.putIfAbsent(cat, () => []).add(ex);
    }

    const categoryOrder = ['warmup', 'primary', 'secondary', 'isolation', 'conditioning', 'other'];
    const categoryLabels = {
      'warmup': 'Warm-Up',
      'primary': 'Primary Lifts',
      'secondary': 'Secondary',
      'isolation': 'Isolation',
      'conditioning': 'Conditioning',
      'other': 'Other',
    };

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Day header
        Container(
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.primary500, AppColors.secondary500],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                focus,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                '${exercises.length} exercises${duration != null ? ' · ~$duration min' : ''}',
                style: const TextStyle(color: Colors.white70, fontSize: 13),
              ),
            ],
          ),
        ),

        // Exercises by category
        for (final cat in categoryOrder)
          if (grouped.containsKey(cat)) ...[
            Padding(
              padding: const EdgeInsets.only(bottom: 8, top: 4),
              child: Text(
                categoryLabels[cat] ?? cat.toUpperCase(),
                style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                    color: AppColors.neutral500,
                    letterSpacing: 0.8),
              ),
            ),
            ...grouped[cat]!.map((ex) => _buildExerciseRow(ex)),
          ],
      ],
    );
  }

  Widget _buildExerciseRow(Map<String, dynamic> ex) {
    final name = ex['name'] as String? ?? 'Exercise';
    final sets = (ex['sets'] as num?)?.toInt() ?? 3;
    final reps = ex['reps'] as String? ?? '10';
    final restSec = (ex['restSeconds'] as num?)?.toInt();
    final rpe = ex['rpe'] as num?;
    final muscles = (ex['muscleGroups'] as List?)?.cast<String>() ?? [];

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.neutral200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(name,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          const SizedBox(height: 6),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: [
              _tag('$sets sets × $reps reps', AppColors.primary500),
              if (restSec != null) _tag('${restSec}s rest', AppColors.neutral500),
              if (rpe != null) _tag('RPE ${rpe.round()}', AppColors.secondary500),
            ],
          ),
          if (muscles.isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              muscles.join(' · '),
              style: const TextStyle(fontSize: 11, color: AppColors.neutral400),
            ),
          ],
        ],
      ),
    );
  }

  static const _safetyFlagLabels = {
    'MEDICAL_CLEARANCE_REQUIRED': 'Medical clearance required',
    'CARDIOVASCULAR_RISK': 'Cardiovascular risk — intensity capped',
    'MUSCULOSKELETAL_RISK': 'Musculoskeletal risk — load adjusted',
    'MAX_HEART_RATE_REDUCED': 'Max heart rate reduced for this plan',
    'PREGNANCY_POSTPARTUM': 'Pregnancy / postpartum precautions applied',
    'METABOLIC_ADJUSTMENT': 'Metabolic adjustment applied',
    'POST_SURGICAL': 'Post-surgical precautions applied',
    'LOAD_RESTRICTION': 'Load restriction in place',
  };

  /// Falls back to a readable title-case version of the raw flag for any
  /// value not yet in [_safetyFlagLabels], instead of a naive
  /// lowercase-and-replace-underscores pass that reads like a debug string.
  String _formatSafetyFlag(String flag) {
    final known = _safetyFlagLabels[flag];
    if (known != null) return known;
    return flag
        .split('_')
        .where((w) => w.isNotEmpty)
        .map((w) => '${w[0].toUpperCase()}${w.substring(1).toLowerCase()}')
        .join(' ');
  }

  Widget _tag(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
            fontSize: 11, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }
}
