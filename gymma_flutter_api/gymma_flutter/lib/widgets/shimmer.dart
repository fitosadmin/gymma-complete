import 'package:flutter/material.dart';
import '../theme.dart';

// ─────────────────────────────────────────────────────────────────────────────
// ShimmerBox — skeleton loading placeholder
// ─────────────────────────────────────────────────────────────────────────────

class ShimmerBox extends StatefulWidget {
  final double width;
  final double height;
  final BorderRadius borderRadius;
  const ShimmerBox({
    super.key,
    required this.width,
    required this.height,
    this.borderRadius = const BorderRadius.all(Radius.circular(AppRadius.md)),
  });

  @override
  State<ShimmerBox> createState() => _ShimmerBoxState();
}

class _ShimmerBoxState extends State<ShimmerBox>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);
    _anim = CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) => Container(
        width: widget.width,
        height: widget.height,
        decoration: BoxDecoration(
          borderRadius: widget.borderRadius,
          gradient: LinearGradient(
            colors: [
              AppColors.neutral200,
              Color.lerp(AppColors.neutral200, AppColors.neutral100, _anim.value)!,
              AppColors.neutral200,
            ],
            stops: const [0.0, 0.5, 1.0],
          ),
        ),
      ),
    );
  }
}

// Card-level shimmer for gym cards / dashboard cards
class ShimmerCard extends StatelessWidget {
  final double height;
  const ShimmerCard({super.key, this.height = 240});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ShimmerBox(
              width: double.infinity,
              height: height * 0.48,
              borderRadius: BorderRadius.circular(AppRadius.lg)),
          const SizedBox(height: 12),
          ShimmerBox(
              width: double.infinity * 0.7,
              height: 16,
              borderRadius: BorderRadius.circular(AppRadius.sm)),
          const SizedBox(height: 8),
          ShimmerBox(
              width: 120,
              height: 12,
              borderRadius: BorderRadius.circular(AppRadius.sm)),
          const Spacer(),
          ShimmerBox(
              width: 80,
              height: 20,
              borderRadius: BorderRadius.circular(AppRadius.sm)),
        ],
      ),
    );
  }
}
