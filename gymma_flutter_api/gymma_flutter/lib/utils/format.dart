// Formatting helpers — ported from the web app's src/lib/utils.ts (India-first, INR).

/// ₹2,500 / ₹12,34,567 — Indian digit grouping (…,2,2,3), no decimals.
String formatINR(num amount) {
  final neg = amount < 0 ? '-' : '';
  final n = amount.round().abs().toString();
  if (n.length <= 3) return '$neg₹$n';
  final last3 = n.substring(n.length - 3);
  var rest = n.substring(0, n.length - 3);
  final groups = <String>[];
  while (rest.length > 2) {
    groups.insert(0, rest.substring(rest.length - 2));
    rest = rest.substring(0, rest.length - 2);
  }
  if (rest.isNotEmpty) groups.insert(0, rest);
  return '$neg₹${groups.join(',')},$last3';
}

/// "1.2 km away" / "850 m away"
String? formatDistance(double? km) {
  if (km == null) return null;
  if (km < 1) return '${(km * 1000).round()} m away';
  return '${km.toStringAsFixed(1)} km away';
}
