import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../screens/owner_dashboard_screen.dart';
import '../screens/profile_screen.dart';
import '../widgets/gymma_nav_bar.dart';

/// Bottom-nav shell shown to authenticated gym owners.
/// Tabs: Dashboard | Profile (logout lives here)
class OwnerShell extends StatefulWidget {
  const OwnerShell({super.key});
  @override
  State<OwnerShell> createState() => _OwnerShellState();
}

class _OwnerShellState extends State<OwnerShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      const OwnerDashboardScreen(),
      const ProfileScreen(),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: GymmaNavBar(
        currentIndex: _index,
        onTap: (i) {
          HapticFeedback.selectionClick();
          setState(() => _index = i);
        },
        items: const [
          GymmaNavItem(
              icon: Icons.dashboard_outlined,
              activeIcon: Icons.dashboard_rounded,
              label: 'Dashboard'),
          GymmaNavItem(
              icon: Icons.person_outline_rounded,
              activeIcon: Icons.person_rounded,
              label: 'Profile'),
        ],
      ),
    );
  }
}
