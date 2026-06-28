import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Gymma design tokens — ported from the web app's globals.css (spec §3).
/// Re-theme by editing values here.
class AppColors {
  // Primary — energetic orange (accent)
  static const primary50 = Color(0xFFFFF7ED);
  static const primary100 = Color(0xFFFFEDD5);
  static const primary500 = Color(0xFFF97316);
  static const primary600 = Color(0xFFEA580C);
  static const primary700 = Color(0xFFC2410C);

  // Secondary — trust & health green
  static const secondary50 = Color(0xFFF0FDF4);
  static const secondary500 = Color(0xFF22C55E);
  static const secondary700 = Color(0xFF15803D);

  // Neutrals
  static const neutral0 = Color(0xFFFFFFFF);
  static const neutral50 = Color(0xFFFAFAFA);
  static const neutral100 = Color(0xFFF5F5F5);
  static const neutral200 = Color(0xFFE5E5E5);
  static const neutral300 = Color(0xFFD4D4D4);
  static const neutral400 = Color(0xFFA3A3A3);
  static const neutral500 = Color(0xFF737373);
  static const neutral600 = Color(0xFF525252);
  static const neutral700 = Color(0xFF404040);
  static const neutral800 = Color(0xFF262626);
  static const neutral900 = Color(0xFF171717);

  // Ink — primary action color (near-black does the heavy lifting)
  static const ink = Color(0xFF0A0A0A);
  static const inkHover = Color(0xFF404040);

  // Semantic
  static const success = secondary500;
  static const rating = Color(0xFFFBBF24);
  static const green = Color(0xFF16A34A); // whatsapp accent
}

class AppRadius {
  static const sm = 6.0;
  static const md = 10.0;
  static const lg = 16.0;
  static const xl = 24.0;
  static const full = 9999.0;
}

ThemeData buildGymmaTheme() {
  final base = ThemeData(useMaterial3: true);
  final textTheme = GoogleFonts.interTextTheme(base.textTheme);

  return base.copyWith(
    scaffoldBackgroundColor: AppColors.neutral0,
    colorScheme: const ColorScheme.light(
      primary: AppColors.ink,
      secondary: AppColors.primary500,
      surface: AppColors.neutral0,
      onPrimary: Colors.white,
      onSurface: AppColors.neutral900,
    ),
    textTheme: textTheme.apply(
      bodyColor: AppColors.neutral900,
      displayColor: AppColors.neutral900,
    ),
    dividerColor: AppColors.neutral200,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.neutral0,
      foregroundColor: AppColors.neutral900,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      surfaceTintColor: Colors.transparent,
    ),
    splashFactory: InkRipple.splashFactory,
  );
}
