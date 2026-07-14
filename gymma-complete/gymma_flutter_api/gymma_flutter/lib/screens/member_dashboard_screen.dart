import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../data/auth_service.dart';
import '../data/broadcast_repository.dart';
import '../data/fitos_repository.dart';
import '../theme.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';

class MemberDashboardScreen extends StatefulWidget {
  const MemberDashboardScreen({super.key});

  @override
  State<MemberDashboardScreen> createState() => _MemberDashboardScreenState();
}

class _MemberDashboardScreenState extends State<MemberDashboardScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _listCtrl;
  bool _loading = true;
  List<dynamic> _sessions = [];
  int _unreadBroadcasts = 0;

  @override
  void initState() {
    super.initState();
    _listCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _loadActivity();
    _loadUnreadBroadcasts();
  }

  Future<void> _loadUnreadBroadcasts() async {
    final gymId = AuthService.instance.gymId;
    if (gymId == null) return;
    try {
      final count = await BroadcastRepository().unreadCount(gymId);
      if (mounted) setState(() => _unreadBroadcasts = count);
    } catch (_) {
      // Non-critical — the badge just stays at its last known value.
    }
  }

  @override
  void dispose() {
    _listCtrl.dispose();
    super.dispose();
  }

  /// Quick stats and the activity feed are both built from real logged
  /// workout sessions — no fabricated numbers or gym names. If the member
  /// has no plan yet, everything below renders as an honest empty state.
  Future<void> _loadActivity() async {
    try {
      final plans = await FitosRepository.instance.listUserPlans();
      if (plans.isNotEmpty) {
        _sessions = await FitosRepository.instance
            .listSessions(planId: plans.first['id'] as String?);
      }
    } catch (_) {
      _sessions = [];
    } finally {
      if (mounted) {
        setState(() => _loading = false);
        _listCtrl.forward();
      }
    }
  }

  int get _streak {
    if (_sessions.isEmpty) return 0;
    var streak = 0;
    DateTime? prev;
    for (final s in _sessions) {
      if (s['status'] == 'missed') break;
      final dt = DateTime.tryParse(s['sessionDate'] as String? ?? '')?.toLocal();
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

  int get _thisMonthCount {
    final now = DateTime.now();
    return _sessions.where((s) {
      final dt = DateTime.tryParse(s['sessionDate'] as String? ?? '')?.toLocal();
      return dt != null && dt.year == now.year && dt.month == now.month;
    }).length;
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService.instance.user;
    final fullName = user?['fullName'] ?? 'Member';
    final firstName = fullName.toString().split(' ').first;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.paperBackground,
        body: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // ── Collapsible hero app bar ─────────────────────────────────
            SliverAppBar(
              expandedHeight: 180,
              pinned: true,
              stretch: true,
              backgroundColor: AppColors.brandNavyDark,
              surfaceTintColor: Colors.transparent,
              systemOverlayStyle: SystemUiOverlayStyle.light,
              actions: [
                Stack(
                  clipBehavior: Clip.none,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.notifications_none_rounded, color: Colors.white),
                      onPressed: () async {
                        final markedRead = await Navigator.of(context).push<bool>(
                            MaterialPageRoute(builder: (_) => const NotificationsScreen()));
                        if (markedRead == true) _loadUnreadBroadcasts();
                      },
                    ),
                    if (_unreadBroadcasts > 0)
                      Positioned(
                        right: 6,
                        top: 6,
                        child: IgnorePointer(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                            constraints: const BoxConstraints(minWidth: 16),
                            decoration: BoxDecoration(
                              color: AppColors.brandCopper,
                              borderRadius: BorderRadius.circular(AppRadius.full),
                              border: Border.all(color: AppColors.brandNavyDark, width: 1.5),
                            ),
                            child: Text(
                              _unreadBroadcasts > 9 ? '9+' : '$_unreadBroadcasts',
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                GestureDetector(
                  onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const ProfileScreen())),
                  child: Container(
                    margin: const EdgeInsets.only(right: 16, left: 4),
                    width: 36,
                    height: 36,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: AppGradients.brandGradient,
                    ),
                    child: Center(
                      child: Text(
                        firstName.isNotEmpty ? firstName[0].toUpperCase() : 'M',
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                stretchModes: const [StretchMode.zoomBackground],
                background: Stack(
                  children: [
                    Container(
                      decoration: const BoxDecoration(gradient: AppGradients.navyGradient),
                    ),
                    Positioned(
                      top: -30,
                      right: -30,
                      child: Container(
                        width: 160,
                        height: 160,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.brandCopper.withOpacity(0.15),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 20,
                      left: -20,
                      child: Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withOpacity(0.04),
                        ),
                      ),
                    ),
                    Positioned(
                      left: 20,
                      bottom: 24,
                      right: 20,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _greeting(),
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.6),
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              letterSpacing: 0.3,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            firstName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 30,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.8,
                              height: 1.1,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ── Body content ────────────────────────────────────────────
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  if (_loading)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 40),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else ...[
                    _StaggeredItem(
                      index: 0,
                      controller: _listCtrl,
                      child: _QuickStats(
                        workouts: _sessions.length,
                        streak: _streak,
                        thisMonth: _thisMonthCount,
                      ),
                    ),
                    const SizedBox(height: 24),
                    _StaggeredItem(
                      index: 1,
                      controller: _listCtrl,
                      child: const _MembershipCard(),
                    ),
                    const SizedBox(height: 28),
                    _StaggeredItem(
                      index: 2,
                      controller: _listCtrl,
                      child: const _SectionHeader(eyebrow: 'RECENT', title: 'Activity'),
                    ),
                    const SizedBox(height: 14),
                    if (_sessions.isEmpty)
                      _StaggeredItem(
                        index: 3,
                        controller: _listCtrl,
                        child: _emptyActivity(),
                      )
                    else
                      ..._sessions.take(6).toList().asMap().entries.map((e) {
                        final s = e.value;
                        final dt = DateTime.tryParse(s['sessionDate'] as String? ?? '')?.toLocal();
                        final dayNum = s['dayNumber'] as int? ?? 0;
                        final status = s['status'] as String? ?? 'completed';
                        final isLast = e.key == _sessions.take(6).length - 1;
                        return _StaggeredItem(
                          index: 3 + e.key,
                          controller: _listCtrl,
                          child: _TimelineActivityTile(
                            icon: Icons.fitness_center_rounded,
                            title: status == 'missed'
                                ? 'Missed workout · Day $dayNum'
                                : 'Logged a workout · Day $dayNum',
                            date: dt != null ? _formatDate(dt) : '—',
                            color: status == 'missed'
                                ? AppColors.textSecondary
                                : AppColors.brandCopper,
                            isLast: isLast,
                          ),
                        );
                      }),
                  ],
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _emptyActivity() => Container(
        padding: const EdgeInsets.symmetric(vertical: 32),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: AppColors.divider),
        ),
        child: const Column(
          children: [
            Icon(Icons.inbox_rounded, color: AppColors.divider, size: 36),
            SizedBox(height: 10),
            Text('No recent activity yet',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
            SizedBox(height: 4),
            Text('Log a workout to see it show up here.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
          ],
        ),
      );

  String _formatDate(DateTime dt) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final day = DateTime(dt.year, dt.month, dt.day);
    final diff = today.difference(day).inDays;
    final time = '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    if (diff == 0) return 'Today, $time';
    if (diff == 1) return 'Yesterday, $time';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  }
}

// ── Sub-widgets ──────────────────────────────────────────────────────────────

class _QuickStats extends StatelessWidget {
  final int workouts;
  final int streak;
  final int thisMonth;
  const _QuickStats({required this.workouts, required this.streak, required this.thisMonth});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _StatChip('$workouts', 'Workouts', Icons.fitness_center_rounded, AppColors.brandCopper)),
        const SizedBox(width: 10),
        Expanded(child: _StatChip('$streak', 'Day Streak', Icons.local_fire_department_rounded, AppColors.warning)),
        const SizedBox(width: 10),
        Expanded(child: _StatChip('$thisMonth', 'This Month', Icons.calendar_today_rounded, AppColors.success)),
      ],
    );
  }
}

class _StatChip extends StatelessWidget {
  final String value;
  final String label;
  final IconData icon;
  final Color color;
  const _StatChip(this.value, this.label, this.icon, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: AppColors.divider),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 10),
          Text(value,
              style: TextStyle(
                  color: color, fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 2),
          Text(label,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 11)),
        ],
      ),
    );
  }
}

/// There is no "my membership" API for members yet — showing a specific
/// fabricated gym name/ID/renewal date here would be actively misleading,
/// so this renders an honest placeholder instead.
class _MembershipCard extends StatelessWidget {
  const _MembershipCard();
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: AppGradients.brandGradient,
        borderRadius: BorderRadius.circular(AppRadius.xxl),
        boxShadow: [
          BoxShadow(
            color: AppColors.brandNavy.withOpacity(0.35),
            blurRadius: 24,
            offset: const Offset(0, 10),
          )
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -28,
            top: -28,
            child: Container(
              width: 130,
              height: 130,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.06),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'MEMBERSHIP',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.6),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 2.5,
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'No membership on file yet',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.3),
                ),
                const SizedBox(height: 8),
                Text(
                  'Once your gym links your account, your plan and renewal date will show up here.',
                  style: TextStyle(color: Colors.white.withOpacity(0.65), fontSize: 13, height: 1.5),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String eyebrow;
  final String title;
  const _SectionHeader({required this.eyebrow, required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(
          eyebrow,
          style: const TextStyle(
              color: AppColors.brandCopper,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 2.5),
        ),
        Text(
          title,
          style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 20,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.3),
        ),
      ]),
    ]);
  }
}

class _TimelineActivityTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String date;
  final Color color;
  final bool isLast;
  const _TimelineActivityTile({
    required this.icon,
    required this.title,
    required this.date,
    required this.color,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline column
          SizedBox(
            width: 40,
            child: Column(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    border: Border.all(
                        color: color.withOpacity(0.25), width: 1.5),
                  ),
                  child: Icon(icon, color: color, size: 18),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 1.5,
                      margin: const EdgeInsets.symmetric(vertical: 6),
                      color: AppColors.divider,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 14),
          // Content
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 18),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(color: AppColors.divider),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: AppColors.textPrimary)),
                    const SizedBox(height: 4),
                    Text(date,
                        style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Staggered entrance animation wrapper
class _StaggeredItem extends StatelessWidget {
  final int index;
  final AnimationController controller;
  final Widget child;
  const _StaggeredItem(
      {required this.index,
      required this.controller,
      required this.child});

  @override
  Widget build(BuildContext context) {
    final delay = index * 0.08;
    final begin = delay.clamp(0.0, 0.8);
    final end = (begin + 0.4).clamp(0.0, 1.0);
    final fade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
          parent: controller,
          curve: Interval(begin, end, curve: Curves.easeOut)),
    );
    final slide = Tween<Offset>(
            begin: const Offset(0, 0.1), end: Offset.zero)
        .animate(CurvedAnimation(
            parent: controller,
            curve: Interval(begin, end, curve: Curves.easeOut)));

    return FadeTransition(
      opacity: fade,
      child: SlideTransition(position: slide, child: child),
    );
  }
}
