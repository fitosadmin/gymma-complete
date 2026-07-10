import 'package:flutter/material.dart';
import '../theme.dart';

/// An [ExpansionTile] with the app's own chevron instead of Flutter's default
/// expand arrow, so FAQ rows (Gym Detail) and session rows (Workout
/// Dashboard) don't read as the one off-the-shelf element on an otherwise
/// fully custom screen.
class BrandedExpansionTile extends StatefulWidget {
  final Widget title;
  final Widget? subtitle;
  final Widget? leading;
  /// Extra content (e.g. a duration pill) shown to the left of the chevron.
  final Widget? trailingExtra;
  final List<Widget> children;
  final EdgeInsetsGeometry tilePadding;
  final EdgeInsetsGeometry childrenPadding;

  const BrandedExpansionTile({
    super.key,
    required this.title,
    this.subtitle,
    this.leading,
    this.trailingExtra,
    required this.children,
    this.tilePadding = EdgeInsets.zero,
    this.childrenPadding = EdgeInsets.zero,
  });

  @override
  State<BrandedExpansionTile> createState() => _BrandedExpansionTileState();
}

class _BrandedExpansionTileState extends State<BrandedExpansionTile> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
      child: ExpansionTile(
        tilePadding: widget.tilePadding,
        childrenPadding: widget.childrenPadding,
        leading: widget.leading,
        title: widget.title,
        subtitle: widget.subtitle,
        onExpansionChanged: (v) => setState(() => _expanded = v),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.trailingExtra != null) ...[
              widget.trailingExtra!,
              const SizedBox(width: 8),
            ],
            AnimatedRotation(
              turns: _expanded ? 0.5 : 0,
              duration: const Duration(milliseconds: 200),
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppColors.brandCopper.withOpacity(_expanded ? 0.14 : 0.08),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.keyboard_arrow_down_rounded,
                    color: AppColors.brandCopper, size: 18),
              ),
            ),
          ],
        ),
        children: widget.children,
      ),
    );
  }
}
