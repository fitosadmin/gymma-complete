import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

class AuthService extends ChangeNotifier {
  AuthService._();
  static final AuthService instance = AuthService._();

  bool _initialized = false;
  String? _token;
  Map<String, dynamic>? _user;

  bool get isAuthenticated => _token != null;
  Map<String, dynamic>? get user => _user;
  bool get isInitialized => _initialized;

  Future<void> init() async {
    if (_initialized) return;
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    ApiClient.authToken = _token;
    
    // In a real app we'd fetch /auth/me to get the user details if we only have the token, 
    // but for now we'll just set initialized.
    _initialized = true;
    notifyListeners();
  }

  Future<void> login(String identifier, String password) async {
    try {
      final res = await ApiClient.instance.postData('/auth/login', {
        'identifier': identifier,
        'password': password,
      });

      _token = res['accessToken'];
      _user = res['user'] as Map<String, dynamic>?;
      ApiClient.authToken = _token;

      if (_token != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token!);
      }
      
      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    ApiClient.authToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    notifyListeners();
  }
}
