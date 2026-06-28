import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../data/api_client.dart';
import '../data/gym_repository.dart';
import '../models/gym.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../widgets/common.dart';

class GymDetailScreen extends StatefulWidget {
  final String slug;
  const GymDetailScreen({super.key, required this.slug});

  @override
  State<GymDetailScreen> createState() => _GymDetailScreenState();
}

class _GymDetailScreenState extends State<GymDetailScreen> {
  GymDetail? _detail;
  String? _error;

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
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'Something went wrong.');
    }
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
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final g = d.summary;
    final mapsUri = Uri.parse(
        'https://www.google.com/maps/search/?api=1&query=${g.lat},${g.lng}');
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
                GymImage(name: g.name, src: g.coverImage, aspectRatio: 16 / 9),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Colors.black26, Colors.transparent],
                      stops: [0, 0.4],
                    ),
                  ),
                ),
              ]),
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

                  // gallery
                  if (d.gallery.isNotEmpty)
                    _section('Gallery',
                        child: SizedBox(
                          height: 120,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            itemCount: d.gallery.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(width: 10),
                            itemBuilder: (_, i) {
                              final item = d.gallery[i];
                              final isUrl = item.startsWith('http');
                              return ClipRRect(
                                borderRadius:
                                    BorderRadius.circular(AppRadius.md),
                                child: SizedBox(
                                  width: 160,
                                  child: isUrl
                                      ? GymImage(
                                          name: g.name,
                                          src: item,
                                          aspectRatio: 4 / 3)
                                      : Container(
                                          color: AppColors.neutral100,
                                          alignment: Alignment.center,
                                          child: Text(item,
                                              style: const TextStyle(
                                                  color: AppColors.neutral500,
                                                  fontWeight: FontWeight.w600)),
                                        ),
                                ),
                              );
                            },
                          ),
                        )),

                  // trainers
                  _section('Trainers',
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

                  // reviews + scores
                  _section('Reviews',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _scoresCard(d.scores),
                          const SizedBox(height: 12),
                          ...d.reviews.take(6).map((r) => Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: AppColors.neutral50,
                                  borderRadius:
                                      BorderRadius.circular(AppRadius.md),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(children: [
                                      StarRating(r.rating, size: 14),
                                      const Spacer(),
                                      const Text('Verified Member',
                                          style: TextStyle(
                                              color: AppColors.neutral400,
                                              fontSize: 11)),
                                    ]),
                                    const SizedBox(height: 8),
                                    Text(r.body,
                                        style: const TextStyle(
                                            color: AppColors.neutral700,
                                            height: 1.5)),
                                  ],
                                ),
                              )),
                        ],
                      )),

                  // faqs
                  _section('FAQs',
                      child: Column(
                        children: d.faqs
                            .map((f) => Theme(
                                  data: Theme.of(context).copyWith(
                                      dividerColor: Colors.transparent),
                                  child: ExpansionTile(
                                    tilePadding: EdgeInsets.zero,
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
                                  ),
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
              child: FilledButton(
                style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary500,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.md))),
                onPressed: () => _openInquiry(d),
                child: const Text('Send inquiry',
                    style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _section(String title, {required Widget child}) => Padding(
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

  Widget _pill(String label) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.neutral100,
          borderRadius: BorderRadius.circular(AppRadius.full),
        ),
        child: Text(label,
            style: const TextStyle(fontSize: 12, color: AppColors.neutral700)),
      );

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
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary500,
                    padding: const EdgeInsets.symmetric(vertical: 15)),
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Text('Send inquiry',
                        style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
