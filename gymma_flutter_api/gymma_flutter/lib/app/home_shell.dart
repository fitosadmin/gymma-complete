import 'package:flutter/material.dart';

import '../data/auth_service.dart';
import '../screens/explore_screen.dart';
import '../screens/search_screen.dart';
import '../screens/compare_screen.dart';
import '../screens/login_screen.dart';
import '../screens/member_dashboard_screen.dart';
import '../theme.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    AuthService.instance.init();
    AuthService.instance.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!AuthService.instance.isInitialized) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final pages = [
      const ExploreScreen(),
      const SearchScreen(),
      const CompareScreen(),
      AuthService.instance.isAuthenticated
          ? const MemberDashboardScreen()
          : const LoginScreen(),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: Colors.white,
        indicatorColor: AppColors.primary500.withOpacity(0.14),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.explore_outlined),
            selectedIcon: Icon(Icons.explore),
            label: 'Explore',
          ),
          NavigationDestination(
            icon: Icon(Icons.search),
            selectedIcon: Icon(Icons.search),
            label: 'Discover',
          ),
          NavigationDestination(
            icon: Icon(Icons.compare_arrows_outlined),
            selectedIcon: Icon(Icons.compare_arrows),
            label: 'Compare',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
