import '../models/gym.dart';
import 'api_client.dart';

/// THE SWAP POINT (mirrors the web's src/lib/api.ts). Now backed by the live
/// §12 API instead of the bundled JSON asset:
///   getGyms()        -> GET /gyms
///   getGymDetail()   -> GET /gyms/:slug  (+ /gyms/:slug/reviews)
///   getReviews()     -> GET /gyms/:slug/reviews
///   createInquiry()  -> POST /inquiries
///   createDemoRequest() -> POST /demo-requests
class GymRepository {
  GymRepository._();
  static final GymRepository instance = GymRepository._();

  final ApiClient _api = ApiClient.instance;

  List<GymSummary>? _gyms;
  final Map<String, GymDetail> _detailCache = {};

  /// GET /gyms — fetched once and cached for the session.
  /// We pull a large page and let the existing screens filter/sort client-side,
  /// so the UX matches the web while the data is real.
  Future<List<GymSummary>> getGyms({bool refresh = false}) async {
    if (_gyms != null && !refresh) return _gyms!;
    final data = await _api.getData('/gyms', query: {'limit': 100});
    final list = (data as List)
        .map((e) => GymSummary.fromApi(e as Map<String, dynamic>))
        .toList();
    _gyms = list;
    return list;
  }

  GymSummary? findBySlug(String slug) =>
      _gyms?.where((g) => g.slug == slug).cast<GymSummary?>().firstOrNull;

  /// GET /gyms/:slug (+ its reviews). Cached per slug.
  Future<GymDetail> getGymDetail(String slug, {bool refresh = false}) async {
    if (!refresh && _detailCache.containsKey(slug)) return _detailCache[slug]!;
    final results = await Future.wait([
      _api.getData('/gyms/$slug'),
      getReviews(slug),
    ]);
    final detailJson = results[0] as Map<String, dynamic>;
    final reviews = results[1] as List<Review>;
    final detail = GymDetailApi.fromApi(detailJson, reviews: reviews);
    _detailCache[slug] = detail;
    return detail;
  }

  /// GET /gyms/:slug/reviews
  Future<List<Review>> getReviews(String slug) async {
    final data =
        await _api.getData('/gyms/$slug/reviews', query: {'limit': 20});
    return (data as List)
        .map((e) => ReviewApi.fromApi(e as Map<String, dynamic>))
        .toList();
  }

  /// POST /inquiries — lead capture from the gym detail page.
  Future<void> createInquiry({
    required String gymId,
    required String name,
    required String phone,
    String? message,
    String? planInterest,
  }) async {
    await _api.postData('/inquiries', {
      'gymId': gymId,
      'name': name,
      'phone': phone,
      if (message != null && message.trim().isNotEmpty)
        'message': message.trim(),
      if (planInterest != null && planInterest.trim().isNotEmpty)
        'planInterest': planInterest.trim(),
      'sourcePage': 'mobile-app',
    });
  }

  /// POST /demo-requests — "Partner with us" form.
  Future<void> createDemoRequest({
    required String name,
    required String phone,
    required String email,
    required String gymName,
    String? area,
    String? notes,
  }) async {
    await _api.postData('/demo-requests', {
      'name': name,
      'phone': phone,
      'email': email,
      'gymName': gymName,
      'city': 'Bengaluru',
      if (area != null && area.trim().isNotEmpty) 'area': area.trim(),
      if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
    });
  }

  // ---- Curated rails for the landing page (spec §5.2.4) ----
  Map<String, List<GymSummary>> getFeatured() {
    final g = _gyms ?? const <GymSummary>[];
    List<GymSummary> by(int Function(GymSummary a, GymSummary b) c) =>
        [...g]..sort(c);
    return {
      'topRated': by((a, b) => b.rating.compareTo(a.rating)).take(3).toList(),
      'nearby': by((a, b) => (a.distanceKm ?? 99).compareTo(b.distanceKm ?? 99))
          .take(3)
          .toList(),
      'affordable': by((a, b) => a.pricePerMonth.compareTo(b.pricePerMonth))
          .take(3)
          .toList(),
    };
  }

  static List<GymSummary> sortGyms(List<GymSummary> gyms, SortKey sort) {
    final copy = [...gyms];
    switch (sort) {
      case SortKey.distance:
        copy.sort((a, b) => (a.distanceKm ?? double.infinity)
            .compareTo(b.distanceKm ?? double.infinity));
        break;
      case SortKey.rating:
        copy.sort((a, b) => b.rating.compareTo(a.rating));
        break;
      case SortKey.priceAsc:
        copy.sort((a, b) => a.pricePerMonth.compareTo(b.pricePerMonth));
        break;
      case SortKey.relevance:
        break;
    }
    return copy;
  }

  static const platformStats = [
    ('500+', 'Gyms listed'),
    ('50k+', 'Active members'),
    ('4.7★', 'Avg. rating'),
    ('40+', 'Cities'),
  ];
}

extension _FirstOrNull<E> on Iterable<E> {
  E? get firstOrNull => isEmpty ? null : first;
}
