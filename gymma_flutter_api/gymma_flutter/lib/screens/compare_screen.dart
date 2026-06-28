import 'package:flutter/material.dart';
import '../data/api_client.dart';
import '../data/gym_repository.dart';
import '../models/gym.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../widgets/common.dart';

class CompareScreen extends StatefulWidget {
  const CompareScreen({super.key});
  @override
  State<CompareScreen> createState() => _CompareScreenState();
}

class _CompareScreenState extends State<CompareScreen> {
  List<GymSummary> _all = [];
  final List<GymDetail> _selected = [];
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
      final list = await GymRepository.instance.getGyms();
      if (mounted) {
        setState(() {
          _all = list;
          _loading = false;
        });
      }
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message;
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'Could not load gyms.';
          _loading = false;
        });
      }
    }
  }

  void _pick() async {
    final selectedSlugs = _selected.map((d) => d.summary.slug).toSet();
    final picked = await showModalBottomSheet<GymSummary>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.neutral0,
      shape: const RoundedRectangleBorder(
          borderRadius:
              BorderRadius.vertical(top: Radius.circular(AppRadius.xl))),
      builder: (_) => _GymPicker(
        gyms: _all.where((g) => !selectedSlugs.contains(g.slug)).toList(),
      ),
    );
    if (picked == null) return;
    // Fetch full detail (scores, etc.) for the chosen gym.
    try {
      final detail = await GymRepository.instance.getGymDetail(picked.slug);
      if (mounted) setState(() => _selected.add(detail));
    } on ApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(e.message)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutral0,
      appBar: AppBar(
        title: const Text('Compare gyms',
            style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _errorView()
              : _selected.isEmpty
                  ? _empty()
                  : SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: _table(),
                    ),
      floatingActionButton: _selected.length < 3
          ? FloatingActionButton.extended(
              backgroundColor: AppColors.ink,
              onPressed: _pick,
              icon: const Icon(Icons.add),
              label: const Text('Add gym'),
            )
          : null,
    );
  }

  Widget _errorView() => Center(
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
      );

  Widget _empty() => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.compare_arrows,
                  size: 48, color: AppColors.neutral300),
              const SizedBox(height: 12),
              const Text('Compare up to 3 gyms',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              const SizedBox(height: 4),
              const Text(
                  'Put gyms side by side on price, rating, amenities and category scores.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.neutral500)),
              const SizedBox(height: 20),
              FilledButton.icon(
                style: FilledButton.styleFrom(backgroundColor: AppColors.ink),
                onPressed: _pick,
                icon: const Icon(Icons.add),
                label: const Text('Add a gym'),
              ),
            ],
          ),
        ),
      );

  Widget _table() {
    final bestPrice = _selected
        .map((g) => g.summary.pricePerMonth)
        .reduce((a, b) => a < b ? a : b);
    final bestRating =
        _selected.map((g) => g.summary.rating).reduce((a, b) => a > b ? a : b);
    const colW = 200.0;

    Widget headerCell(GymDetail d) => SizedBox(
          width: colW,
          child: Padding(
            padding: const EdgeInsets.all(10),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(
                  child: Text(d.summary.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
                IconButton(
                  visualDensity: VisualDensity.compact,
                  icon: const Icon(Icons.close, size: 18),
                  onPressed: () => setState(() => _selected.remove(d)),
                ),
              ]),
              Text(d.summary.area,
                  style: const TextStyle(
                      color: AppColors.neutral500, fontSize: 12)),
            ]),
          ),
        );

    Widget row(String label, List<Widget> cells, {bool shade = false}) =>
        Container(
          color: shade ? AppColors.neutral50 : null,
          child: Row(children: [
            SizedBox(
              width: 120,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Text(label,
                    style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.neutral500)),
              ),
            ),
            ...cells,
          ]),
        );

    Widget cell(Widget child, {bool highlight = false}) => Container(
          width: colW,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
          color: highlight ? AppColors.secondary50 : null,
          child: child,
        );

    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const SizedBox(width: 120),
            ..._selected.map(headerCell)
          ]),
          const Divider(height: 1),
          row('Price/mo', [
            for (final d in _selected)
              cell(
                Text(formatINR(d.summary.pricePerMonth),
                    style: TextStyle(
                        fontWeight: FontWeight.w800,
                        color: d.summary.pricePerMonth == bestPrice
                            ? AppColors.secondary700
                            : AppColors.neutral900)),
                highlight: d.summary.pricePerMonth == bestPrice,
              ),
          ]),
          row(
              'Rating',
              [
                for (final d in _selected)
                  cell(
                    Row(children: [
                      StarRating(d.summary.rating, size: 14),
                      const SizedBox(width: 4),
                      Text('(${d.summary.reviewCount})',
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.neutral500)),
                    ]),
                    highlight: d.summary.rating == bestRating,
                  ),
              ],
              shade: true),
          row('Open now', [
            for (final d in _selected)
              cell(Icon(d.summary.isOpenNow ? Icons.check_circle : Icons.cancel,
                  size: 18,
                  color: d.summary.isOpenNow
                      ? AppColors.secondary500
                      : AppColors.neutral300)),
          ]),
          row(
              'Women friendly',
              [
                for (final d in _selected)
                  cell(Icon(
                      d.summary.womenFriendly
                          ? Icons.check_circle
                          : Icons.remove,
                      size: 18,
                      color: d.summary.womenFriendly
                          ? AppColors.secondary500
                          : AppColors.neutral300)),
              ],
              shade: true),
          row('Parking', [
            for (final d in _selected)
              cell(Icon(
                  d.summary.hasParking ? Icons.check_circle : Icons.remove,
                  size: 18,
                  color: d.summary.hasParking
                      ? AppColors.secondary500
                      : AppColors.neutral300)),
          ]),
          for (final score in const [
            'cleanliness',
            'equipment',
            'trainers',
            'value',
            'crowd'
          ])
            row(
                _scoreLabel(score),
                [
                  for (final d in _selected)
                    cell(Text(_scoreVal(d, score).toStringAsFixed(1))),
                ],
                shade: ['equipment', 'value'].contains(score)),
          row(
              'Amenities',
              [
                for (final d in _selected)
                  cell(Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: d.summary.amenities
                        .map((a) => Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                  color: AppColors.neutral100,
                                  borderRadius:
                                      BorderRadius.circular(AppRadius.full)),
                              child:
                                  Text(a, style: const TextStyle(fontSize: 10)),
                            ))
                        .toList(),
                  )),
              ],
              shade: true),
        ],
      ),
    );
  }

  String _scoreLabel(String k) => '${k[0].toUpperCase()}${k.substring(1)}';
  double _scoreVal(GymDetail d, String k) {
    switch (k) {
      case 'cleanliness':
        return d.scores.cleanliness;
      case 'equipment':
        return d.scores.equipment;
      case 'trainers':
        return d.scores.trainers;
      case 'value':
        return d.scores.value;
      default:
        return d.scores.crowd;
    }
  }
}

class _GymPicker extends StatefulWidget {
  final List<GymSummary> gyms;
  const _GymPicker({required this.gyms});
  @override
  State<_GymPicker> createState() => _GymPickerState();
}

class _GymPickerState extends State<_GymPicker> {
  String _q = '';
  @override
  Widget build(BuildContext context) {
    final results = widget.gyms
        .where((g) =>
            '${g.name} ${g.area}'.toLowerCase().contains(_q.toLowerCase()))
        .toList();
    return Padding(
      padding:
          EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.7,
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                    color: AppColors.neutral300,
                    borderRadius: BorderRadius.circular(2))),
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                autofocus: true,
                onChanged: (v) => setState(() => _q = v),
                decoration: InputDecoration(
                  hintText: 'Search a gym to add…',
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppRadius.md)),
                ),
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: results.length,
                itemBuilder: (_, i) {
                  final g = results[i];
                  return ListTile(
                    title: Text(g.name),
                    subtitle: Text(
                        '${g.area} · ★ ${g.rating.toStringAsFixed(1)} · ${formatINR(g.pricePerMonth)}/mo'),
                    onTap: () => Navigator.pop(context, g),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
