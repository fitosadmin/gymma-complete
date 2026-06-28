// Domain models — ported 1:1 from the web app's src/types/gym.ts.

import '../data/api_client.dart' show resolveImageUrl;

class GymSummary {
  final String id;
  final String slug;
  final String name;
  final String? coverImage;
  final String area;
  final String city;
  final double rating; // 0–5
  final int reviewCount;
  final int pricePerMonth; // INR/month
  final double? distanceKm;
  final List<String> amenities;
  final bool isOpenNow;
  final String? opensAt;
  final String? closesAt;
  final bool isPremium;
  final bool womenFriendly;
  final bool hasParking;
  final double lat;
  final double lng;
  final GymExtras? extras; // real Google data (gallery, phone, reviews...)

  const GymSummary({
    required this.id,
    required this.slug,
    required this.name,
    required this.coverImage,
    required this.area,
    required this.city,
    required this.rating,
    required this.reviewCount,
    required this.pricePerMonth,
    required this.distanceKm,
    required this.amenities,
    required this.isOpenNow,
    this.opensAt,
    this.closesAt,
    required this.isPremium,
    required this.womenFriendly,
    required this.hasParking,
    required this.lat,
    required this.lng,
    required this.extras,
  });

  factory GymSummary.fromJson(Map<String, dynamic> j) => GymSummary(
        id: j['id'] as String,
        slug: j['slug'] as String,
        name: j['name'] as String,
        coverImage: j['coverImage'] as String?,
        area: j['area'] as String,
        city: j['city'] as String,
        rating: (j['rating'] as num).toDouble(),
        reviewCount: (j['reviewCount'] as num).toInt(),
        pricePerMonth: (j['pricePerMonth'] as num).toInt(),
        distanceKm: j['distanceKm'] == null
            ? null
            : (j['distanceKm'] as num).toDouble(),
        amenities: (j['amenities'] as List).cast<String>(),
        isOpenNow: j['isOpenNow'] as bool,
        opensAt: j['opensAt'] as String?,
        closesAt: j['closesAt'] as String?,
        isPremium: j['isPremium'] as bool,
        womenFriendly: j['womenFriendly'] as bool,
        hasParking: j['hasParking'] as bool,
        lat: (j['lat'] as num).toDouble(),
        lng: (j['lng'] as num).toDouble(),
        extras: j['extras'] == null ? null : GymExtras.fromJson(j['extras']),
      );

  /// Maps the live backend summary shape (GET /gyms). The backend uses
  /// `coverImageUrl`, `isOpenNow` can be null, and there is no `extras` block.
  factory GymSummary.fromApi(Map<String, dynamic> j) => GymSummary(
        id: j['id'] as String,
        slug: j['slug'] as String,
        name: j['name'] as String,
        coverImage:
            resolveImageUrl((j['coverImageUrl'] ?? j['coverImage']) as String?),
        area: (j['area'] as String?) ?? '',
        city: (j['city'] as String?) ?? 'Bengaluru',
        rating: ((j['rating'] as num?) ?? 0).toDouble(),
        reviewCount: ((j['reviewCount'] as num?) ?? 0).toInt(),
        pricePerMonth: ((j['pricePerMonth'] as num?) ?? 0).toInt(),
        distanceKm: j['distanceKm'] == null
            ? null
            : (j['distanceKm'] as num).toDouble(),
        amenities: (j['amenities'] as List?)?.cast<String>() ?? const [],
        // backend may send null ("unknown") — treat as open so it isn't hidden.
        isOpenNow: (j['isOpenNow'] as bool?) ?? true,
        opensAt: j['opensAt'] as String?,
        closesAt: j['closesAt'] as String?,
        isPremium: (j['isPremium'] as bool?) ?? false,
        womenFriendly: (j['womenFriendly'] as bool?) ?? false,
        hasParking: (j['hasParking'] as bool?) ?? false,
        lat: ((j['lat'] as num?) ?? 0).toDouble(),
        lng: ((j['lng'] as num?) ?? 0).toDouble(),
        extras: null,
      );
}

class GymExtras {
  final List<String> gallery;
  final String phone;
  final String website;
  final String addressLine;
  final List<RealReview> reviews;

  const GymExtras({
    required this.gallery,
    required this.phone,
    required this.website,
    required this.addressLine,
    required this.reviews,
  });

  factory GymExtras.fromJson(Map<String, dynamic> j) => GymExtras(
        gallery: (j['gallery'] as List?)?.cast<String>() ?? const [],
        phone: (j['phone'] as String?) ?? '',
        website: (j['website'] as String?) ?? '',
        addressLine: (j['addressLine'] as String?) ?? '',
        reviews: (j['reviews'] as List?)
                ?.map((e) => RealReview.fromJson(e as Map<String, dynamic>))
                .toList() ??
            const [],
      );
}

class RealReview {
  final int rating;
  final String text;
  final int time;
  final String relativeTime;
  const RealReview(
      {required this.rating,
      required this.text,
      required this.time,
      required this.relativeTime});
  factory RealReview.fromJson(Map<String, dynamic> j) => RealReview(
        rating: (j['rating'] as num).toInt(),
        text: j['text'] as String,
        time: (j['time'] as num).toInt(),
        relativeTime: (j['relativeTime'] as String?) ?? '',
      );
}

class CategoryScores {
  final double cleanliness, equipment, trainers, value, crowd;
  const CategoryScores(
      {required this.cleanliness,
      required this.equipment,
      required this.trainers,
      required this.value,
      required this.crowd});
}

class Trainer {
  final String id, name, specialization;
  final int yearsExperience, pricePerSession;
  final List<String> languages;
  const Trainer(
      {required this.id,
      required this.name,
      required this.specialization,
      required this.yearsExperience,
      required this.pricePerSession,
      required this.languages});
}

class MembershipPlan {
  final String id, name;
  final int durationMonths, price;
  final List<String> benefits;
  final bool recommended;
  const MembershipPlan(
      {required this.id,
      required this.name,
      required this.durationMonths,
      required this.price,
      required this.benefits,
      this.recommended = false});
}

class GymClass {
  final String id, name, schedule, trainerName;
  final int durationMin;
  const GymClass(
      {required this.id,
      required this.name,
      required this.schedule,
      required this.trainerName,
      required this.durationMin});
}

class Faq {
  final String id, question, answer;
  const Faq({required this.id, required this.question, required this.answer});
}

class Review {
  final String id, body;
  final double rating;
  final DateTime createdAt;
  final int helpfulCount;
  const Review(
      {required this.id,
      required this.body,
      required this.rating,
      required this.createdAt,
      required this.helpfulCount});
}

/// Full detail for the gym page (GET /gyms/:slug). Extends the summary.
class GymDetail {
  final GymSummary summary;
  final String description;
  final int yearsOperating;
  final List<String> certifications;
  final CategoryScores scores;
  final List<Trainer> trainers;
  final List<MembershipPlan> plans;
  final List<GymClass> classes;
  final List<Faq> faqs;
  final List<String> gallery; // urls or category labels
  final String phone, whatsapp, addressLine;
  final List<Review> reviews;

  const GymDetail({
    required this.summary,
    required this.description,
    required this.yearsOperating,
    required this.certifications,
    required this.scores,
    required this.trainers,
    required this.plans,
    required this.classes,
    required this.faqs,
    required this.gallery,
    required this.phone,
    required this.whatsapp,
    required this.addressLine,
    required this.reviews,
  });
}

enum SortKey { relevance, distance, rating, priceAsc }

// ===========================================================================
// Live-backend mappers (GET /gyms/:slug and /gyms/:slug/reviews).
// Field names follow the §12 API (e.g. photoUrl, isRecommended, gallery[].url,
// membershipPlans). Anything nullable on the wire gets a safe fallback so the
// non-nullable model fields the UI relies on are always populated.
// ===========================================================================

extension TrainerApi on Trainer {
  static Trainer fromApi(Map<String, dynamic> j) => Trainer(
        id: (j['id'] ?? '').toString(),
        name: (j['name'] as String?) ?? 'Trainer',
        specialization: (j['specialization'] as String?) ?? '',
        yearsExperience: ((j['yearsExperience'] as num?) ?? 0).toInt(),
        pricePerSession: ((j['pricePerSession'] as num?) ?? 0).toInt(),
        languages: (j['languages'] as List?)?.cast<String>() ?? const [],
      );
}

extension MembershipPlanApi on MembershipPlan {
  static MembershipPlan fromApi(Map<String, dynamic> j) => MembershipPlan(
        id: (j['id'] ?? '').toString(),
        name: (j['name'] as String?) ?? '',
        durationMonths: ((j['durationMonths'] as num?) ?? 1).toInt(),
        price: ((j['price'] as num?) ?? 0).toInt(),
        benefits: (j['benefits'] as List?)?.cast<String>() ?? const [],
        recommended: (j['isRecommended'] as bool?) ?? false,
      );
}

extension GymClassApi on GymClass {
  static GymClass fromApi(Map<String, dynamic> j) => GymClass(
        id: (j['id'] ?? '').toString(),
        name: (j['name'] as String?) ?? '',
        schedule: (j['schedule'] as String?) ?? '',
        trainerName: (j['trainerName'] as String?) ?? '',
        durationMin: ((j['durationMin'] as num?) ?? 0).toInt(),
      );
}

extension FaqApi on Faq {
  static Faq fromApi(Map<String, dynamic> j) => Faq(
        id: (j['id'] ?? '').toString(),
        question: (j['question'] as String?) ?? '',
        answer: (j['answer'] as String?) ?? '',
      );
}

extension ReviewApi on Review {
  /// GET /gyms/:slug/reviews → { id, authorLabel, rating, body, helpfulCount,
  /// source, createdAt }.
  static Review fromApi(Map<String, dynamic> j) => Review(
        id: (j['id'] ?? '').toString(),
        body: (j['body'] as String?) ?? '',
        rating: ((j['rating'] as num?) ?? 0).toDouble(),
        createdAt: DateTime.tryParse((j['createdAt'] ?? '').toString()) ??
            DateTime.now(),
        helpfulCount: ((j['helpfulCount'] as num?) ?? 0).toInt(),
      );
}

extension CategoryScoresApi on CategoryScores {
  static CategoryScores fromApi(Map<String, dynamic>? j, double rating) {
    double v(String k) => ((j?[k] as num?) ?? rating).toDouble();
    return CategoryScores(
      cleanliness: v('cleanliness'),
      equipment: v('equipment'),
      trainers: v('trainers'),
      value: v('value'),
      crowd: v('crowd'),
    );
  }
}

extension GymDetailApi on GymDetail {
  /// GET /gyms/:slug. [reviews] is fetched separately and passed in.
  static GymDetail fromApi(
    Map<String, dynamic> j, {
    List<Review> reviews = const [],
  }) {
    final summary = GymSummary.fromApi(j);
    final gallery = (j['gallery'] as List?)
            ?.map((e) =>
                resolveImageUrl((e is Map ? e['url'] : e)?.toString()) ?? '')
            .where((u) => u.isNotEmpty)
            .toList() ??
        const <String>[];
    return GymDetail(
      summary: summary,
      description: (j['description'] as String?) ?? '',
      yearsOperating: ((j['yearsOperating'] as num?) ?? 0).toInt(),
      certifications:
          (j['certifications'] as List?)?.cast<String>() ?? const [],
      scores: CategoryScoresApi.fromApi(
          j['scores'] as Map<String, dynamic>?, summary.rating),
      trainers: (j['trainers'] as List?)
              ?.map((e) => TrainerApi.fromApi(e as Map<String, dynamic>))
              .toList() ??
          const [],
      plans: (j['membershipPlans'] as List?)
              ?.map((e) => MembershipPlanApi.fromApi(e as Map<String, dynamic>))
              .toList() ??
          const [],
      classes: (j['classes'] as List?)
              ?.map((e) => GymClassApi.fromApi(e as Map<String, dynamic>))
              .toList() ??
          const [],
      faqs: (j['faqs'] as List?)
              ?.map((e) => FaqApi.fromApi(e as Map<String, dynamic>))
              .toList() ??
          const [],
      gallery: gallery,
      phone: (j['phone'] as String?) ?? '',
      whatsapp: (j['whatsapp'] as String?) ?? (j['phone'] as String?) ?? '',
      addressLine: (j['addressLine'] as String?) ?? '',
      reviews: reviews,
    );
  }
}
