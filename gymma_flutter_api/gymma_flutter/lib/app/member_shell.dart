import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../screens/member_dashboard_screen.dart';
import '../screens/workout_dashboard_screen.dart';
import '../theme.dart';

class MemberShell extends StatefulWidget {
  const MemberShell({super.key});
  @override
  State<MemberShell> createState() => _MemberShellState();
}

class _MemberShellState extends State<MemberShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      const MemberDashboardScreen(),
      const WorkoutDashboardScreen(),
      const Scaffold(
        backgroundColor: Color(0xFFFAF8F5),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.person_outline_rounded, size: 48, color: Color(0xFF65717E)),
              SizedBox(height: 12),
              Text('Profile', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF22303F))),
              SizedBox(height: 6),
              Text('Coming soon', style: TextStyle(color: Color(0xFF65717E))),
            ],
          ),
        ),
      ),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: _GymmaNavBar(
        currentIndex: _index,
        onTap: (i) {
          HapticFeedback.selectionClick();
          setState(() => _index = i);
        },
        items: const [
          _NavItem(icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard_rounded, label: 'Home'),
          _NavItem(icon: Icons.fitness_center_outlined, activeIcon: Icons.fitness_center_rounded, label: 'Workouts'),
          _NavItem(icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Profile'),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom premium navigation bar
// ─────────────────────────────────────────────────────────────────────────────

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const _NavItem({required this.icon, required this.activeIcon, required this.label});
}

class _GymmaNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<_NavItem> items;

  const _GymmaNavBar({
    required this.currentIndex,
    required this.onTap,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        boxShadow: [
          BoxShadow(
            color: AppColors.brandNavy.withOpacity(0.10),
            blurRadius: 20,
            offset: const Offset(0, -4),
          )
        ],
        border: Border(
          top: BorderSide(color: AppColors.divider, width: 1),
        ),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 66,
          child: Row(
            children: items.asMap().entries.map((e) {
              final i = e.key;
              final item = e.value;
              final selected = currentIndex == i;
              return Expanded(
                child: GestureDetector(
                  onTap: () => onTap(i),
                  behavior: HitTestBehavior.opaque,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    curve: Curves.easeOut,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          curve: Curves.easeOut,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 6),
                          decoration: BoxDecoration(
                            color: selected
                                ? AppColors.brandCopper.withOpacity(0.12)
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(AppRadius.full),
                          ),
                          child: Icon(
                            selected ? item.activeIcon : item.icon,
                            color: selected
                                ? AppColors.brandCopper
                                : AppColors.textSecondary,
                            size: 22,
                          ),
                        ),
                        const SizedBox(height: 4),
                        AnimatedDefaultTextStyle(
                          duration: const Duration(milliseconds: 200),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: selected
                                ? FontWeight.w700
                                : FontWeight.w500,
                            color: selected
                                ? AppColors.brandCopper
                                : AppColors.textSecondary,
                          ),
                          child: Text(item.label),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}
