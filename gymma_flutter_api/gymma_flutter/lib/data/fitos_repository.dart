import 'package:flutter/foundation.dart';
import 'api_client.dart';

class FitosRepository extends ChangeNotifier {
  FitosRepository._();
  static final FitosRepository instance = FitosRepository._();

  /// Fetches the list of exercises from the Fitos backend.
  Future<List<dynamic>> getExercises() async {
    try {
      final data = await ApiClient.instance.getData(
        '/exercises',
        target: BackendTarget.fitos,
      );
      return data as List<dynamic>;
    } catch (e) {
      debugPrint('Fitos getExercises error: $e');
      rethrow;
    }
  }

  /// Submits an initial physical assessment.
  Future<Map<String, dynamic>> submitAssessment(Map<String, dynamic> responses) async {
    try {
      final data = await ApiClient.instance.postData(
        '/assessments',
        responses,
        target: BackendTarget.fitos,
      );
      return data as Map<String, dynamic>;
    } catch (e) {
      debugPrint('Fitos submitAssessment error: $e');
      rethrow;
    }
  }

  /// Submits a request to generate a workout plan based on the assessment.
  Future<Map<String, dynamic>> generatePlan(Map<String, dynamic> planPreferences) async {
    try {
      final data = await ApiClient.instance.postData(
        '/plans',
        planPreferences,
        target: BackendTarget.fitos,
      );
      return data as Map<String, dynamic>;
    } catch (e) {
      debugPrint('Fitos generatePlan error: $e');
      rethrow;
    }
  }

  /// Fetches a specific workout plan.
  Future<Map<String, dynamic>> getWorkoutPlan(String planId) async {
    try {
      final data = await ApiClient.instance.getData(
        '/plans/$planId',
        target: BackendTarget.fitos,
      );
      return data as Map<String, dynamic>;
    } catch (e) {
      debugPrint('Fitos getWorkoutPlan error: $e');
      rethrow;
    }
  }
}
