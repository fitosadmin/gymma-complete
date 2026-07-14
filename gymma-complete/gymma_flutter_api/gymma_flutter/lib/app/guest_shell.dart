import 'package:flutter/material.dart';
import '../screens/explore_screen.dart';
import '../screens/search_screen.dart';
import '../screens/compare_screen.dart';
import '../widgets/gymma_nav_bar.dart';

/// Shell shown to unauthenticated users who clicked "Browse Gyms".
/// The last tab "Sign In" intercepts the tap and triggers [onSignInTap]
/// to return the user to the standalone OnboardingScreen.
class GuestShell extends StatefulWidget {
  final VoidCallback onSignInTap;

  const GuestShell({super.key, required this.onSignInTap});

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
      const SizedBox(), // Placeholder for the 4th tab
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: GymmaNavBar(
        currentIndex: _index,
        onTap: (i) {
          if (i == 3) {
            // They tapped "Sign In" — hand control back to HomeShell
            widget.onSignInTap();
          } else {
            setState(() => _index = i);
          }
        },
        items: const [
          GymmaNavItem(
              icon: Icons.explore_outlined,
              activeIcon: Icons.explore_rounded,
              label: 'Explore'),
          GymmaNavItem(
              icon: Icons.search_rounded,
              activeIcon: Icons.search_rounded,
              label: 'Discover'),
          GymmaNavItem(
              icon: Icons.compare_arrows_outlined,
              activeIcon: Icons.compare_arrows_rounded,
              label: 'Compare'),
          GymmaNavItem(
              icon: Icons.login_rounded,
              activeIcon: Icons.login_rounded,
              label: 'Sign In'),
        ],
      ),
    );
  }
}
