import 'package:flutter/material.dart';

/// Horizontal scroll physics that settles on item boundaries, so a
/// carousel of fixed-width cards lands flush instead of stopping mid-card.
/// [itemExtent] must include any separator spacing between items.
class SnapScrollPhysics extends ScrollPhysics {
  final double itemExtent;

  const SnapScrollPhysics({required this.itemExtent, super.parent});

  @override
  SnapScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return SnapScrollPhysics(
        itemExtent: itemExtent, parent: buildParent(ancestor));
  }

  @override
  Simulation? createBallisticSimulation(
      ScrollMetrics position, double velocity) {
    final tolerance = toleranceFor(position);
    if ((velocity.abs() < tolerance.velocity) &&
        (position.pixels <= position.minScrollExtent ||
            position.pixels >= position.maxScrollExtent)) {
      return null;
    }

    final page = position.pixels / itemExtent;
    final targetPage = velocity.abs() < tolerance.velocity
        ? page.round()
        : (velocity > 0 ? page.ceil() : page.floor());
    final target = (targetPage * itemExtent)
        .clamp(position.minScrollExtent, position.maxScrollExtent);

    if (target == position.pixels) return null;

    return ScrollSpringSimulation(
      spring,
      position.pixels,
      target,
      velocity,
      tolerance: tolerance,
    );
  }

  @override
  bool get allowImplicitScrolling => false;
}
