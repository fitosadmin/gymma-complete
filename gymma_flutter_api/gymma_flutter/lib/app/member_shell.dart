import 'package:flutter/material.dart';

import '../screens/member_dashboard_screen.dart';
import '../screens/workout_dashboard_screen.dart';
import '../screens/profile_screen.dart';

import '../widgets/gymma_nav_bar.dart';

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
      const ProfileScreen(),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: GymmaNavBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: const [
          GymmaNavItem(icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard_rounded, label: 'Home'),
          GymmaNavItem(icon: Icons.fitness_center_outlined, activeIcon: Icons.fitness_center_rounded, label: 'Workouts'),
          GymmaNavItem(icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Profile'),
        ],
      ),
    );
  }
}
