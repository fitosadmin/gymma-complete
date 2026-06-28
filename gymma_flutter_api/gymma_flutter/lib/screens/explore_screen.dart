import 'package:flutter/material.dart';
import '../data/api_client.dart';
import '../data/gym_repository.dart';
import '../models/gym.dart';
import '../theme.dart';
import '../widgets/gym_card.dart';
import 'search_screen.dart';
import 'partner_screen.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});
  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  Map<String, List<GymSummary>> _featured = const {};
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await GymRepository.instance.getGyms();
      if (mounted) {
        setState(() {
          _featured = GymRepository.instance.getFeatured();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e is ApiException ? e.message : 'Could not load gyms.';
          _loading = false;
        });
      }
    }
  }

  void _toSearch([String q = '']) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => SearchScreen(initialQuery: q)));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutral0,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.cloud_off,
                            size: 44, color: AppColors.neutral300),
                        const SizedBox(height: 12),
                        Text(_error!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: AppColors.neutral500)),
                        const SizedBox(height: 16),
                        FilledButton(
                            onPressed: _load, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : CustomScrollView(
              slivers: [
                SliverToBoxAdapter(child: _hero()),
                SliverToBoxAdapter(child: _statsBar()),
                _rail("Editor's pick", 'Top rated gyms', _featured['topRated'] ?? []),
                _rail('Closest to you', 'Gyms nearby', _featured['nearby'] ?? []),
                _rail('Best value', 'Affordable gyms', _featured['affordable'] ?? []),
                SliverToBoxAdapter(child: _whyChooseUs()),
                SliverToBoxAdapter(child: _ownerCta()),
                const SliverToBoxAdapter(child: SizedBox(height: 24)),
              ],
            ),
    );
  }

  // ---- Hero ----
  Widget _hero() => Container(
        padding: const EdgeInsets.fromLTRB(20, 56, 20, 32),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.neutral900, AppColors.ink],
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Container(
                height: 36,
                width: 36,
                decoration: BoxDecoration(
                    color: AppColors.primary500,
                    borderRadius: BorderRadius.circular(AppRadius.md)),
                child: const Icon(Icons.fitness_center, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 10),
              const Text('gymma',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.5)),
            ]),
            const SizedBox(height: 28),
            const Text('Find your\nperfect gym.',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 34,
                    fontWeight: FontWeight.w800,
                    height: 1.1,
                    letterSpacing: -1)),
            const SizedBox(height: 12),
            const Text('Discover, compare and join the best gyms across Bengaluru.',
                style: TextStyle(color: Colors.white70, fontSize: 15, height: 1.5)),
            const SizedBox(height: 22),
            GestureDetector(
              onTap: _toSearch,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(AppRadius.full)),
                child: Row(children: const [
                  Icon(Icons.search, color: AppColors.neutral500),
                  SizedBox(width: 10),
                  Text('Search gyms by name, area…',
                      style: TextStyle(color: AppColors.neutral500, fontSize: 15)),
                ]),
              ),
            ),
            const SizedBox(height: 14),
            Wrap(spacing: 8, runSpacing: 8, children: [
              for (final area in const ['Koramangala', 'Indiranagar', 'Jayanagar', 'Malleshwaram'])
                GestureDetector(
                  onTap: () => _toSearch(area),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppRadius.full),
                      border: Border.all(color: Colors.white24),
                    ),
                    child: Text(area, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                  ),
                ),
            ]),
          ],
        ),
      );

  // ---- Stats ----
  Widget _statsBar() => Container(
        color: AppColors.neutral50,
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: GymRepository.platformStats
              .map((s) => Column(children: [
                    Text(s.$1,
                        style: const TextStyle(
                            fontSize: 22, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 2),
                    Text(s.$2,
                        style: const TextStyle(
                            color: AppColors.neutral500, fontSize: 11)),
                  ]))
              .toList(),
        ),
      );

  // ---- Featured rail ----
  Widget _rail(String eyebrow, String title, List<GymSummary> gyms) => SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.only(top: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(eyebrow.toUpperCase(),
                            style: const TextStyle(
                                color: AppColors.primary600,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1)),
                        const SizedBox(height: 2),
                        Text(title,
                            style: const TextStyle(
                                fontSize: 22, fontWeight: FontWeight.w800)),
                      ],
                    ),
                  ),
                  TextButton(onPressed: _toSearch, child: const Text('View all')),
                ]),
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 320,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: gyms.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 14),
                  itemBuilder: (_, i) => SizedBox(width: 290, child: GymCard(gyms[i])),
                ),
              ),
            ],
          ),
        ),
      );

  // ---- Why choose us ----
  Widget _whyChooseUs() {
    const items = [
      (Icons.my_location, 'GPS-powered discovery', 'Find gyms near home, work, or anywhere. Filter by distance, price, and amenities.'),
      (Icons.star_outline, 'Verified reviews & Gymma rating', 'Verified reviews from real members on cleanliness, trainers, equipment, and value — plus a Gymma rating that aggregates quality into one trusted score.'),
      (Icons.verified_user_outlined, 'Transparent pricing', 'See membership plans upfront. No hidden fees, no guesswork — just clear info.'),
      (Icons.groups_outlined, 'Detailed profiles', 'Trainer backgrounds, equipment, gallery, class schedules, and FAQs in one place.'),
      (Icons.compare_arrows, 'Compare side by side', 'Shortlist gyms and compare them on the parameters that matter before deciding.'),
      (Icons.workspace_premium_outlined, 'Curated lists', 'Browse Top Rated, Trending, Nearby, and Affordable collections, updated regularly.'),
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 36, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Why choose Gymma',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 16),
          ...items.map((it) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(color: AppColors.neutral200),
                ),
                child: Row(children: [
                  Container(
                    height: 44,
                    width: 44,
                    decoration: BoxDecoration(
                        color: AppColors.primary50,
                        borderRadius: BorderRadius.circular(AppRadius.md)),
                    child: Icon(it.$1, color: AppColors.primary600),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(it.$2,
                            style: const TextStyle(fontWeight: FontWeight.w700)),
                        const SizedBox(height: 2),
                        Text(it.$3,
                            style: const TextStyle(
                                color: AppColors.neutral500, fontSize: 13, height: 1.4)),
                      ],
                    ),
                  ),
                ]),
              )),
        ],
      ),
    );
  }

  // ---- Owner CTA ----
  Widget _ownerCta() => Container(
        margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
              colors: [AppColors.primary500, AppColors.primary700]),
          borderRadius: BorderRadius.circular(AppRadius.xl),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Own a gym?',
                style: TextStyle(
                    color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            const Text('List your gym on Gymma and reach thousands of members near you.',
                style: TextStyle(color: Colors.white, height: 1.5)),
            const SizedBox(height: 16),
            FilledButton(
              style: FilledButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.primary700,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.md))),
              onPressed: () => Navigator.of(context)
                  .push(MaterialPageRoute(builder: (_) => const PartnerScreen())),
              child: const Text('Partner with us',
                  style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      );
}
