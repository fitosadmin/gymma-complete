import 'package:flutter/foundation.dart';
import 'api_client.dart';

class OwnerRepository {
  /// Fetches the gyms owned by the authenticated owner.
  /// Typically returns a list, and the first item is the primary gym.
  Future<List<Map<String, dynamic>>> listOwnerGyms() async {
    try {
      final res = await ApiClient.instance.getData('/owner/gyms');
      if (res is List) {
        return List<Map<String, dynamic>>.from(res);
      }
      return [];
    } catch (e) {
      debugPrint('listOwnerGyms error: $e');
      throw Exception('Failed to load your gym details.');
    }
  }

  /// Fetches the list of members for a specific gym.
  Future<List<Map<String, dynamic>>> getGymMembers(String gymId) async {
    try {
      final res = await ApiClient.instance.getData('/owner/gyms/$gymId/members');
      if (res is List) {
        return List<Map<String, dynamic>>.from(res);
      }
      return [];
    } catch (e) {
      debugPrint('getGymMembers error: $e');
      throw Exception('Failed to load gym members.');
    }
  }

  /// Adds a member to the gym by name and phone.
  Future<Map<String, dynamic>> addMember(String gymId, String fullName, String phone) async {
    try {
      final res = await ApiClient.instance.postData('/owner/gyms/$gymId/members', {
        'fullName': fullName,
        'phone': phone,
      });
      return res as Map<String, dynamic>;
    } catch (e) {
      rethrow;
    }
  }

  /// Removes a member from the gym.
  Future<void> removeMember(String gymId, String memberId) async {
    try {
      await ApiClient.instance.deleteData('/owner/gyms/$gymId/members/$memberId');
    } catch (e) {
      rethrow;
    }
  }
}
