import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

import 'app/home_shell.dart';
import 'data/auth_service.dart';
import 'theme.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint("Handling a background message: ${message.messageId}");
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
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
