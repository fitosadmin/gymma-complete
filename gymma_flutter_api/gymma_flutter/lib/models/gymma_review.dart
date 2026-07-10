// Models for the Gymma review/rating system (gymma-reviews-api).
// Field names follow the live API shapes in gymma.service.ts — snake_case
// on the wire, mapped to camelCase here to match the rest of the app's models.

/// One poll question. `responseType` drives which input widget renders;
/// the value submitted back must always be an integer 0-100 in steps of 5.
class PollQuestion {
  final String id;
  final int questionNumber;
  final String dimension;
  final String questionText;
  final String responseType; // likert5 | binary3 | overall5 | nps11 | frequency5
  final int displayOrder;

  const PollQuestion({
    required this.id,
    required this.questionNumber,
    required this.dimension,
    required this.questionText,
    required this.responseType,
    required this.displayOrder,
  });

  factory PollQuestion.fromJson(Map<String, dynamic> j) => PollQuestion(
        id: (j['id'] ?? '').toString(),
        questionNumber: (j['question_number'] as num).toInt(),
        dimension: (j['dimension'] as String?) ?? 'meta',
        questionText: (j['question_text'] as String?) ?? '',
        responseType: (j['response_type'] as String?) ?? 'likert5',
        displayOrder: ((j['display_order'] as num?) ?? 0).toInt(),
      );
}

/// A gym's current Gymma Score — GET /gym-score. Null (via a 404 from the
/// API) means no submissions yet, which is the default state for almost
/// every gym right now, not an error.
class GymmaScore {
  final String gymId;
  final double bayesianScore;
  final double rawAvgScore;
  final String tier; // none | critical | needs_improvement | good | excellent | elite
  final int reviewCount;
  final Map<String, double> dimensionScores;
  final String? trendDirection; // rising | stable | declining
  final DateTime? lastCalculatedAt;

  const GymmaScore({
    required this.gymId,
    required this.bayesianScore,
    required this.rawAvgScore,
    required this.tier,
    required this.reviewCount,
    required this.dimensionScores,
    required this.trendDirection,
    required this.lastCalculatedAt,
  });

  factory GymmaScore.fromJson(Map<String, dynamic> j) => GymmaScore(
        gymId: (j['gym_id'] ?? '').toString(),
        bayesianScore: ((j['bayesian_score'] as num?) ?? 0).toDouble(),
        rawAvgScore: ((j['raw_avg_score'] as num?) ?? 0).toDouble(),
        tier: (j['tier'] as String?) ?? 'none',
        reviewCount: ((j['review_count'] as num?) ?? 0).toInt(),
        dimensionScores: ((j['dimension_scores'] as Map?) ?? {}).map(
            (k, v) => MapEntry(k.toString(), ((v as num?) ?? 0).toDouble())),
        trendDirection: j['trend_direction'] as String?,
        lastCalculatedAt: j['last_calculated_at'] == null
            ? null
            : DateTime.tryParse(j['last_calculated_at'].toString()),
      );
}

class DimensionBreakdownEntry {
  final String dimension;
  final double score;
  final double? weight;

  const DimensionBreakdownEntry({
    required this.dimension,
    required this.score,
    required this.weight,
  });

  factory DimensionBreakdownEntry.fromJson(Map<String, dynamic> j) => DimensionBreakdownEntry(
        dimension: (j['dimension'] as String?) ?? '',
        score: ((j['score'] as num?) ?? 0).toDouble(),
        weight: (j['weight'] as num?)?.toDouble(),
      );
}

/// Display metadata for the 6 canonical scoring dimensions — the API only
/// returns keys, this maps them to human-friendly labels + icons.
const gymmaDimensionLabels = <String, String>{
  'equipment': 'Equipment',
  'cleanliness': 'Cleanliness',
  'staff': 'Staff',
  'environment': 'Atmosphere',
  'value': 'Value',
  'safety': 'Safety',
};

const gymmaTierLabels = <String, String>{
  'elite': 'Elite',
  'excellent': 'Excellent',
  'good': 'Good',
  'needs_improvement': 'Needs improvement',
  'critical': 'Critical',
  'none': 'Not yet rated',
};
