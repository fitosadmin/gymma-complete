import 'package:flutter/material.dart';
import '../data/api_client.dart';
import '../data/gym_repository.dart';
import '../models/gym.dart';
import '../theme.dart';
import '../widgets/gym_card.dart';
import '../widgets/common.dart';
import '../widgets/snap_scroll_physics.dart';
import '../widgets/shimmer.dart';
import 'search_screen.dart';
import 'partner_screen.dart';
import 'gym_detail_screen.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});
  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  Map<String, List<GymSummary>> _featured = const {};
  List<GymSummary> _allGyms = [];
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
      final gyms = await GymRepository.instance.getGyms();
      if (mounted) {
        setState(() {
          _allGyms = gyms;
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

  void _toSearch([String? q, SortKey? sort]) => Navigator.of(context).push(
      MaterialPageRoute(
          builder: (_) => SearchScreen(initialQuery: q ?? '', initialSort: sort)));

  void _openAreaPicker() {
    final areas = _allGyms
        .map((g) => g.area)
        .where((a) => a.isNotEmpty)
        .toSet()
        .toList()
      ..sort();
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl))),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text('Browse by area',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
              ),
            ),
            if (areas.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Text('No areas available yet.',
                    style: TextStyle(color: AppColors.neutral500)),
              )
            else
              Flexible(
                child: ListView(
                  shrinkWrap: true,
                  children: areas
                      .map((a) => ListTile(
                            leading: const Icon(Icons.location_on_outlined),
                            title: Text(a),
                            onTap: () {
                              Navigator.pop(context);
                              _toSearch(a);
                            },
                          ))
                      .toList(),
                ),
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutral0,
      body: _loading
          ? _shimmer()
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
                            style:
                                const TextStyle(color: AppColors.neutral500)),
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
                    _rail("Editor's pick", 'Top rated gyms',
                        _featured['topRated'] ?? [], SortKey.rating),
                    _rail('Closest to you', 'Gyms nearby',
                        _featured['nearby'] ?? [], SortKey.distance),
                    _rail('Best value', 'Affordable gyms',
                        _featured['affordable'] ?? [], SortKey.priceAsc),
                    SliverToBoxAdapter(child: _whyChooseUs()),
                    SliverToBoxAdapter(child: _ownerCta()),
                    const SliverToBoxAdapter(child: SizedBox(height: 24)),
                  ],
                ),
    );
  }

  // ---- Loading skeleton ----
  Widget _shimmer() {
    return ListView(
      padding: EdgeInsets.zero,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        Container(
          padding: const EdgeInsets.fromLTRB(20, 48, 20, 24),
          color: AppColors.brandNavyDark,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                ShimmerBox(
                    width: 40, height: 40, borderRadius: BorderRadius.circular(12)),
                const SizedBox(width: 12),
                ShimmerBox(
                    width: 90, height: 22, borderRadius: BorderRadius.circular(6)),
              ]),
              const SizedBox(height: 28),
              ShimmerBox(
                  width: 220, height: 32, borderRadius: BorderRadius.circular(6)),
              const SizedBox(height: 20),
              ShimmerBox(
                  width: double.infinity,
                  height: 48,
                  borderRadius: BorderRadius.circular(24)),
              const SizedBox(height: 24),
              ShimmerBox(
                  width: double.infinity,
                  height: 92,
                  borderRadius: BorderRadius.circular(16)),
            ],
          ),
        ),
        _shimmerRail(),
        _shimmerRail(),
      ],
    );
  }

  Widget _shimmerRail() => Padding(
        padding: const EdgeInsets.only(top: 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 20),
              child: ShimmerBox(width: 160, height: 16),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 320,
              child: ListView(
                scrollDirection: Axis.horizontal,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: const [
                  SizedBox(width: 290, child: ShimmerCard(height: 320)),
                  SizedBox(width: 14),
                  SizedBox(width: 290, child: ShimmerCard(height: 320)),
                ],
              ),
            ),
          ],
        ),
      );

  // ---- Hero ----
  Widget _hero() {
    final statsIcons = [
      Icons.fitness_center_rounded,
      Icons.people_alt_rounded,
      Icons.star_rounded,
      Icons.location_city_rounded,
    ];
    final currentArea = _featured['nearby']?.isNotEmpty == true 
      ? _featured['nearby']!.first.area 
      : 'Bengaluru';

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 48, 20, 24),
      decoration: const BoxDecoration(
        color: AppColors.brandNavyDark,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              height: 40,
              width: 40,
              decoration: BoxDecoration(
                  gradient: AppGradients.brandGradient,
                  borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.fitness_center,
                  color: Colors.white, size: 24),
            ),
            const SizedBox(width: 12),
            const Text('Gymma',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.5)),
            const Spacer(),
            Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(20),
                onTap: _openAreaPicker,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(20)),
                  child: Row(children: [
                    const Icon(Icons.location_on, color: AppColors.brandCopper, size: 16),
                    const SizedBox(width: 6),
                    Text(currentArea, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(width: 4),
                    const Icon(Icons.keyboard_arrow_down, color: Colors.white, size: 16),
                  ]),
                ),
              ),
            ),
          ]),
          const SizedBox(height: 24),
          const Text.rich(TextSpan(
            style: TextStyle(
                fontSize: 34,
                fontWeight: FontWeight.w800,
                height: 1.1,
                letterSpacing: -1.2),
            children: [
              TextSpan(text: 'Find your\n', style: TextStyle(color: Colors.white)),
              TextSpan(text: 'perfect gym.', style: TextStyle(color: AppColors.brandCopper)),
            ],
          )),
          const SizedBox(height: 12),
          const Text(
              'Discover, compare and join the\nbest gyms across Bengaluru.',
              style: TextStyle(
                  color: Colors.white70, fontSize: 14, height: 1.4)),
          const SizedBox(height: 20),
          RawAutocomplete<GymSummary>(
            optionsBuilder: (TextEditingValue val) {
              if (val.text.isEmpty) return const Iterable<GymSummary>.empty();
              final q = val.text.toLowerCase();
              return _allGyms.where((g) => '${g.name} ${g.area} ${g.city}'.toLowerCase().contains(q));
            },
            onSelected: (GymSummary g) {
              Navigator.of(context).push(MaterialPageRoute(builder: (_) => GymDetailScreen(slug: g.slug)));
            },
            fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
              return TextField(
                controller: controller,
                focusNode: focusNode,
                onSubmitted: (val) {
                  onFieldSubmitted();
                  _toSearch(val);
                },
                style: const TextStyle(color: AppColors.neutral700, fontSize: 15),
                decoration: InputDecoration(
                  hintText: 'Search gyms by name, area...',
                  hintStyle: const TextStyle(color: AppColors.neutral400, fontSize: 14),
                  prefixIcon: const Icon(Icons.search, color: AppColors.neutral500, size: 22),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.tune, color: AppColors.neutral500, size: 22),
                    onPressed: () => _toSearch(controller.text),
                  ),
                  isDense: true,
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppRadius.full),
                      borderSide: BorderSide.none),
                ),
              );
            },
            optionsViewBuilder: (context, onSelected, options) {
              return Align(
                alignment: Alignment.topLeft,
                child: Material(
                  elevation: 8,
                  borderRadius: BorderRadius.circular(16),
                  color: Colors.white,
                  child: Container(
                    width: MediaQuery.of(context).size.width - 40,
                    constraints: const BoxConstraints(maxHeight: 250),
                    child: ListView.builder(
                      padding: EdgeInsets.zero,
                      shrinkWrap: true,
                      itemCount: options.length,
                      itemBuilder: (context, index) {
                        final g = options.elementAt(index);
                        return ListTile(
                          leading: SizedBox(
                            width: 40, height: 40,
                            child: GymImage(
                              name: g.name,
                              src: g.coverImage,
                              radius: BorderRadius.circular(8),
                            ),
                          ),
                          title: Text(g.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                          subtitle: Text('${g.area}, ${g.city}'),
                          onTap: () => onSelected(g),
                        );
                      },
                    ),
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.06),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(4, (i) {
                final s = GymRepository.platformStats[i];
                return Column(
                  children: [
                    Icon(statsIcons[i], color: AppColors.brandCopper, size: 20),
                    const SizedBox(height: 6),
                    Text(s.$1,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 2),
                    Text(s.$2,
                        style: const TextStyle(
                            color: Colors.white70, fontSize: 11)),
                  ],
                );
              }),
            ),
          ),
        ],
      ),
    );
  }

  // ---- Featured rail ----
  static const double _railCardWidth = 290;
  static const double _railGap = 14;

  Widget _rail(String eyebrow, String title, List<GymSummary> gyms, SortKey sort) =>
      SliverToBoxAdapter(
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
                                color: AppColors.brandCopper,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.5)),
                        const SizedBox(height: 2),
                        Text(title,
                            style: const TextStyle(
                                fontSize: 22, fontWeight: FontWeight.w800)),
                      ],
                    ),
                  ),
                  TextButton(
                      onPressed: () => _toSearch(null, sort),
                      child: const Text('View all')),
                ]),
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 320,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  physics: const SnapScrollPhysics(
                      itemExtent: _railCardWidth + _railGap),
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: gyms.length,
                  separatorBuilder: (_, __) => const SizedBox(width: _railGap),
                  itemBuilder: (_, i) =>
                      SizedBox(width: _railCardWidth, child: GymCard(gyms[i])),
                ),
              ),
            ],
          ),
        ),
      );

  // ---- Why choose us ----
  Widget _whyChooseUs() {
    const items = [
      (
        Icons.my_location,
        'GPS-powered discovery',
        'Find gyms near home, work, or anywhere. Filter by distance, price, and amenities.'
      ),
      (
        Icons.star_outline,
        'Verified reviews & Gymma rating',
        'Verified reviews from real members on cleanliness, trainers, equipment, and value — plus a Gymma rating that aggregates quality into one trusted score.'
      ),
      (
        Icons.verified_user_outlined,
        'Transparent pricing',
        'See membership plans upfront. No hidden fees, no guesswork — just clear info.'
      ),
      (
        Icons.groups_outlined,
        'Detailed profiles',
        'Trainer backgrounds, equipment, gallery, class schedules, and FAQs in one place.'
      ),
      (
        Icons.compare_arrows,
        'Compare side by side',
        'Shortlist gyms and compare them on the parameters that matter before deciding.'
      ),
      (
        Icons.workspace_premium_outlined,
        'Curated lists',
        'Browse Top Rated, Trending, Nearby, and Affordable collections, updated regularly.'
      ),
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 36, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Why choose Gymma',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 16),
          ...items.asMap().entries.map((entry) {
            final it = entry.value;
            final accent = entry.key.isEven
                ? AppColors.brandCopper
                : AppColors.brandNavy;
            final tint = entry.key.isEven
                ? AppColors.primary50
                : AppColors.secondary50;
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: entry.key.isOdd ? AppColors.paperBackground : null,
                borderRadius: BorderRadius.circular(AppRadius.lg),
                border: Border.all(color: AppColors.neutral200),
              ),
              child: Row(children: [
                Container(
                  height: 44,
                  width: 44,
                  decoration: BoxDecoration(
                      color: tint,
                      borderRadius: BorderRadius.circular(AppRadius.md)),
                  child: Icon(it.$1, color: accent),
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
                              color: AppColors.neutral500,
                              fontSize: 13,
                              height: 1.4)),
                    ],
                  ),
                ),
              ]),
            );
          }),
        ],
      ),
    );
  }

  // ---- Owner CTA ----
  Widget _ownerCta() => Container(
        margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: AppGradients.brandGradient,
          borderRadius: BorderRadius.circular(AppRadius.xl),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Own a gym?',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            const Text(
                'List your gym on Gymma and reach thousands of members near you.',
                style: TextStyle(color: Colors.white, height: 1.5)),
            const SizedBox(height: 16),
            FilledButton(
              style: FilledButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.primary700,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.md))),
              onPressed: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const PartnerScreen())),
              child: const Text('Partner with us',
                  style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      );
}
