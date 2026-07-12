import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../data/diet_repository.dart';
import '../theme.dart';
import '../widgets/shimmer.dart';
import '../widgets/gradient_button.dart';
import '../widgets/diet_plan_view.dart';
import 'diet_assessment_screen.dart';
import 'diet_plan_history_screen.dart';

/// Home for the Diet tab. Mirrors workout_dashboard_screen.dart's three
/// states (shimmer loading → empty → active) and SliverAppBar chrome.
class DietDashboardScreen extends StatefulWidget {
  const DietDashboardScreen({super.key});

  @override
  State<DietDashboardScreen> createState() => _DietDashboardScreenState();
}

class _DietDashboardScreenState extends State<DietDashboardScreen>
    with TickerProviderStateMixin {
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _activePlan;

  late AnimationController _entranceCtrl;

  @override
  void initState() {
    super.initState();
    _entranceCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    _loadData();
  }

  @override
  void dispose() {
    _entranceCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      _activePlan = await DietRepository.instance.getActivePlan();
    } catch (e) {
      debugPrint('Error loading diet plan: $e');
      _activePlan = null;
      _error = 'Could not reach the server. It might be starting up.';
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
        _entranceCtrl.forward(from: 0);
      }
    }
  }

  Future<void> _openAssessment() async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => const DietAssessmentScreen()),
    );
    if (result == true) _loadData();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: AppColors.paperBackground,
        body: _isLoading
            ? _buildShimmer()
            : _error != null
                ? _buildErrorState()
                : _activePlan == null
                    ? _buildEmptyState()
                    : _buildActiveState(),
      ),
    );
  }

  SliverAppBar _appBar({bool loading = false}) {
    return SliverAppBar(
      pinned: true,
      backgroundColor: AppColors.paperBackground,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 1,
      shadowColor: AppColors.divider,
      title: const Text('My Diet Plan',
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20, color: AppColors.textPrimary, letterSpacing: -0.3)),
      actions: [
        if (!loading) ...[
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.divider.withOpacity(0.5),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: const Icon(Icons.history_rounded, color: AppColors.textPrimary, size: 18),
            ),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const DietPlanHistoryScreen())),
          ),
          IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.divider.withOpacity(0.5),
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: const Icon(Icons.refresh_rounded, color: AppColors.textPrimary, size: 18),
            ),
            onPressed: _loadData,
          ),
        ],
        const SizedBox(width: 4),
      ],
    );
  }

  Widget _buildShimmer() {
    return CustomScrollView(
      physics: const NeverScrollableScrollPhysics(),
      slivers: [
        _appBar(loading: true),
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              const ShimmerCard(height: 200),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(child: ShimmerBox(width: double.infinity, height: 84, borderRadius: BorderRadius.circular(AppRadius.xl))),
                const SizedBox(width: 10),
                Expanded(child: ShimmerBox(width: double.infinity, height: 84, borderRadius: BorderRadius.circular(AppRadius.xl))),
                const SizedBox(width: 10),
                Expanded(child: ShimmerBox(width: double.infinity, height: 84, borderRadius: BorderRadius.circular(AppRadius.xl))),
              ]),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorState() {
    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        _appBar(),
        SliverFillRemaining(
          hasScrollBody: false,
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.cloud_off_rounded, color: AppColors.textSecondary, size: 48),
                  const SizedBox(height: 24),
                  Text(
                    _error ?? 'An error occurred',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 16, color: AppColors.textPrimary, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'The server may be cold-starting. Please try again.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 14, color: AppColors.textSecondary, height: 1.5),
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.refresh_rounded, size: 20),
                      label: const Text('Retry'),
                      onPressed: _loadData,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.textPrimary,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        _appBar(),
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
                        BoxShadow(color: AppColors.brandCopper.withOpacity(0.3), blurRadius: 24, offset: const Offset(0, 8)),
                      ],
                    ),
                    child: const Icon(Icons.restaurant_rounded, color: Colors.white, size: 44),
                  ),
                  const SizedBox(height: 28),
                  const Text(
                    'No Diet Plan Yet',
                    style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.textPrimary, letterSpacing: -0.5),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Get a personalised calorie and macro\ntarget based on your body and goals.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 15, color: AppColors.textSecondary, height: 1.5),
                  ),
                  const SizedBox(height: 36),
                  GradientButton(
                    label: 'Calculate My Plan',
                    icon: Icons.auto_awesome_rounded,
                    onPressed: _openAssessment,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Takes about a minute',
                    style: TextStyle(color: AppColors.textSecondary.withOpacity(0.7), fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildActiveState() {
    return RefreshIndicator(
      color: AppColors.brandCopper,
      backgroundColor: AppColors.surface,
      onRefresh: _loadData,
      child: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          _appBar(),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _FadeSlide(index: 0, ctrl: _entranceCtrl, child: DietPlanView(plan: _activePlan!)),
                const SizedBox(height: 28),
                _FadeSlide(
                  index: 1,
                  ctrl: _entranceCtrl,
                  child: Row(
                    children: [
                      Expanded(
                        child: GradientButton(
                          label: 'Recalculate',
                          icon: Icons.refresh_rounded,
                          onPressed: _openAssessment,
                        ),
                      ),
                    ],
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

class _FadeSlide extends StatelessWidget {
  final int index;
  final AnimationController ctrl;
  final Widget child;
  const _FadeSlide({required this.index, required this.ctrl, required this.child});

  @override
  Widget build(BuildContext context) {
    final delay = (index * 0.07).clamp(0.0, 0.8);
    final end = (delay + 0.35).clamp(0.0, 1.0);
    final fade = Tween<double>(begin: 0.0, end: 1.0)
        .animate(CurvedAnimation(parent: ctrl, curve: Interval(delay, end, curve: Curves.easeOut)));
    final slide = Tween<Offset>(begin: const Offset(0, 0.09), end: Offset.zero)
        .animate(CurvedAnimation(parent: ctrl, curve: Interval(delay, end, curve: Curves.easeOut)));
    return FadeTransition(opacity: fade, child: SlideTransition(position: slide, child: child));
  }
}
