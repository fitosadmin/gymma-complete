import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

/// Distinguishes between authenticated user types so HomeShell
/// can route to the correct shell.
enum AuthRole { member, owner }

class AuthService extends ChangeNotifier {
  AuthService._();
  static final AuthService instance = AuthService._();

  bool _initialized = false;
  String? _token;
  Map<String, dynamic>? _user;
  AuthRole? _role;
  String? _gymId;

  bool get isAuthenticated => _token != null;
  Map<String, dynamic>? get user => _user;
  bool get isInitialized => _initialized;
  AuthRole? get role => _role;

  /// True when the current session belongs to a gym owner.
  bool get isOwner => _role == AuthRole.owner;

  /// The member's own gym id, resolved via /auth/me/gyms at login and cached.
  /// Null for owners (who resolve their gym via OwnerRepository instead) or
  /// if the member has no active gym membership yet.
  String? get gymId => _gymId;

  Future<void> init() async {
    if (_initialized) return;
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    ApiClient.authToken = _token;
    _gymId = prefs.getString('member_gym_id');

    // Restore persisted role so hot-restarts keep the correct shell.
    final savedRole = prefs.getString('auth_role');
    if (savedRole == 'owner') {
      _role = AuthRole.owner;
    } else if (savedRole == 'member') {
      _role = AuthRole.member;
    }

    _initialized = true;
    notifyListeners();
  }

  /// Resolves and caches the logged-in member's gym id via /auth/me/gyms.
  /// Best-effort — a failure here shouldn't block login; broadcast-dependent
  /// screens just treat a null gymId as "no gym yet".
  Future<void> _loadMemberGym() async {
    try {
      final res = await ApiClient.instance.getData('/auth/me/gyms');
      if (res is List && res.isNotEmpty) {
        final first = res.first as Map<String, dynamic>;
        _gymId = first['gym_id'] as String?;
        final prefs = await SharedPreferences.getInstance();
        if (_gymId != null) {
          await prefs.setString('member_gym_id', _gymId!);
        }
      }
    } catch (e) {
      debugPrint('_loadMemberGym error: $e');
    }
  }

  /// Standard member login.
  Future<void> login(String identifier, String password) async {
    try {
      final res = await ApiClient.instance.postData('/auth/login', {
        'identifier': identifier,
        'password': password,
      });

      _token = res['accessToken'];
      _user = res['user'] as Map<String, dynamic>?;
      ApiClient.authToken = _token;
      _role = AuthRole.member;

      if (_token != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token!);
        await prefs.setString('auth_role', 'member');
        await _loadMemberGym();
      }

      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  /// Owner login — same credentials, but the returned user object must have
  /// role == 'owner' | 'admin'. Throws [ApiException] otherwise.
  Future<void> loginAsOwner(String identifier, String password) async {
    try {
      final res = await ApiClient.instance.postData('/auth/login', {
        'identifier': identifier,
        'password': password,
      });

      final userMap = res['user'] as Map<String, dynamic>?;
      final userRole = userMap?['role'] as String? ?? '';

      // Only owner / admin accounts may use the owner portal.
      if (userRole != 'owner' && userRole != 'admin') {
        throw const ApiException(
          'This account is not registered as a gym owner. '
          'Please use "I\'m a Member" to sign in.',
        );
      }

      _token = res['accessToken'];
      _user = userMap;
      ApiClient.authToken = _token;
      _role = AuthRole.owner;

      if (_token != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token!);
        await prefs.setString('auth_role', 'owner');
      }

      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  /// Owner login via Google ID token.
  Future<void> loginAsOwnerWithGoogle(String idToken) async {
    try {
      final res = await ApiClient.instance.postData('/auth/google-owner', {
        'idToken': idToken,
      });

      final userMap = res['user'] as Map<String, dynamic>?;
      final userRole = userMap?['role'] as String? ?? '';

      // Only owner / admin accounts may use the owner portal.
      if (userRole != 'owner' && userRole != 'admin') {
        throw const ApiException(
          'This account is not registered as a gym owner. '
          'Please contact support if you believe this is an error.',
        );
      }

      _token = res['accessToken'];
      _user = userMap;
      ApiClient.authToken = _token;
      _role = AuthRole.owner;

      if (_token != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token!);
        await prefs.setString('auth_role', 'owner');
      }

      notifyListeners();
    } catch (e) {
      rethrow;
    }
  }

  /// POST /auth/forgot-password. The backend always resolves silently
  /// (it never reveals whether the email exists), so any non-network error
  /// here is a genuine problem worth surfacing to the user.
  Future<void> forgotPassword(String email) async {
    await ApiClient.instance.postData('/auth/forgot-password', {'email': email});
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    _role = null;
    _gymId = null;
    ApiClient.authToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('auth_role');
    await prefs.remove('member_gym_id');
    notifyListeners();
  }
}
