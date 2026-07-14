import 'package:flutter/material.dart';
import '../data/diet_repository.dart';
import '../theme.dart';
import '../widgets/branded_expansion_tile.dart';
import '../widgets/diet_plan_view.dart';
import '../widgets/shimmer.dart';

/// Full history of past diet calculations — expand any row to see the full
/// macro/meal breakdown, relabel/note it, or delete it. Diet's backend
/// supports full CRUD on plans (unlike Workout, which only ever shows a
/// single active plan), so this screen has no precedent to mirror in the
/// Workout feature — it's new, but built from the same visual language.
class DietPlanHistoryScreen extends StatefulWidget {
  const DietPlanHistoryScreen({super.key});

  @override
  State<DietPlanHistoryScreen> createState() => _DietPlanHistoryScreenState();
}

class _DietPlanHistoryScreenState extends State<DietPlanHistoryScreen> {
  static const _pageSize = 10;

  bool _isLoading = true;
  bool _isLoadingMore = false;
  String? _error;
  final List<Map<String, dynamic>> _plans = [];
  int _page = 1;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final items = await DietRepository.instance.listPlans(page: 1, limit: _pageSize);
      if (!mounted) return;
      setState(() {
        _plans
          ..clear()
          ..addAll(items);
        _page = 1;
        _hasMore = items.length == _pageSize;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMore() async {
    if (_isLoadingMore || !_hasMore) return;
    setState(() => _isLoadingMore = true);
    try {
      final nextPage = _page + 1;
      final items = await DietRepository.instance.listPlans(page: nextPage, limit: _pageSize);
      if (!mounted) return;
      setState(() {
        _plans.addAll(items);
        _page = nextPage;
        _hasMore = items.length == _pageSize;
      });
    } catch (e) {
      debugPrint('Diet history loadMore error: $e');
    } finally {
      if (mounted) setState(() => _isLoadingMore = false);
    }
  }

  Future<void> _editPlan(Map<String, dynamic> plan) async {
    final labelCtrl = TextEditingController(text: plan['label'] as String? ?? '');
    final noteCtrl = TextEditingController(text: plan['userNote'] as String? ?? '');

    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Plan'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: labelCtrl,
              maxLength: 100,
              decoration: const InputDecoration(labelText: 'Label', hintText: 'e.g. Summer Cut'),
            ),
            TextField(
              controller: noteCtrl,
              maxLength: 1000,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Note'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Save')),
        ],
      ),
    );

    if (saved != true) return;
    try {
      final updated = await DietRepository.instance.updateNote(
        plan['id'] as String,
        label: labelCtrl.text.trim(),
        userNote: noteCtrl.text.trim(),
      );
      if (!mounted) return;
      setState(() {
        final i = _plans.indexWhere((p) => p['id'] == plan['id']);
        if (i != -1) _plans[i] = updated;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not save: ${e.toString().replaceAll('Exception: ', '')}')),
      );
    }
  }

  Future<void> _deletePlan(Map<String, dynamic> plan) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete this plan?'),
        content: const Text('This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    try {
      await DietRepository.instance.deletePlan(plan['id'] as String);
      if (!mounted) return;
      setState(() => _plans.removeWhere((p) => p['id'] == plan['id']));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not delete: ${e.toString().replaceAll('Exception: ', '')}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paperBackground,
      appBar: AppBar(title: const Text('Diet History', style: TextStyle(fontWeight: FontWeight.w700))),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return ListView(
        padding: const EdgeInsets.all(16),
        children: List.generate(
          4,
          (i) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: ShimmerBox(width: double.infinity, height: 72, borderRadius: BorderRadius.circular(AppRadius.lg)),
          ),
        ),
      );
    }
    if (_error != null) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SizedBox(height: 80),
          const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
          const SizedBox(height: 16),
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textSecondary)),
            ),
          ),
          const SizedBox(height: 16),
          Center(child: OutlinedButton(onPressed: _load, child: const Text('Retry'))),
        ],
      );
    }
    if (_plans.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SizedBox(height: 100),
          Icon(Icons.history_rounded, size: 48, color: AppColors.divider),
          const SizedBox(height: 16),
          const Center(
            child: Text('No past plans yet', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          ),
          const SizedBox(height: 6),
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 40),
              child: Text('Calculated plans will show up here.',
                  textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
            ),
          ),
        ],
      );
    }

    return RefreshIndicator(
      color: AppColors.brandCopper,
      onRefresh: _load,
      child: ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        itemCount: _plans.length + (_hasMore ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (_, i) {
          if (i >= _plans.length) {
            _loadMore();
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Center(child: CircularProgressIndicator(color: AppColors.brandCopper)),
            );
          }
          final plan = _plans[i];
          return _PlanHistoryTile(
            plan: plan,
            onEdit: () => _editPlan(plan),
            onDelete: () => _deletePlan(plan),
          );
        },
      ),
    );
  }
}

class _PlanHistoryTile extends StatelessWidget {
  final Map<String, dynamic> plan;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  const _PlanHistoryTile({required this.plan, required this.onEdit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final label = plan['label'] as String?;
    final date = _formatDate(plan['createdAt'] as String?);
    final goal = kGoalLabels[plan['goal']] ?? plan['goal']?.toString() ?? '';
    final targetCalories = plan['targetCalories']?.toString() ?? '—';

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.divider),
      ),
      child: BrandedExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        childrenPadding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
        title: Text(label?.isNotEmpty == true ? label! : 'Plan · $date',
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
        subtitle: Text('$targetCalories kcal · $goal',
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        children: [
          DietPlanView(plan: plan),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onEdit,
                  icon: const Icon(Icons.edit_outlined, size: 16),
                  label: const Text('Edit'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onDelete,
                  style: OutlinedButton.styleFrom(foregroundColor: AppColors.error, side: const BorderSide(color: AppColors.error)),
                  icon: const Icon(Icons.delete_outline_rounded, size: 16),
                  label: const Text('Delete'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDate(String? iso) {
    final dt = iso != null ? DateTime.tryParse(iso)?.toLocal() : null;
    if (dt == null) return '';
    return '${dt.day}/${dt.month}/${dt.year}';
  }
}
