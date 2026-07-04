import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth_service.dart';
/// =============================================================================
/// SET THIS to your deployed backend, INCLUDING the /api/v1 suffix.
/// e.g. https://gymma-api.onrender.com/api/v1
///
/// You can also override at run time without editing code:
///   flutter run --dart-define=API_BASE_URL=https://your-api.onrender.com/api/v1
/// =============================================================================
const String _fallbackBaseUrl = 'https://gymma-api.onrender.com/api/v1';

const String kApiBaseUrl =
    String.fromEnvironment('API_BASE_URL', defaultValue: _fallbackBaseUrl);

/// Deployed fitos backend on Render.
/// To test locally: flutter run --dart-define=FITOS_BASE_URL=http://<YOUR_LAN_IP>:3002/api/v1
const String _fallbackFitosBaseUrl = 'https://fitos-api.onrender.com/api/v1';

const String kFitosBaseUrl =
    String.fromEnvironment('FITOS_BASE_URL', defaultValue: _fallbackFitosBaseUrl);

/// =============================================================================
/// Gym photos are stored in the DB as RELATIVE paths (e.g.
/// /images/gyms/fitness-solutions_0.jpg) and the actual .jpg files are served
/// by your DEPLOYED FRONTEND, not the API. Set this to your frontend origin
/// (NO trailing /api, NO path) so the app can build absolute image URLs.
///   e.g. https://gymma.vercel.app
///
/// Override at run time:
///   flutter run --dart-define=IMAGE_BASE_URL=https://gymma.vercel.app
/// =============================================================================
const String _fallbackImageBaseUrl = 'https://gymma-seven.vercel.app';

const String kImageBaseUrl = String.fromEnvironment('IMAGE_BASE_URL',
    defaultValue: _fallbackImageBaseUrl);

enum BackendTarget {
  core,
  fitos,
}

/// Turns a possibly-relative image path into an absolute URL the app can load.
/// Absolute http(s) URLs (or non-path placeholder labels) are returned as-is.
String? resolveImageUrl(String? url) {
  if (url == null || url.trim().isEmpty) return null;
  final u = url.trim();
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (!u.startsWith('/')) return u; // e.g. a category label, not a path
  final base = kImageBaseUrl.endsWith('/')
      ? kImageBaseUrl.substring(0, kImageBaseUrl.length - 1)
      : kImageBaseUrl;
  return '$base$u';
}

/// Thrown for any non-success API outcome. [message] is safe to show to users.
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  const ApiException(this.message, {this.statusCode});
  @override
  String toString() => 'ApiException($statusCode): $message';
}

/// Thin HTTP client around the §12 API. Mirrors the web app's src/lib/api.ts:
/// every backend response is the envelope { success, data, meta } and we unwrap
/// it here so the rest of the app only deals with plain data.
///
/// Render free instances cold-start (can take 30–50s on the first hit), so the
/// timeout is generous and the first failure is retried once.
class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  final http.Client _http = http.Client();
  static const Duration _timeout = Duration(seconds: 45);

  static String? authToken;

  Uri _uri(String path, BackendTarget target, [Map<String, dynamic>? query]) {
    final String baseUrl = target == BackendTarget.fitos ? kFitosBaseUrl : kApiBaseUrl;
    final base = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    final clean = path.startsWith('/') ? path : '/$path';
    final qp = <String, dynamic>{};
    query?.forEach((k, v) {
      if (v == null) return;
      qp[k] = v is List ? v.map((e) => e.toString()).toList() : v.toString();
    });
    return Uri.parse('$base$clean').replace(
      queryParameters: qp.isEmpty ? null : qp,
    );
  }

  Map<String, String> _headers() {
    final h = <String, String>{
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    if (authToken != null) {
      h['Authorization'] = 'Bearer $authToken';
    }
    return h;
  }

  /// GET → returns the unwrapped `data`. [meta] (pagination) is ignored here.
  Future<dynamic> getData(String path, {Map<String, dynamic>? query, BackendTarget target = BackendTarget.core}) async {
    final uri = _uri(path, target, query);
    return _send(() => _http.get(uri, headers: _headers()), target: target);
  }

  /// POST a JSON body → returns the unwrapped `data`.
  Future<dynamic> postData(String path, Map<String, dynamic> body, {BackendTarget target = BackendTarget.core}) async {
    final uri = _uri(path, target);
    return _send(() => _http.post(
          uri,
          headers: _headers(),
          body: jsonEncode(body),
        ), target: target);
  }

  Future<dynamic> _send(Future<http.Response> Function() request, {BackendTarget target = BackendTarget.core}) async {
    http.Response res;
    try {
      res = await request().timeout(_timeout);
    } on TimeoutException {
      // One retry — covers Render cold starts.
      try {
        res = await request().timeout(_timeout);
      } on TimeoutException {
        throw const ApiException(
            'The server took too long to respond. Please try again.');
      }
    } catch (_) {
      throw const ApiException(
          'Could not reach the server. Check your connection and try again.');
    }

    dynamic parsedJson;
    try {
      parsedJson = jsonDecode(res.body);
    } catch (_) {
      throw ApiException('Unexpected server response.',
          statusCode: res.statusCode);
    }

    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (target == BackendTarget.fitos) {
        return parsedJson;
      } else if (parsedJson is Map && parsedJson['success'] == true) {
        return parsedJson['data'];
      }
    }
    
    String msg = 'Request failed (${res.statusCode}).';
    if (parsedJson is Map) {
      final err = parsedJson['error'];
      if (err is Map && err['message'] is String) {
        msg = err['message'] as String;
      } else if (parsedJson['message'] is String) {
        msg = parsedJson['message'] as String;
      }
    }
    if (res.statusCode == 401) {
      AuthService.instance.logout();
    }

    throw ApiException(msg, statusCode: res.statusCode);
  }
}
