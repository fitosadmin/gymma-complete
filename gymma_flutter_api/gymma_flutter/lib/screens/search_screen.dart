import 'package:flutter/material.dart';
import '../data/api_client.dart';
import '../data/gym_repository.dart';
import '../models/gym.dart';
import '../theme.dart';
import '../widgets/gym_card.dart';
import '../widgets/gym_map.dart';

enum _Status { open, closed }

class _PriceBand {
  final String value, label;
  final int min, max;
  const _PriceBand(this.value, this.label, this.min, this.max);
}

const _priceBands = [
  _PriceBand('budget', 'Budget (< ₹1,500)', 0, 1500),
  _PriceBand('mid', 'Mid-range (₹1,500–₹3,000)', 1500, 3000),
  _PriceBand('premium', 'Premium (₹3,000+)', 3000, 1 << 30),
];

const _distanceOptions = [
  (1, '< 1 km'),
  (3, '1–3 km'),
  (5, '3–5 km'),
  (10, '5–10 km'),
  (0, 'Any'),
];

class SearchScreen extends StatefulWidget {
  final String initialQuery;
  const SearchScreen({super.key, this.initialQuery = ''});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  late final TextEditingController _controller =
      TextEditingController(text: widget.initialQuery);
  String _applied = '';
  SortKey _sort = SortKey.relevance;
  bool _mapView = false;

  // filters
  _Status? _status;
  bool _womenOnly = false;
  int _distance = 0;
  String? _price;

  List<GymSummary> _all = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _applied = widget.initialQuery;
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final g = await GymRepository.instance.getGyms();
      if (mounted) {
        setState(() {
          _all = g;
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

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  List<GymSummary> get _filtered {
    final q = _applied.trim().toLowerCase();
    var list = _all.where((g) {
      if (q.isNotEmpty &&
          !('${g.name} ${g.area} ${g.city}'.toLowerCase().contains(q))) return false;
      if (_status == _Status.open && !g.isOpenNow) return false;
      if (_status == _Status.closed && g.isOpenNow) return false;
      if (_womenOnly && !g.womenFriendly) return false;
      if (_distance > 0 && (g.distanceKm ?? double.infinity) > _distance) return false;
      if (_price != null) {
        final band = _priceBands.firstWhere((b) => b.value == _price);
        if (g.pricePerMonth < band.min || g.pricePerMonth > band.max) return false;
      }
      return true;
    }).toList();
    return GymRepository.sortGyms(list, _sort);
  }

  int get _activeFilterCount =>
      (_status != null ? 1 : 0) +
      (_womenOnly ? 1 : 0) +
      (_distance > 0 ? 1 : 0) +
      (_price != null ? 1 : 0);

  void _openFilters() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.neutral0,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl))),
      builder: (_) => StatefulBuilder(
        builder: (context, setSheet) {
          void sync(VoidCallback fn) {
            setSheet(fn);
            setState(() {});
          }

          Widget chip(String label, bool active, VoidCallback onTap) => GestureDetector(
                onTap: onTap,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: active ? AppColors.ink : AppColors.neutral0,
                    borderRadius: BorderRadius.circular(AppRadius.full),
                    border: Border.all(color: active ? AppColors.ink : AppColors.neutral200),
                  ),
                  child: Text(label,
                      style: TextStyle(
                          color: active ? Colors.white : AppColors.neutral700,
                          fontWeight: FontWeight.w500,
                          fontSize: 14)),
                ),
              );

          return Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
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
                Row(children: [
                  const Text('Filters',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                  const Spacer(),
                  TextButton(
                    onPressed: () => sync(() {
                      _status = null;
                      _womenOnly = false;
                      _distance = 0;
                      _price = null;
                    }),
                    child: const Text('Clear all'),
                  ),
                ]),
                const SizedBox(height: 8),
                const Text('Status', style: _sectionStyle),
                const SizedBox(height: 10),
                Row(children: [
                  chip('Open', _status == _Status.open,
                      () => sync(() => _status = _status == _Status.open ? null : _Status.open)),
                  const SizedBox(width: 8),
                  chip('Closed', _status == _Status.closed,
                      () => sync(() => _status = _status == _Status.closed ? null : _Status.closed)),
                ]),
                const SizedBox(height: 20),
                const Text('Women Friendly', style: _sectionStyle),
                const SizedBox(height: 6),
                Row(children: [
                  const Expanded(child: Text('Only show women-friendly gyms',
                      style: TextStyle(color: AppColors.neutral600))),
                  Switch(
                    value: _womenOnly,
                    activeColor: AppColors.ink,
                    onChanged: (v) => sync(() => _womenOnly = v),
                  ),
                ]),
                const SizedBox(height: 16),
                const Text('Distance', style: _sectionStyle),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final d in _distanceOptions)
                      chip(d.$2, _distance == d.$1, () => sync(() => _distance = d.$1)),
                  ],
                ),
                const SizedBox(height: 20),
                const Text('Price Range', style: _sectionStyle),
                const SizedBox(height: 10),
                ..._priceBands.map((b) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: GestureDetector(
                        onTap: () =>
                            sync(() => _price = _price == b.value ? null : b.value),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          decoration: BoxDecoration(
                            color: _price == b.value ? AppColors.ink : AppColors.neutral0,
                            borderRadius: BorderRadius.circular(AppRadius.md),
                            border: Border.all(
                                color: _price == b.value ? AppColors.ink : AppColors.neutral200),
                          ),
                          child: Text(b.label,
                              style: TextStyle(
                                  color: _price == b.value ? Colors.white : AppColors.neutral700,
                                  fontWeight: FontWeight.w500)),
                        ),
                      ),
                    )),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                        backgroundColor: AppColors.ink,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AppRadius.md))),
                    onPressed: () => Navigator.pop(context),
                    child: Text('Show ${_filtered.length} gyms'),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _sortSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.neutral0,
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
                  child: Text('Sort by', style: _sectionStyle)),
            ),
            for (final o in const [
              (SortKey.relevance, 'Relevance'),
              (SortKey.distance, 'Distance'),
              (SortKey.rating, 'Rating'),
              (SortKey.priceAsc, 'Price: Low → High'),
            ])
              RadioListTile<SortKey>(
                value: o.$1,
                groupValue: _sort,
                activeColor: AppColors.ink,
                title: Text(o.$2),
                onChanged: (v) {
                  setState(() => _sort = v!);
                  Navigator.pop(context);
                },
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final results = _filtered;
    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        title: const Text('Discover', style: TextStyle(fontWeight: FontWeight.w700)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(64),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    textInputAction: TextInputAction.search,
                    onSubmitted: (v) => setState(() => _applied = v),
                    decoration: InputDecoration(
                      hintText: 'Search gyms…',
                      prefixIcon: const Icon(Icons.search, size: 20),
                      isDense: true,
                      filled: true,
                      fillColor: AppColors.neutral0,
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          borderSide: const BorderSide(color: AppColors.neutral200)),
                      enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          borderSide: const BorderSide(color: AppColors.neutral200)),
                      focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          borderSide: const BorderSide(color: AppColors.primary500)),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                _IconToggle(
                  icon: _mapView ? Icons.grid_view_rounded : Icons.map_outlined,
                  onTap: () => setState(() => _mapView = !_mapView),
                ),
              ],
            ),
          ),
        ),
      ),
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
              : Column(
              children: [
                // controls row
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                  child: Row(
                    children: [
                      Text.rich(TextSpan(children: [
                        TextSpan(
                            text: '${results.length} ',
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                        TextSpan(
                            text: 'gym${results.length == 1 ? '' : 's'} found',
                            style: const TextStyle(color: AppColors.neutral500, fontSize: 15)),
                      ])),
                      const Spacer(),
                      _PillButton(
                        icon: Icons.tune,
                        label: _activeFilterCount > 0 ? 'Filters ($_activeFilterCount)' : 'Filters',
                        active: _activeFilterCount > 0,
                        onTap: _openFilters,
                      ),
                      const SizedBox(width: 8),
                      _PillButton(icon: Icons.swap_vert, label: 'Sort', onTap: _sortSheet),
                    ],
                  ),
                ),
                Expanded(
                  child: _mapView
                      ? Padding(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                          child: GymMap(gyms: results),
                        )
                      : results.isEmpty
                          ? _empty()
                          : GridView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                              gridDelegate:
                                  const SliverGridDelegateWithMaxCrossAxisExtent(
                                maxCrossAxisExtent: 460,
                                mainAxisExtent: 320,
                                crossAxisSpacing: 14,
                                mainAxisSpacing: 14,
                              ),
                              itemCount: results.length,
                              itemBuilder: (_, i) => GymCard(results[i]),
                            ),
                ),
              ],
            ),
    );
  }

  Widget _empty() => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.search_off, size: 48, color: AppColors.neutral300),
              SizedBox(height: 12),
              Text('No gyms match your filters',
                  style: TextStyle(fontWeight: FontWeight.w700)),
              SizedBox(height: 4),
              Text('Try widening the distance or clearing the price range.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.neutral500)),
            ],
          ),
        ),
      );
}

const _sectionStyle = TextStyle(fontSize: 14, fontWeight: FontWeight.w700);

class _IconToggle extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _IconToggle({required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) => Material(
        color: AppColors.ink,
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.md),
          child: Padding(
            padding: const EdgeInsets.all(11),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
        ),
      );
}

class _PillButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _PillButton(
      {required this.icon, required this.label, this.active = false, required this.onTap});
  @override
  Widget build(BuildContext context) => Material(
        color: active ? AppColors.ink : AppColors.neutral0,
        borderRadius: BorderRadius.circular(AppRadius.full),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadius.full),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppRadius.full),
              border: Border.all(color: active ? AppColors.ink : AppColors.neutral200),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(icon, size: 16, color: active ? Colors.white : AppColors.neutral700),
              const SizedBox(width: 6),
              Text(label,
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: active ? Colors.white : AppColors.neutral700)),
            ]),
          ),
        ),
      );
}
