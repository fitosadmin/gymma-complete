import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../data/api_client.dart';
import '../data/auth_service.dart';
import '../data/gym_repository.dart';
import '../data/reviews_repository.dart';
import '../models/gym.dart';
import '../models/gymma_review.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../widgets/common.dart';
import '../widgets/branded_expansion_tile.dart';
import '../widgets/gradient_button.dart';
import '../widgets/shimmer.dart';
import 'gym_review_poll_screen.dart';

class GymDetailScreen extends StatefulWidget {
  final String slug;
  const GymDetailScreen({super.key, required this.slug});

  @override
  State<GymDetailScreen> createState() => _GymDetailScreenState();
}

class _GymDetailScreenState extends State<GymDetailScreen> {
  GymDetail? _detail;
  String? _error;

  // Gymma Score — the new community rating system. Loaded separately from
  // the rest of the page (and never blocks it) since it hits a second,
  // not-yet-deployed backend. Additive only: nothing here touches the
  // existing "Reviews" section above, which still reads the old data.
  GymmaScore? _gymmaScore;
  List<DimensionBreakdownEntry> _gymmaBreakdown = [];
  bool _gymmaLoading = true;

  // Stable across rebuilds so Scrollable.ensureVisible always has a live
  // context to target — the section-jump nav pill bar taps into these.
  final Map<String, GlobalKey> _sectionKeys = {
    'about': GlobalKey(),
    'trainers': GlobalKey(),
    'plans': GlobalKey(),
    'facilities': GlobalKey(),
    'classes': GlobalKey(),
    'gymmaScore': GlobalKey(),
    'reviews': GlobalKey(),
    'faqs': GlobalKey(),
  };

  void _scrollToSection(String key) {
    final ctx = _sectionKeys[key]?.currentContext;
    if (ctx == null) return;
    Scrollable.ensureVisible(
      ctx,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOut,
      alignment: 0.05,
    );
  }

  String _relativeDate(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inDays < 1) return 'Today';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 30) return '${diff.inDays}d ago';
    if (diff.inDays < 365) return '${(diff.inDays / 30).floor()}mo ago';
    return '${(diff.inDays / 365).floor()}y ago';
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final d = await GymRepository.instance.getGymDetail(widget.slug);
      if (mounted) setState(() => _detail = d);
      _loadGymmaScore(d.summary.id);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'Something went wrong.');
    }
  }

  /// Loaded independently of the rest of the page — if gymma-reviews-api is
  /// unreachable (it isn't deployed yet), this section just falls back to
  /// its empty state instead of breaking the whole gym detail screen.
  Future<void> _loadGymmaScore(String gymId) async {
    setState(() => _gymmaLoading = true);
    try {
      final results = await Future.wait([
        ReviewsRepository.instance.getGymScore(gymId),
        ReviewsRepository.instance.getDimensionBreakdown(gymId),
      ]);
      if (mounted) {
        setState(() {
          _gymmaScore = results[0] as GymmaScore?;
          _gymmaBreakdown = results[1] as List<DimensionBreakdownEntry>;
          _gymmaLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _gymmaLoading = false);
    }
  }

  Future<void> _openRatePoll() async {
    final d = _detail;
    if (d == null) return;
    final result = await Navigator.of(context).push<bool>(MaterialPageRoute(
      builder: (_) => GymReviewPollScreen(gymId: d.summary.id, gymName: d.summary.name),
    ));
    if (result == true) _loadGymmaScore(d.summary.id);
  }

  Future<void> _launch(Uri uri) async {
    try {
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open that link')));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open that link')));
      }
    }
  }

  String _initials(String name) => name
      .trim()
      .split(RegExp(r'\s+'))
      .take(2)
      .map((p) => p.isEmpty ? '' : p[0])
      .join()
      .toUpperCase();

  Future<void> _openInquiry(GymDetail d) async {
    final sent = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.neutral0,
      shape: const RoundedRectangleBorder(
          borderRadius:
              BorderRadius.vertical(top: Radius.circular(AppRadius.xl))),
      builder: (_) =>
          _InquirySheet(gymId: d.summary.id, gymName: d.summary.name),
    );
    if (sent == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Inquiry sent — the gym will reach out soon.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final d = _detail;
    if (d == null) {
      if (_error != null) {
        return Scaffold(
          appBar: AppBar(),
          body: Center(
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
                  FilledButton(onPressed: _load, child: const Text('Retry')),
                ],
              ),
            ),
          ),
        );
      }
      return Scaffold(body: _shimmerLoading());
    }
    final g = d.summary;
    final mapsUri = Uri.parse(
        'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent('${g.name} ${g.area} ${g.city}')}');
    final waUri =
        Uri.parse('https://wa.me/${d.whatsapp.replaceAll(RegExp(r'\D'), '')}');
    final telUri = Uri.parse('tel:${d.phone}');

    final chips = <Widget>[
      if (g.isOpenNow)
        const GymBadge('Open Now', variant: BadgeVariant.success),
      if (g.womenFriendly)
        const GymBadge('Women Friendly', variant: BadgeVariant.secondary),
      if (g.hasParking) const GymBadge('Parking'),
      if (g.amenities.contains('AC')) const GymBadge('AC'),
    ];

    final navSections = <(String, String)>[
      ('about', 'About'),
      if (d.trainers.isNotEmpty) ('trainers', 'Trainers'),
      ('plans', 'Plans'),
      if (g.amenities.isNotEmpty) ('facilities', 'Facilities'),
      if (d.classes.isNotEmpty) ('classes', 'Classes'),
      ('gymmaScore', 'Gymma Score'),
      ('reviews', 'Reviews'),
      if (d.faqs.isNotEmpty) ('faqs', 'FAQs'),
    ];

    return Scaffold(
      backgroundColor: AppColors.neutral0,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 220,
            backgroundColor: AppColors.neutral0,
            foregroundColor: Colors.white,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(fit: StackFit.expand, children: [
                _Slideshow(
                  gymName: g.name,
                  images: [if (g.coverImage != null) g.coverImage!, ...d.gallery],
                ),
                const IgnorePointer(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.black26, Colors.transparent],
                        stops: [0, 0.4],
                      ),
                    ),
                  ),
                ),
              ]),
            ),
          ),
          SliverPersistentHeader(
            pinned: true,
            delegate: _SectionNavDelegate(
              sections: navSections,
              onTap: _scrollToSection,
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 120),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // identity
                  Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
                    Container(
                      height: 56,
                      width: 56,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(colors: [
                          AppColors.primary500,
                          AppColors.primary600
                        ]),
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                      ),
                      alignment: Alignment.center,
                      child: Text(_initials(g.name),
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 18)),
                    ),
                    const Spacer(),
                    Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(formatINR(g.pricePerMonth),
                              style: const TextStyle(
                                  fontSize: 22, fontWeight: FontWeight.w800)),
                          const Text('per month',
                              style: TextStyle(
                                  color: AppColors.neutral500, fontSize: 12)),
                        ]),
                  ]),
                  const SizedBox(height: 14),
                  Text(g.name,
                      style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          height: 1.2)),
                  const SizedBox(height: 8),
                  Wrap(
                      spacing: 16,
                      runSpacing: 6,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        Row(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.star_rounded,
                              size: 18, color: AppColors.rating),
                          const SizedBox(width: 3),
                          Text(g.rating.toStringAsFixed(1),
                              style:
                                  const TextStyle(fontWeight: FontWeight.w700)),
                          Text(' (${g.reviewCount})',
                              style:
                                  const TextStyle(color: AppColors.neutral500)),
                        ]),
                        GestureDetector(
                          onTap: () => _launch(mapsUri),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [
                            const Icon(Icons.location_on_outlined,
                                size: 16, color: AppColors.neutral500),
                            const SizedBox(width: 3),
                            Text('${g.area}, ${g.city}',
                                style: const TextStyle(
                                    color: AppColors.neutral600)),
                          ]),
                        ),
                      ]),
                  if (chips.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Wrap(spacing: 8, runSpacing: 8, children: chips),
                  ],
                  const Divider(height: 40),

                  // about
                  _section('About',
                      sectionKey: _sectionKeys['about'],
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(d.description,
                              style: const TextStyle(
                                  color: AppColors.neutral700, height: 1.6)),
                          const SizedBox(height: 14),
                          Wrap(spacing: 8, runSpacing: 8, children: [
                            _pill('${d.yearsOperating} yrs operating'),
                            ...d.certifications.map(_pill),
                          ]),
                        ],
                      )),

                  // trainers
                  _section('Trainers',
                      sectionKey: _sectionKeys['trainers'],
                      child: Column(
                        children: d.trainers
                            .map((t) => Container(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    borderRadius:
                                        BorderRadius.circular(AppRadius.md),
                                    border:
                                        Border.all(color: AppColors.neutral200),
                                  ),
                                  child: Row(children: [
                                    CircleAvatar(
                                      radius: 22,
                                      backgroundColor: AppColors.primary50,
                                      child: Text(_initials(t.name),
                                          style: const TextStyle(
                                              color: AppColors.primary700,
                                              fontWeight: FontWeight.w700)),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(t.name,
                                              style: const TextStyle(
                                                  fontWeight: FontWeight.w700)),
                                          Text(t.specialization,
                                              style: const TextStyle(
                                                  color: AppColors.neutral500,
                                                  fontSize: 13)),
                                          const SizedBox(height: 2),
                                          Text(
                                              '${t.yearsExperience} yrs · ${t.languages.join(", ")}',
                                              style: const TextStyle(
                                                  color: AppColors.neutral400,
                                                  fontSize: 12)),
                                        ],
                                      ),
                                    ),
                                    Text(
                                        '${formatINR(t.pricePerSession)}/session',
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 12)),
                                  ]),
                                ))
                            .toList(),
                      )),

                  // plans
                  _section('Membership Plans',
                      sectionKey: _sectionKeys['plans'],
                      child: Column(
                        children: d.plans
                            .map((p) => Container(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    borderRadius:
                                        BorderRadius.circular(AppRadius.md),
                                    border: Border.all(
                                        color: p.recommended
                                            ? AppColors.primary500
                                            : AppColors.neutral200,
                                        width: p.recommended ? 1.6 : 1),
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Row(children: [
                                        Text(p.name,
                                            style: const TextStyle(
                                                fontWeight: FontWeight.w700,
                                                fontSize: 16)),
                                        if (p.recommended) ...[
                                          const SizedBox(width: 8),
                                          const GymBadge('Best value',
                                              variant: BadgeVariant.secondary),
                                        ],
                                        const Spacer(),
                                        Text(formatINR(p.price),
                                            style: const TextStyle(
                                                fontWeight: FontWeight.w800,
                                                fontSize: 16)),
                                      ]),
                                      const SizedBox(height: 8),
                                      ...p.benefits.map((b) => Padding(
                                            padding:
                                                const EdgeInsets.only(top: 4),
                                            child: Row(children: [
                                              const Icon(Icons.check,
                                                  size: 16,
                                                  color:
                                                      AppColors.secondary500),
                                              const SizedBox(width: 6),
                                              Expanded(
                                                  child: Text(b,
                                                      style: const TextStyle(
                                                          color: AppColors
                                                              .neutral600,
                                                          fontSize: 13))),
                                            ]),
                                          )),
                                    ],
                                  ),
                                ))
                            .toList(),
                      )),

                  // facilities
                  _section('Facilities',
                      sectionKey: _sectionKeys['facilities'],
                      child: Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: g.amenities
                            .map((a) => Container(
                                  width: 96,
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 14),
                                  decoration: BoxDecoration(
                                    borderRadius:
                                        BorderRadius.circular(AppRadius.md),
                                    border:
                                        Border.all(color: AppColors.neutral200),
                                  ),
                                  child: Column(children: [
                                    Icon(amenityIcon(a),
                                        color: AppColors.neutral700),
                                    const SizedBox(height: 6),
                                    Text(a,
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(fontSize: 11)),
                                  ]),
                                ))
                            .toList(),
                      )),

                  // classes
                  _section('Classes',
                      sectionKey: _sectionKeys['classes'],
                      child: Column(
                        children: d.classes
                            .map((c) => ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  leading: const Icon(
                                      Icons.event_available_outlined),
                                  title: Text(c.name,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600)),
                                  subtitle: Text(
                                      '${c.schedule} · ${c.durationMin} min'),
                                  trailing: Text(c.trainerName,
                                      style: const TextStyle(
                                          color: AppColors.neutral500,
                                          fontSize: 12)),
                                ))
                            .toList(),
                      )),

                  // Gymma Score — new community rating system, additive to
                  // (not a replacement for) the "Reviews" section below.
                  _section('Gymma Score',
                      sectionKey: _sectionKeys['gymmaScore'],
                      child: _gymmaScoreSection()),

                  // reviews + scores
                  _section('Reviews',
                      sectionKey: _sectionKeys['reviews'],
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _scoresCard(d.scores),
                          const SizedBox(height: 12),
                          ...d.reviews.take(6).map((r) => _reviewCard(r)),
                          if (d.reviews.length > 6) ...[
                            const SizedBox(height: 4),
                            Center(
                              child: TextButton(
                                onPressed: () => _openAllReviews(d.reviews),
                                child: Text('See all ${d.reviews.length} reviews'),
                              ),
                            ),
                          ],
                        ],
                      )),

                  // faqs
                  _section('FAQs',
                      sectionKey: _sectionKeys['faqs'],
                      child: Column(
                        children: d.faqs
                            .map((f) => BrandedExpansionTile(
                                  title: Text(f.question,
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 15)),
                                  childrenPadding:
                                      const EdgeInsets.only(bottom: 12),
                                  children: [
                                    Align(
                                      alignment: Alignment.centerLeft,
                                      child: Text(f.answer,
                                          style: const TextStyle(
                                              color: AppColors.neutral600,
                                              height: 1.5)),
                                    ),
                                  ],
                                ))
                            .toList(),
                      )),
                ],
              ),
            ),
          ),
        ],
      ),
      // bottom action bar
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
          decoration: const BoxDecoration(
            color: AppColors.neutral0,
            border: Border(top: BorderSide(color: AppColors.neutral200)),
          ),
          child: Row(children: [
            _circleAction(Icons.call, AppColors.ink, () => _launch(telUri)),
            const SizedBox(width: 8),
            _circleAction(Icons.chat, AppColors.green, () => _launch(waUri)),
            const SizedBox(width: 8),
            _circleAction(
                Icons.directions, AppColors.neutral700, () => _launch(mapsUri)),
            const SizedBox(width: 10),
            Expanded(
              child: GradientButton(
                label: 'Send inquiry',
                height: 48,
                onPressed: () => _openInquiry(d),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _shimmerLoading() => ListView(
        padding: EdgeInsets.zero,
        physics: const NeverScrollableScrollPhysics(),
        children: [
          const ShimmerBox(width: double.infinity, height: 220, borderRadius: BorderRadius.zero),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  ShimmerBox(width: 56, height: 56, borderRadius: BorderRadius.circular(AppRadius.lg)),
                  const Spacer(),
                  ShimmerBox(width: 70, height: 22, borderRadius: BorderRadius.circular(6)),
                ]),
                const SizedBox(height: 16),
                const ShimmerBox(width: 220, height: 24),
                const SizedBox(height: 10),
                const ShimmerBox(width: 160, height: 14),
                const SizedBox(height: 24),
                const ShimmerBox(width: double.infinity, height: 80),
                const SizedBox(height: 24),
                const ShimmerBox(width: 120, height: 18),
                const SizedBox(height: 12),
                const ShimmerBox(width: double.infinity, height: 70, borderRadius: BorderRadius.all(Radius.circular(12))),
                const SizedBox(height: 10),
                const ShimmerBox(width: double.infinity, height: 70, borderRadius: BorderRadius.all(Radius.circular(12))),
              ],
            ),
          ),
        ],
      );

  Widget _section(String title, {required Widget child, Key? sectionKey}) => Padding(
        key: sectionKey,
        padding: const EdgeInsets.only(top: 8, bottom: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
                style:
                    const TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
            const SizedBox(height: 14),
            child,
            const Divider(height: 36),
          ],
        ),
      );

  Widget _reviewCard(Review r) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.neutral50,
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              StarRating(r.rating, size: 14),
              const Spacer(),
              Text('Verified Member · ${_relativeDate(r.createdAt)}',
                  style: const TextStyle(
                      color: AppColors.neutral400, fontSize: 11)),
            ]),
            const SizedBox(height: 8),
            Text(r.body,
                style: const TextStyle(color: AppColors.neutral700, height: 1.5)),
          ],
        ),
      );

  void _openAllReviews(List<Review> reviews) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.neutral0,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl))),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => Column(
          children: [
            const SizedBox(height: 12),
            Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                    color: AppColors.neutral300,
                    borderRadius: BorderRadius.circular(2))),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text('All ${reviews.length} reviews',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
              ),
            ),
            Expanded(
              child: ListView.builder(
                controller: scrollController,
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                itemCount: reviews.length,
                itemBuilder: (_, i) => _reviewCard(reviews[i]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _pill(String label) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.neutral100,
          borderRadius: BorderRadius.circular(AppRadius.full),
        ),
        child: Text(label,
            style: const TextStyle(fontSize: 12, color: AppColors.neutral700)),
      );

  // ── Gymma Score section ──────────────────────────────────────────────
  // Kept visually and structurally separate from _scoresCard (old, fake
  // data) below — different container, different accent, own empty state.

  Widget _gymmaScoreSection() {
    final score = _gymmaScore;
    final hasRatings = score != null && score.reviewCount > 0;
    final isMember = AuthService.instance.isAuthenticated;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_gymmaLoading)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          )
        else if (hasRatings)
          _gymmaScoreCard(score)
        else
          _gymmaEmptyState(),
        const SizedBox(height: 14),
        if (isMember)
          SizedBox(
            width: double.infinity,
            child: CopperOutlineButton(
              label: hasRatings ? 'Rate this gym' : 'Be the first to rate this gym',
              icon: Icons.star_outline_rounded,
              onPressed: _openRatePoll,
            ),
          )
        else
          const Text('Sign in as a member to rate this gym.',
              style: TextStyle(color: AppColors.neutral500, fontSize: 12.5)),
      ],
    );
  }

  Widget _gymmaScoreCard(GymmaScore score) {
    final tierLabel = gymmaTierLabels[score.tier] ?? score.tier;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: AppGradients.brandGradient,
        borderRadius: BorderRadius.circular(AppRadius.lg),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(score.bayesianScore.round().toString(),
                  style: const TextStyle(
                      color: Colors.white, fontSize: 34, fontWeight: FontWeight.w800, height: 1)),
              const Padding(
                padding: EdgeInsets.only(bottom: 4, left: 4),
                child: Text('/100', style: TextStyle(color: Colors.white70, fontSize: 13)),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: Text(tierLabel,
                    style: const TextStyle(
                        color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text('${score.reviewCount} rating${score.reviewCount == 1 ? '' : 's'}',
              style: const TextStyle(color: Colors.white70, fontSize: 12)),
          if (_gymmaBreakdown.isNotEmpty) ...[
            const SizedBox(height: 18),
            for (final entry in _gymmaBreakdown) _gymmaDimensionBar(entry),
          ],
        ],
      ),
    );
  }

  Widget _gymmaDimensionBar(DimensionBreakdownEntry d) {
    final label = gymmaDimensionLabels[d.dimension] ?? d.dimension;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(children: [
        SizedBox(
            width: 90,
            child: Text(label,
                style: const TextStyle(color: Colors.white70, fontSize: 12))),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.full),
            child: LinearProgressIndicator(
              value: (d.score / 100).clamp(0.0, 1.0),
              minHeight: 6,
              backgroundColor: Colors.white.withOpacity(0.15),
              color: Colors.white,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Text(d.score.round().toString(),
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
      ]),
    );
  }

  Widget _gymmaEmptyState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.paperBackground,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.neutral200),
      ),
      child: const Column(
        children: [
          Icon(Icons.insights_outlined, size: 32, color: AppColors.neutral400),
          SizedBox(height: 10),
          Text('Not enough ratings yet',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          SizedBox(height: 4),
          Text('Be the first member to rate this gym.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.neutral500, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _scoresCard(CategoryScores s) {
    final rows = [
      ('Cleanliness', s.cleanliness),
      ('Equipment', s.equipment),
      ('Trainers', s.trainers),
      ('Value', s.value),
      ('Crowd', s.crowd),
    ];
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: AppColors.neutral200),
      ),
      child: Column(
        children: rows
            .map((r) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: Row(children: [
                    SizedBox(
                        width: 92,
                        child: Text(r.$1,
                            style: const TextStyle(
                                fontSize: 13, color: AppColors.neutral600))),
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(AppRadius.full),
                        child: LinearProgressIndicator(
                          value: r.$2 / 5,
                          minHeight: 7,
                          backgroundColor: AppColors.neutral100,
                          color: AppColors.primary500,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(r.$2.toStringAsFixed(1),
                        style: const TextStyle(
                            fontWeight: FontWeight.w700, fontSize: 13)),
                  ]),
                ))
            .toList(),
      ),
    );
  }

  Widget _circleAction(IconData icon, Color color, VoidCallback onTap) =>
      Material(
        color: color.withOpacity(0.08),
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Icon(icon, color: color, size: 22),
          ),
        ),
      );
}

/// Inquiry form → POST /inquiries. Returns true via Navigator.pop on success.
class _InquirySheet extends StatefulWidget {
  final String gymId;
  final String gymName;
  const _InquirySheet({required this.gymId, required this.gymName});
  @override
  State<_InquirySheet> createState() => _InquirySheetState();
}

class _InquirySheetState extends State<_InquirySheet> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _message = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    _message.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await GymRepository.instance.createInquiry(
        gymId: widget.gymId,
        name: _name.text.trim(),
        phone: _phone.text.trim(),
        message: _message.text,
      );
      if (mounted) Navigator.pop(context, true);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'Could not send. Please try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 20,
          right: 20,
          top: 16),
      child: Form(
        key: _form,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                      color: AppColors.neutral300,
                      borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: 16),
            const Text('Send an inquiry',
                style:
                    TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 4),
            Text(widget.gymName,
                style: const TextStyle(color: AppColors.neutral500)),
            const SizedBox(height: 16),
            TextFormField(
              controller: _name,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(labelText: 'Your name'),
              validator: (v) =>
                  (v == null || v.trim().length < 2) ? 'Enter your name' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(labelText: 'Phone number'),
              validator: (v) =>
                  (v == null || !RegExp(r'^[6-9]\d{9}$').hasMatch(v.trim()))
                      ? 'Enter a valid 10-digit mobile number'
                      : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _message,
              maxLines: 3,
              decoration: const InputDecoration(
                  labelText: 'Message (optional)', alignLabelWithHint: true),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 16),
            GradientButton(
              label: 'Send inquiry',
              isLoading: _submitting,
              onPressed: _submitting ? null : _submit,
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _Slideshow extends StatefulWidget {
  final List<String> images;
  final String gymName;
  const _Slideshow({required this.images, required this.gymName});

  @override
  State<_Slideshow> createState() => _SlideshowState();
}

class _SlideshowState extends State<_Slideshow> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    if (widget.images.isEmpty) {
      return GymImage(name: widget.gymName, src: null, aspectRatio: 16 / 9);
    }
    return Stack(
      fit: StackFit.expand,
      children: [
        PageView.builder(
          itemCount: widget.images.length,
          onPageChanged: (i) => setState(() => _currentIndex = i),
          itemBuilder: (_, i) => GymImage(
            name: widget.gymName,
            src: widget.images[i],
            aspectRatio: 16 / 9,
          ),
        ),
        if (widget.images.length > 1)
          Positioned(
            bottom: 30, // Above the gradient/border
            left: 0,
            right: 0,
            child: IgnorePointer(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  widget.images.length,
                  (i) => Container(
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: _currentIndex == i ? 18 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: _currentIndex == i ? AppColors.primary500 : Colors.white54,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

/// Pinned pill row that jumps to a section (About/Trainers/Plans/…) instead
/// of leaving a nine-section page as one long, unnavigable scroll.
class _SectionNavDelegate extends SliverPersistentHeaderDelegate {
  final List<(String, String)> sections;
  final ValueChanged<String> onTap;
  const _SectionNavDelegate({required this.sections, required this.onTap});

  @override
  double get minExtent => 52;
  @override
  double get maxExtent => 52;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      height: maxExtent,
      decoration: BoxDecoration(
        color: AppColors.neutral0,
        border: Border(
            bottom: BorderSide(
                color: AppColors.divider,
                width: overlapsContent ? 1 : 0)),
      ),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        itemCount: sections.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final s = sections[i];
          return Material(
            color: AppColors.paperBackground,
            borderRadius: BorderRadius.circular(AppRadius.full),
            child: InkWell(
              borderRadius: BorderRadius.circular(AppRadius.full),
              onTap: () => onTap(s.$1),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                child: Text(s.$2,
                    style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppColors.neutral700)),
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  bool shouldRebuild(covariant _SectionNavDelegate oldDelegate) =>
      sections != oldDelegate.sections;
}
