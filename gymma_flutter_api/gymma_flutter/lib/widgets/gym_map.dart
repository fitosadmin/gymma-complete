import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/gym.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../screens/gym_detail_screen.dart';

/// OpenStreetMap-backed gym map (mirrors the web's Leaflet map).
class GymMap extends StatefulWidget {
  final List<GymSummary> gyms;
  const GymMap({super.key, required this.gyms});

  @override
  State<GymMap> createState() => _GymMapState();
}

class _GymMapState extends State<GymMap> {
  String? _selectedId;

  LatLng get _center {
    if (widget.gyms.isEmpty) return const LatLng(12.9716, 77.5946); // Bengaluru
    final lat = widget.gyms.map((g) => g.lat).reduce((a, b) => a + b) / widget.gyms.length;
    final lng = widget.gyms.map((g) => g.lng).reduce((a, b) => a + b) / widget.gyms.length;
    return LatLng(lat, lng);
  }

  @override
  Widget build(BuildContext context) {
    final selected = widget.gyms.where((g) => g.id == _selectedId).cast<GymSummary?>().firstOrNull;
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: Stack(
        children: [
          FlutterMap(
            options: MapOptions(initialCenter: _center, initialZoom: 12),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.gymma.app',
              ),
              MarkerLayer(
                markers: [
                  for (final g in widget.gyms)
                    Marker(
                      point: LatLng(g.lat, g.lng),
                      width: 40,
                      height: 40,
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedId = g.id),
                        child: Icon(
                          Icons.location_on,
                          size: g.id == _selectedId ? 40 : 32,
                          color: g.id == _selectedId ? AppColors.primary600 : AppColors.ink,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
          if (selected != null)
            Positioned(
              left: 12,
              right: 12,
              bottom: 12,
              child: _MapCard(
                gym: selected,
                onClose: () => setState(() => _selectedId = null),
              ),
            ),
        ],
      ),
    );
  }
}

extension _FirstOrNull<E> on Iterable<E> {
  E? get firstOrNull => isEmpty ? null : first;
}

class _MapCard extends StatelessWidget {
  final GymSummary gym;
  final VoidCallback onClose;
  const _MapCard({required this.gym, required this.onClose});

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 6,
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        onTap: () => Navigator.of(context)
            .push(MaterialPageRoute(builder: (_) => GymDetailScreen(slug: gym.slug))),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(gym.name,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                    const SizedBox(height: 4),
                    Text(
                      '★ ${gym.rating.toStringAsFixed(1)} · ${gym.area} · ${formatINR(gym.pricePerMonth)}/mo',
                      style: const TextStyle(color: AppColors.neutral500, fontSize: 13),
                    ),
                  ],
                ),
              ),
              IconButton(onPressed: onClose, icon: const Icon(Icons.close, size: 18)),
            ],
          ),
        ),
      ),
    );
  }
}
