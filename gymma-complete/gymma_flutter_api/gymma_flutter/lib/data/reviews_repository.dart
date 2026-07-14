import '../models/gymma_review.dart';
import 'api_client.dart';

/// Wraps the gymma-reviews-api endpoints the mobile app needs:
///   getPoll()               -> GET /poll
///   submitPoll()             -> POST /submit
///   getGymScore()             -> GET /gym-score   (404 = no submissions yet, not an error)
///   getDimensionBreakdown()  -> GET /dimension-breakdown (same 404 handling)
///
/// /poll and /submit require a logged-in member with an active membership
/// at the target gym — the backend enforces that, this layer just surfaces
/// whatever message it sends back (e.g. "An active membership at this gym
/// is required to submit a rating").
class ReviewsRepository {
  ReviewsRepository._();
  static final ReviewsRepository instance = ReviewsRepository._();

  final ApiClient _api = ApiClient.instance;

  Future<List<PollQuestion>> getPoll(String gymId) async {
    final data = await _api.getData(
      '/poll',
      query: {'gym_id': gymId},
      target: BackendTarget.reviews,
    ) as Map<String, dynamic>;
    final questions = (data['questions'] as List? ?? [])
        .map((e) => PollQuestion.fromJson(e as Map<String, dynamic>))
        .toList()
      ..sort((a, b) => a.displayOrder.compareTo(b.displayOrder));
    return questions;
  }

  /// [responses] maps question number -> score (0-100, steps of 5).
  Future<Map<String, dynamic>> submitPoll({
    required String gymId,
    required Map<int, int> responses,
    required int submissionTimeMs,
  }) async {
    final data = await _api.postData(
      '/submit',
      {
        'gym_id': gymId,
        'responses': responses.map((k, v) => MapEntry(k.toString(), v)),
        'submission_time_ms': submissionTimeMs,
      },
      target: BackendTarget.reviews,
    );
    return data as Map<String, dynamic>;
  }

  Future<GymmaScore?> getGymScore(String gymId) async {
    try {
      final data = await _api.getData(
        '/gym-score',
        query: {'gym_id': gymId},
        target: BackendTarget.reviews,
      );
      return GymmaScore.fromJson(data as Map<String, dynamic>);
    } on ApiException catch (e) {
      if (e.statusCode == 404) return null;
      rethrow;
    }
  }

  Future<List<DimensionBreakdownEntry>> getDimensionBreakdown(String gymId) async {
    try {
      final data = await _api.getData(
        '/dimension-breakdown',
        query: {'gym_id': gymId},
        target: BackendTarget.reviews,
      ) as Map<String, dynamic>;
      return (data['dimensions'] as List? ?? [])
          .map((e) => DimensionBreakdownEntry.fromJson(e as Map<String, dynamic>))
          .toList();
    } on ApiException catch (e) {
      if (e.statusCode == 404) return [];
      rethrow;
    }
  }
}
