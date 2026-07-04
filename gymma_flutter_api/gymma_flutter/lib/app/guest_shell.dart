import 'package:flutter/material.dart';

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
            icon: Icon(Icons.login),
            selectedIcon: Icon(Icons.login),
            label: 'Sign In',
          ),
        ],
      ),
    );
  }
}
