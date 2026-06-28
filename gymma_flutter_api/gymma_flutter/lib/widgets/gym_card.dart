import 'package:flutter/material.dart';
import '../models/gym.dart';
import '../theme.dart';
import '../utils/format.dart';
import '../screens/gym_detail_screen.dart';
import 'common.dart';

class GymCard extends StatelessWidget {
  final GymSummary gym;
  final bool compact;
  const GymCard(this.gym, {super.key, this.compact = false});

  void _open(BuildContext context) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => GymDetailScreen(slug: gym.slug),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final dist = formatDistance(gym.distanceKm);
    return Material(
      color: AppColors.neutral0,
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: InkWell(
        onTap: () => _open(context),
        borderRadius: BorderRadius.circular(AppRadius.lg),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppRadius.lg),
            border: Border.all(color: AppColors.neutral200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // ---- Cover ----
              Stack(
                children: [
                  GymImage(
                    name: gym.name,
                    src: gym.coverImage,
                    height: 148,
                    radius: const BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
                  ),
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Row(children: [
                      if (gym.isOpenNow) const GymBadge('Open', variant: BadgeVariant.success),
                      if (gym.isPremium) ...[
                        const SizedBox(width: 6),
                        const GymBadge('Premium', variant: BadgeVariant.secondary),
                      ],
                    ]),
                  ),
                ],
              ),
              // ---- Body ----
              Expanded(
                child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(gym.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.w700, height: 1.2)),
                        ),
                        const SizedBox(width: 8),
                        Icon(Icons.star_rounded, size: 16, color: AppColors.rating),
                        const SizedBox(width: 2),
                        Text(gym.rating.toStringAsFixed(1),
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                        Text(' (${gym.reviewCount})',
                            style: const TextStyle(color: AppColors.neutral500, fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(children: [
                      const Icon(Icons.location_on_outlined, size: 14, color: AppColors.neutral400),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          dist == null ? '${gym.area}, ${gym.city}' : '${gym.area} · $dist',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(color: AppColors.neutral500, fontSize: 13),
                        ),
                      ),
                    ]),
                    const SizedBox(height: 10),
                    // amenity chips (first 3), single row, no wrap
                    SizedBox(
                      height: 26,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                        for (final a in gym.amenities.take(3))
                          Container(
                            margin: const EdgeInsets.only(right: 6),
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.neutral50,
                              borderRadius: BorderRadius.circular(AppRadius.full),
                              border: Border.all(color: AppColors.neutral200),
                            ),
                            child: Row(mainAxisSize: MainAxisSize.min, children: [
                              Icon(amenityIcon(a), size: 12, color: AppColors.neutral600),
                              const SizedBox(width: 4),
                              Text(a, style: const TextStyle(fontSize: 11, color: AppColors.neutral700)),
                            ]),
                          ),
                        if (gym.amenities.length > 3)
                          Container(
                            alignment: Alignment.center,
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: Text('+${gym.amenities.length - 3}',
                                style: const TextStyle(fontSize: 11, color: AppColors.neutral500)),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        if (gym.womenFriendly)
                          const Padding(
                            padding: EdgeInsets.only(right: 8),
                            child: Icon(Icons.woman, size: 18, color: AppColors.primary500),
                          ),
                        const Spacer(),
                        Text(formatINR(gym.pricePerMonth),
                            style: const TextStyle(
                                fontSize: 18, fontWeight: FontWeight.w800)),
                        const Text('/mo',
                            style: TextStyle(color: AppColors.neutral500, fontSize: 13)),
                      ],
                    ),
                  ],
                ),
              ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
