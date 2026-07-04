import 'package:flutter/material.dart';

import 'app/home_shell.dart';
import 'data/auth_service.dart';
import 'theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AuthService.instance.init();
  // Data is now fetched from the live API by each screen on demand.
  runApp(const GymmaApp());
}

class GymmaApp extends StatelessWidget {
  const GymmaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'gymma',
      debugShowCheckedModeBanner: false,
      theme: buildGymmaTheme(),
      home: const HomeShell(),
    );
  }
}
