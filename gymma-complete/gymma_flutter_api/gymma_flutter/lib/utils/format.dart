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

/// Parses "HH:MM:SS" into minutes since midnight.
int? _parseTimeStr(String? t) {
  if (t == null || t.isEmpty) return null;
  final parts = t.split(':');
  if (parts.length < 2) return null;
  final h = int.tryParse(parts[0]);
  final m = int.tryParse(parts[1]);
  if (h == null || m == null) return null;
  return h * 60 + m;
}

/// Returns true if current local time is between opensAt and closesAt.
bool checkIsOpenNow(String? opensAt, String? closesAt, {bool fallback = true}) {
  if (opensAt == null || closesAt == null) return fallback;
  final now = DateTime.now();
  final currentMins = now.hour * 60 + now.minute;
  
  final openMins = _parseTimeStr(opensAt);
  final closeMins = _parseTimeStr(closesAt);
  
  if (openMins == null || closeMins == null) return fallback;
  
  if (closeMins < openMins) {
    // Overnight gym
    return currentMins >= openMins || currentMins <= closeMins;
  }
  return currentMins >= openMins && currentMins <= closeMins;
}

/// Formats "14:30:00" -> "2:30 PM"
String? formatTimeShort(String? t) {
  final mins = _parseTimeStr(t);
  if (mins == null) return null;
  final h = mins ~/ 60;
  final m = mins % 60;
  final ampm = h >= 12 ? "PM" : "AM";
  final h12 = h % 12 == 0 ? 12 : h % 12;
  final mStr = m.toString().padLeft(2, '0');
  return m == 0 ? "$h12 $ampm" : "$h12:$mStr $ampm";
}
