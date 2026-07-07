import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../data/auth_service.dart';
import '../theme.dart';

class MemberDashboardScreen extends StatefulWidget {
  const MemberDashboardScreen({super.key});

  @override
  State<MemberDashboardScreen> createState() => _MemberDashboardScreenState();
}

class _MemberDashboardScreenState extends State<MemberDashboardScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _listCtrl;

  @override
  void initState() {
    super.initState();
    _listCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _listCtrl.forward();
  }

  @override
  void dispose() {
    _listCtrl.dispose();
    super.dispose();
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
              expandedHeight: 200,
              pinned: true,
              stretch: true,
              backgroundColor: AppColors.brandNavyDark,
              surfaceTintColor: Colors.transparent,
              systemOverlayStyle: SystemUiOverlayStyle.light,
              actions: [
                IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(AppRadius.md),
                    ),
                    child: const Icon(Icons.logout_rounded,
                        color: Colors.white, size: 18),
                  ),
                  onPressed: () => AuthService.instance.logout(),
                  tooltip: 'Sign out',
                ),
                const SizedBox(width: 8),
              ],
              flexibleSpace: FlexibleSpaceBar(
                stretchModes: const [StretchMode.zoomBackground],
                background: Stack(
                  children: [
                    // Background gradient
                    Container(
                      decoration: const BoxDecoration(
                        gradient: AppGradients.navyGradient,
                      ),
                    ),
                    // Decorative circles
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
                    // Greeting content
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
                  // Quick stats row
                  _StaggeredItem(
                    index: 0,
                    controller: _listCtrl,
                    child: _QuickStats(),
                  ),
                  const SizedBox(height: 24),

                  // Membership card
                  _StaggeredItem(
                    index: 1,
                    controller: _listCtrl,
                    child: _MembershipCard(),
                  ),
                  const SizedBox(height: 28),

                  // Section header
                  _StaggeredItem(
                    index: 2,
                    controller: _listCtrl,
                    child: const _SectionHeader(
                        eyebrow: 'RECENT', title: 'Activity'),
                  ),
                  const SizedBox(height: 14),

                  // Activity feed
                  ..._activities.asMap().entries.map((e) => _StaggeredItem(
                        index: 3 + e.key,
                        controller: _listCtrl,
                        child: _TimelineActivityTile(
                          icon: e.value.$1,
                          title: e.value.$2,
                          date: e.value.$3,
                          color: e.value.$4,
                          isLast: e.key == _activities.length - 1,
                        ),
                      )),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
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
  const _QuickStats();
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _StatChip('8', 'Workouts', Icons.fitness_center_rounded, AppColors.brandCopper)),
        const SizedBox(width: 10),
        Expanded(child: _StatChip('3', 'Day Streak', Icons.local_fire_department_rounded, AppColors.warning)),
        const SizedBox(width: 10),
        Expanded(child: _StatChip('142', 'Days Active', Icons.calendar_today_rounded, AppColors.success)),
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
          // Texture circle
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
          Positioned(
            right: 20,
            bottom: -40,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.04),
              ),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'ACTIVE PLAN',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.6),
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 2.5,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.success.withOpacity(0.2),
                        border: Border.all(
                            color: AppColors.success.withOpacity(0.4)),
                        borderRadius:
                            BorderRadius.circular(AppRadius.full),
                      ),
                      child: Row(children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                              color: AppColors.success,
                              shape: BoxShape.circle),
                        ),
                        const SizedBox(width: 5),
                        const Text('Active',
                            style: TextStyle(
                                color: AppColors.success,
                                fontSize: 11,
                                fontWeight: FontWeight.w700)),
                      ]),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                const Text(
                  'Annual Pro Membership',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5),
                ),
                const SizedBox(height: 6),
                Text(
                  'Iron Temple Fitness',
                  style: TextStyle(
                      color: Colors.white.withOpacity(0.6), fontSize: 14),
                ),
                const SizedBox(height: 24),
                Container(
                  height: 1,
                  color: Colors.white.withOpacity(0.12),
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _CardDetail('MEMBER ID', 'GYM-84920'),
                    _CardDetail('RENEWS ON', 'Oct 24, 2026',
                        align: CrossAxisAlignment.end),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CardDetail extends StatelessWidget {
  final String label;
  final String value;
  final CrossAxisAlignment align;
  const _CardDetail(this.label, this.value,
      {this.align = CrossAxisAlignment.start});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: align,
      children: [
        Text(label,
            style: TextStyle(
                color: Colors.white.withOpacity(0.45),
                fontSize: 10,
                letterSpacing: 1.2,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Text(value,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w700)),
      ],
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

final _activities = [
  (Icons.fitness_center_rounded, 'Checked in at Iron Temple Fitness', 'Today, 6:45 AM', AppColors.brandCopper),
  (Icons.fitness_center_rounded, 'Checked in at Iron Temple Fitness', 'Yesterday, 7:10 AM', AppColors.brandCopper),
  (Icons.payment_rounded, 'Membership renewed — Annual Pro', 'Oct 24, 2025', AppColors.success),
  (Icons.star_rounded, 'Left a review for Iron Temple', 'Oct 10, 2025', AppColors.warning),
];

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
                child: Row(
                  children: [
                    Expanded(
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
                    Icon(Icons.chevron_right_rounded,
                        color: AppColors.divider, size: 18),
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
