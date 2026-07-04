import 'package:flutter/material.dart';

import '../data/auth_service.dart';
import 'member_shell.dart';
import 'guest_shell.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
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

    if (AuthService.instance.isAuthenticated) {
      return const MemberShell();
    } else {
      return const GuestShell();
    }
  }
}

