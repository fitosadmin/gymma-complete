import 'package:flutter/foundation.dart';
import 'api_client.dart';

/// Data layer for broadcast-api (gym-wide announcements). Mirrors the
/// try/catch/rethrow shape of owner_repository.dart.
class BroadcastRepository {
  static const _target = BackendTarget.broadcast;

  /// Paginated announcements for a gym, newest first.
  Future<List<Map<String, dynamic>>> listBroadcasts(
    String gymId, {
    int page = 1,
    int limit = 20,
    bool unreadOnly = false,
  }) async {
    try {
      final res = await ApiClient.instance.getData(
        '/broadcasts',
        query: {
          'gym_id': gymId,
          'page': page,
          'limit': limit,
          if (unreadOnly) 'unread_only': true,
        },
        target: _target,
      );
      if (res is List) return List<Map<String, dynamic>>.from(res);
      return [];
    } catch (e) {
      debugPrint('listBroadcasts error: $e');
      throw Exception('Failed to load announcements.');
    }
  }

  /// Best-effort unread count for the bell badge. ApiClient discards response
  /// headers/meta by design, so this counts unread items directly rather than
  /// trusting the X-Total-Unread header or pagination meta.
  Future<int> unreadCount(String gymId) async {
    final items = await listBroadcasts(gymId, unreadOnly: true, limit: 100);
    return items.length;
  }

  /// Single broadcast — includes receipt_stats when the caller is the sender/owner.
  Future<Map<String, dynamic>?> getBroadcast(String id) async {
    try {
      final res = await ApiClient.instance.getData('/broadcasts/$id', target: _target);
      return res as Map<String, dynamic>?;
    } catch (e) {
      debugPrint('getBroadcast error: $e');
      throw Exception('Failed to load announcement.');
    }
  }

  /// Idempotent — the backend resolves gym_id from the broadcast row itself.
  Future<void> markRead(String id) async {
    try {
      await ApiClient.instance.patchData('/broadcasts/$id/read', const {}, target: _target);
    } catch (e) {
      debugPrint('markRead error: $e');
      rethrow;
    }
  }

  /// Owner/admin only — the backend enforces gym ownership server-side.
  Future<Map<String, dynamic>> createBroadcast(
    String gymId,
    String title,
    String message, {
    String type = 'announcement',
    String priority = 'normal',
  }) async {
    try {
      final res = await ApiClient.instance.postData(
        '/broadcasts',
        {
          'gym_id': gymId,
          'title': title,
          'message': message,
          'type': type,
          'priority': priority,
        },
        target: _target,
      );
      return res as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }
}
