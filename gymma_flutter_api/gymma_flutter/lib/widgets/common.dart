import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../theme.dart';

/// Cover/photo with a branded gradient + initials fallback (mirrors web GymImage).
class GymImage extends StatelessWidget {
  final String name;
  final String? src;
  final double? height;
  final double aspectRatio;
  final BorderRadius? radius;
  final BoxFit fit;
  const GymImage({
    super.key,
    required this.name,
    this.src,
    this.height,
    this.aspectRatio = 16 / 9,
    this.radius,
    this.fit = BoxFit.cover,
  });

  String get _initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    return parts.take(2).map((p) => p.isEmpty ? '' : p[0]).join().toUpperCase();
  }

  Widget _fallback() => DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.primary500, AppColors.primary700],
          ),
        ),
        child: Center(
          child: Text(
            _initials,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.w800,
                letterSpacing: 1),
          ),
        ),
      );

  @override
  Widget build(BuildContext context) {
    Widget img = (src == null || src!.isEmpty)
        ? _fallback()
        : CachedNetworkImage(
            imageUrl: src!,
            fit: fit,
            placeholder: (_, __) => Container(color: AppColors.neutral100),
            errorWidget: (_, __, ___) => _fallback(),
          );
    if (radius != null) img = ClipRRect(borderRadius: radius!, child: img);
    if (height != null) {
      return SizedBox(height: height, width: double.infinity, child: img);
    }
    return AspectRatio(aspectRatio: aspectRatio, child: img);
  }
}

class StarRating extends StatelessWidget {
  final double rating;
  final double size;
  final bool showValue;
  const StarRating(this.rating,
      {super.key, this.size = 16, this.showValue = false});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (int i = 1; i <= 5; i++)
          Icon(
            rating >= i
                ? Icons.star_rounded
                : (rating >= i - 0.5
                    ? Icons.star_half_rounded
                    : Icons.star_outline_rounded),
            size: size,
            color: AppColors.rating,
          ),
        if (showValue) ...[
          const SizedBox(width: 6),
          Text(rating.toStringAsFixed(1),
              style:
                  TextStyle(fontWeight: FontWeight.w600, fontSize: size - 2)),
        ]
      ],
    );
  }
}

enum BadgeVariant { success, secondary, neutral }

class GymBadge extends StatelessWidget {
  final String label;
  final BadgeVariant variant;
  const GymBadge(this.label, {super.key, this.variant = BadgeVariant.neutral});

  @override
  Widget build(BuildContext context) {
    late Color bg, fg;
    switch (variant) {
      case BadgeVariant.success:
        bg = AppColors.secondary50;
        fg = AppColors.secondary700;
        break;
      case BadgeVariant.secondary:
        bg = AppColors.primary50;
        fg = AppColors.primary700;
        break;
      case BadgeVariant.neutral:
        bg = AppColors.neutral100;
        fg = AppColors.neutral600;
        break;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(AppRadius.full)),
      child: Text(label,
          style:
              TextStyle(color: fg, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

IconData amenityIcon(String amenity) {
  switch (amenity) {
    case 'Cardio':
      return Icons.directions_run;
    case 'Weights':
      return Icons.fitness_center;
    case 'CrossFit':
      return Icons.sports_gymnastics;
    case 'Swimming':
      return Icons.pool;
    case 'Steam':
      return Icons.hot_tub;
    case 'Sauna':
      return Icons.whatshot;
    case 'Shower':
      return Icons.shower;
    case 'Lockers':
      return Icons.lock_outline;
    case 'AC':
      return Icons.ac_unit;
    case "Women's Section":
      return Icons.woman;
    case 'PT':
      return Icons.person_pin;
    case 'Group Classes':
      return Icons.groups;
    case 'Parking':
      return Icons.local_parking;
    case 'Wi-Fi':
      return Icons.wifi;
    case 'Cafeteria':
      return Icons.local_cafe;
    default:
      return Icons.check_circle_outline;
  }
}
