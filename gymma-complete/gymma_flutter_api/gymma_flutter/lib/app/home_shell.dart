import 'package:flutter/material.dart';

import '../data/auth_service.dart';
import 'member_shell.dart';
import 'owner_shell.dart';
import 'guest_shell.dart';
import '../screens/onboarding_screen.dart';

/// Root router widget. Listens to [AuthService] and switches between
/// OnboardingScreen → GuestShell → MemberShell → OwnerShell based on auth state & role.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  // When unauthenticated, we start on the Onboarding screen (no nav bar).
  bool _showOnboarding = true;

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
      return const Scaffold(
          body: Center(child: CircularProgressIndicator()));
    }

    if (AuthService.instance.isAuthenticated) {
      if (AuthService.instance.isOwner) {
        return const OwnerShell();
      }
      return const MemberShell();
    }

    if (_showOnboarding) {
      // Full screen onboarding, no bottom nav
      return OnboardingScreen(
        onBrowse: () => setState(() => _showOnboarding = false),
      );
    }

    // Unauthenticated, but they chose "Browse Gyms"
    return GuestShell(
      onSignInTap: () => setState(() => _showOnboarding = true),
    );
  }
}
