import 'package:flutter/foundation.dart';
import 'api_client.dart';

/// Data layer for diet_suggestion (BMR/TDEE/macro calculator). Mirrors the
/// try/catch/rethrow shape of fitos_repository.dart / broadcast_repository.dart.
/// Reuses the same session JWT as every other backend target — diet_suggestion
/// shares gymma-api's users table and JWT secret, so there's no separate login.
class DietRepository {
  DietRepository._();
  static final DietRepository instance = DietRepository._();

  static const _target = BackendTarget.diet;

  /// Runs the calculator and persists the result. [input] should already
  /// have null optional fields stripped.
  Future<Map<String, dynamic>> calculate(Map<String, dynamic> input) async {
    try {
      final data = await ApiClient.instance.postData('/diet/calculate', input, target: _target);
      return data as Map<String, dynamic>;
    } catch (e) {
      debugPrint('Diet calculate error: $e');
      rethrow;
    }
  }

  /// Most recently created plan, or null if the user has never calculated one.
  Future<Map<String, dynamic>?> getActivePlan() async {
    try {
      final data = await ApiClient.instance.getData('/diet/active', target: _target);
      return data as Map<String, dynamic>?;
    } catch (e) {
      debugPrint('Diet getActivePlan error: $e');
      rethrow;
    }
  }

  /// Paginated plan history, newest first.
  Future<List<Map<String, dynamic>>> listPlans({int page = 1, int limit = 10}) async {
    try {
      final data = await ApiClient.instance.getData(
        '/diet/plans',
        query: {'page': page, 'limit': limit},
        target: _target,
      );
      if (data is List) return List<Map<String, dynamic>>.from(data);
      return [];
    } catch (e) {
      debugPrint('Diet listPlans error: $e');
      rethrow;
    }
  }

  Future<Map<String, dynamic>> getPlan(String id) async {
    try {
      final data = await ApiClient.instance.getData('/diet/plans/$id', target: _target);
      return data as Map<String, dynamic>;
    } catch (e) {
      debugPrint('Diet getPlan error: $e');
      rethrow;
    }
  }

  /// Either field may be omitted — the backend keeps the existing value via COALESCE.
  Future<Map<String, dynamic>> updateNote(String id, {String? userNote, String? label}) async {
    try {
      final body = <String, dynamic>{};
      if (userNote != null) body['userNote'] = userNote;
      if (label != null) body['label'] = label;
      final data = await ApiClient.instance.putData('/diet/plans/$id/note', body, target: _target);
      return data as Map<String, dynamic>;
    } catch (e) {
      debugPrint('Diet updateNote error: $e');
      rethrow;
    }
  }

  Future<void> deletePlan(String id) async {
    try {
      await ApiClient.instance.deleteData('/diet/plans/$id', target: _target);
    } catch (e) {
      debugPrint('Diet deletePlan error: $e');
      rethrow;
    }
  }
}
