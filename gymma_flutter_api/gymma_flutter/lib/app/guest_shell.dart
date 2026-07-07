import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../screens/explore_screen.dart';
import '../screens/search_screen.dart';
import '../screens/compare_screen.dart';
import '../screens/login_screen.dart';
import '../theme.dart';

class GuestShell extends StatefulWidget {
  const GuestShell({super.key});
  @override
  State<GuestShell> createState() => _GuestShellState();
}

class _GuestShellState extends State<GuestShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      const ExploreScreen(),
      const SearchScreen(),
      const CompareScreen(),
      const LoginScreen(),
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
          _NavItem(icon: Icons.explore_outlined, activeIcon: Icons.explore_rounded, label: 'Explore'),
          _NavItem(icon: Icons.search_rounded, activeIcon: Icons.search_rounded, label: 'Discover'),
          _NavItem(icon: Icons.compare_arrows_outlined, activeIcon: Icons.compare_arrows_rounded, label: 'Compare'),
          _NavItem(icon: Icons.login_rounded, activeIcon: Icons.login_rounded, label: 'Sign In'),
        ],
      ),
    );
  }
}

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
                  child: Column(
                    mainAxisSize: MainAxisSize.max,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        curve: Curves.easeOut,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 5),
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.brandCopper.withOpacity(0.12)
                              : Colors.transparent,
                          borderRadius:
                              BorderRadius.circular(AppRadius.full),
                        ),
                        child: Icon(
                          selected ? item.activeIcon : item.icon,
                          color: selected
                              ? AppColors.brandCopper
                              : AppColors.textSecondary,
                          size: 22,
                        ),
                      ),
                      const SizedBox(height: 2),
                      AnimatedDefaultTextStyle(
                        duration: const Duration(milliseconds: 200),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight:
                              selected ? FontWeight.w700 : FontWeight.w500,
                          color: selected
                              ? AppColors.brandCopper
                              : AppColors.textSecondary,
                        ),
                        child: Text(item.label),
                      ),
                    ],
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
