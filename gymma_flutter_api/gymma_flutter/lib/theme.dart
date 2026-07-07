import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ─────────────────────────────────────────────────────────────────────────────
// § 1  DESIGN TOKENS
//      Sourced directly from Gymma_Customer_poster.html CSS variables.
//      All brand decisions live here; widgets must not hard-code hex values.
// ─────────────────────────────────────────────────────────────────────────────

class AppColors {
  // ── Brand primaries (Poster: --copper / --copper-soft) ───────────────────
  static const brandCopper     = Color(0xFFC46A4A); // --copper
  static const brandCopperSoft = Color(0xFFD98D6A); // --copper-soft

  // ── Brand secondaries (Poster: --navy / --navy-deep) ─────────────────────
  static const brandNavy       = Color(0xFF1F2D3D); // --navy
  static const brandNavyDark   = Color(0xFF141F2B); // --navy-deep

  // ── Surfaces (Poster: --paper / --card) ──────────────────────────────────
  static const paperBackground = Color(0xFFFAF8F5); // --paper  (app bg)
  static const surface         = Color(0xFFFFFFFF); // --card   (card bg)
  static const surfaceDark     = Color(0xFF141F2B); // premium dark section

  // ── Text (Poster: --ink / --muted) ───────────────────────────────────────
  static const textPrimary   = Color(0xFF22303F);  // --ink
  static const textSecondary = Color(0xFF65717E);  // --muted

  // ── Divider / borders (Poster: --line) ───────────────────────────────────
  static const divider = Color(0xFFE9E4DE);         // --line

  // ── Semantic — intentionally NOT using brand copper/navy here ────────────
  static const success = Color(0xFF22C55E);
  static const warning = Color(0xFFF59E0B);
  static const error   = Color(0xFFEF4444);
  static const rating  = Color(0xFFFBBF24);
  static const green   = Color(0xFF16A34A);         // WhatsApp accent

  // ─────────────────────────────────────────────────────────────────────────
  // Backward-compatibility aliases  (keep existing widget code compiling)
  // ─────────────────────────────────────────────────────────────────────────
  static const primary50  = Color(0xFFF5EDE9); // copper-tinted tint
  static const primary100 = Color(0xFFEDD5C9); // copper-tinted light
  static const primary500 = brandCopper;
  static const primary600 = Color(0xFFAD5B3C);
  static const primary700 = Color(0xFF8F4A30);

  static const secondary50  = Color(0xFFEEF1F4); // navy-tinted tint
  static const secondary500 = brandNavy;
  static const secondary700 = brandNavyDark;

  static const neutral0   = surface;
  static const neutral50  = paperBackground;
  static const neutral100 = Color(0xFFF0EDE8);
  static const neutral200 = divider;
  static const neutral300 = Color(0xFFCEC8C1);
  static const neutral400 = Color(0xFFABA49B);
  static const neutral500 = textSecondary;
  static const neutral600 = Color(0xFF4E5A64);
  static const neutral700 = Color(0xFF3A4650);
  static const neutral800 = Color(0xFF2A3540);
  static const neutral900 = textPrimary;

  static const ink      = textPrimary;
  static const inkHover = brandNavy;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 2  BRAND GRADIENTS
//      Poster: linear-gradient(100deg, #1f2d3d 0%, #4a3f43 45%, #c46a4a 100%)
// ─────────────────────────────────────────────────────────────────────────────

class AppGradients {
  /// Primary brand gradient — used on hero chips, CTAs, step circles, plan
  /// badges, and anywhere the poster applies `var(--grad)`.
  static const brandGradient = LinearGradient(
    begin: Alignment.centerLeft,
    end:   Alignment.centerRight,
    stops: [0.0, 0.45, 1.0],
    colors: [
      Color(0xFF1F2D3D), // navy
      Color(0xFF4A3F43), // muted midpoint (from poster)
      Color(0xFFC46A4A), // copper
    ],
  );

  /// Copper-only glow — used for stat text, price highlights.
  static const copperGradient = LinearGradient(
    begin: Alignment.topLeft,
    end:   Alignment.bottomRight,
    stops: [0.0, 0.55, 1.0],
    colors: [
      Color(0xFFD98D6A),
      Color(0xFFC46A4A),
      Color(0xFF9C4F33),
    ],
  );

  /// Navy depth — for full-bleed dark sections.
  static const navyGradient = LinearGradient(
    begin: Alignment.topCenter,
    end:   Alignment.bottomCenter,
    colors: [Color(0xFF1F2D3D), Color(0xFF141F2B)],
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// § 7  SHAPE & RADIUS TOKENS
// ─────────────────────────────────────────────────────────────────────────────

class AppRadius {
  static const sm     = 6.0;
  static const md     = 12.0;  // buttons
  static const lg     = 16.0;  // inputs
  static const xl     = 20.0;  // cards
  static const xxl    = 24.0;  // dialogs / bottom-sheets
  static const full   = 9999.0;
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3-6  THEME BUILDER
// ─────────────────────────────────────────────────────────────────────────────

ThemeData buildGymmaTheme() {
  final base      = ThemeData(useMaterial3: true);
  final textTheme = GoogleFonts.interTextTheme(base.textTheme);

  // § 6  Typography — map roles to poster ink/muted semantics
  final brandTextTheme = textTheme.copyWith(
    // Display / headlines → deep ink
    displayLarge:  textTheme.displayLarge?.copyWith(
        color: AppColors.textPrimary, fontWeight: FontWeight.w800),
    displayMedium: textTheme.displayMedium?.copyWith(
        color: AppColors.textPrimary, fontWeight: FontWeight.w800),
    displaySmall:  textTheme.displaySmall?.copyWith(
        color: AppColors.textPrimary, fontWeight: FontWeight.w700),
    headlineLarge: textTheme.headlineLarge?.copyWith(
        color: AppColors.textPrimary, fontWeight: FontWeight.w700),
    headlineMedium: textTheme.headlineMedium?.copyWith(
        color: AppColors.textPrimary, fontWeight: FontWeight.w700),
    headlineSmall: textTheme.headlineSmall?.copyWith(
        color: AppColors.textPrimary, fontWeight: FontWeight.w600),
    // Title / body → ink
    titleLarge:   textTheme.titleLarge?.copyWith(
        color: AppColors.textPrimary, fontWeight: FontWeight.w600),
    titleMedium:  textTheme.titleMedium?.copyWith(
        color: AppColors.textPrimary, fontWeight: FontWeight.w600),
    titleSmall:   textTheme.titleSmall?.copyWith(
        color: AppColors.textPrimary, fontWeight: FontWeight.w500),
    bodyLarge:    textTheme.bodyLarge?.copyWith(color: AppColors.textPrimary),
    bodyMedium:   textTheme.bodyMedium?.copyWith(color: AppColors.textPrimary),
    bodySmall:    textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
    // Labels / captions → muted
    labelLarge:  textTheme.labelLarge?.copyWith(
        color: AppColors.brandNavy, fontWeight: FontWeight.w700,
        letterSpacing: 0.5),
    labelMedium: textTheme.labelMedium?.copyWith(color: AppColors.textSecondary),
    labelSmall:  textTheme.labelSmall?.copyWith(color: AppColors.textSecondary),
  );

  // § 7  Shared border-radius helpers
  const btnRadius    = BorderRadius.all(Radius.circular(AppRadius.md));
  const inputRadius  = BorderRadius.all(Radius.circular(AppRadius.lg));
  const cardRadius   = BorderRadius.all(Radius.circular(AppRadius.xl));
  const dialogRadius = BorderRadius.all(Radius.circular(AppRadius.xxl));

  return base.copyWith(
    // § 3a  Background
    scaffoldBackgroundColor: AppColors.paperBackground,

    // § 3b  ColorScheme
    colorScheme: const ColorScheme.light(
      primary:          AppColors.brandCopper,   // main brand accent
      onPrimary:        Colors.white,
      primaryContainer: Color(0xFFEDD5C9),
      onPrimaryContainer: AppColors.brandNavyDark,

      secondary:        AppColors.brandNavy,
      onSecondary:      Colors.white,
      secondaryContainer: Color(0xFFEEF1F4),
      onSecondaryContainer: AppColors.brandNavy,

      surface:          AppColors.surface,
      onSurface:        AppColors.textPrimary,

      surfaceContainerHighest: AppColors.paperBackground,
      onSurfaceVariant: AppColors.textSecondary,

      outline:          AppColors.divider,
      outlineVariant:   AppColors.divider,

      error:            AppColors.error,
      onError:          Colors.white,
    ),

    // § 6  Typography
    textTheme: brandTextTheme,

    // § 3c  Dividers
    dividerColor: AppColors.divider,
    dividerTheme: const DividerThemeData(
      color: AppColors.divider,
      thickness: 1,
      space: 1,
    ),

    // § 3d  AppBar
    appBarTheme: AppBarTheme(
      backgroundColor:         AppColors.surface,
      foregroundColor:         AppColors.textPrimary,
      surfaceTintColor:        Colors.transparent,
      shadowColor:             AppColors.brandNavy.withOpacity(0.08),
      elevation:               0,
      scrolledUnderElevation:  1,
      titleTextStyle: GoogleFonts.inter(
        color: AppColors.textPrimary,
        fontSize: 18,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.2,
      ),
      iconTheme: const IconThemeData(color: AppColors.textPrimary),
    ),

    // § 3e  Cards
    cardTheme: const CardThemeData(
      color:        AppColors.surface,
      surfaceTintColor: Colors.transparent,
      elevation:    0,
      margin:       EdgeInsets.zero,
      shape:        RoundedRectangleBorder(
        borderRadius: cardRadius,
        side: BorderSide(color: AppColors.divider, width: 1),
      ),
    ),

    // § 3f  Dialogs
    dialogTheme: DialogThemeData(
      backgroundColor: AppColors.surface,
      surfaceTintColor: Colors.transparent,
      elevation: 8,
      shadowColor: AppColors.brandNavy.withOpacity(0.18),
      shape: const RoundedRectangleBorder(borderRadius: dialogRadius),
      titleTextStyle: GoogleFonts.inter(
        color: AppColors.textPrimary,
        fontSize: 20,
        fontWeight: FontWeight.w700,
      ),
      contentTextStyle: GoogleFonts.inter(
        color: AppColors.textSecondary,
        fontSize: 15,
        height: 1.6,
      ),
    ),

    // § 3g  Bottom Sheets
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor:      AppColors.surface,
      surfaceTintColor:     Colors.transparent,
      modalBackgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xxl)),
      ),
      elevation: 0,
    ),


    // § 4a  ElevatedButton → Copper fill
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor:   AppColors.brandCopper,
        foregroundColor:   Colors.white,
        disabledBackgroundColor: AppColors.divider,
        disabledForegroundColor: AppColors.textSecondary,
        elevation:  0,
        shadowColor: Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
        shape: const RoundedRectangleBorder(borderRadius: btnRadius),
        textStyle: GoogleFonts.inter(
          fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: 1.5),
      ),
    ),

    // § 4b  FilledButton → Navy fill (secondary action)
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AppColors.brandNavy,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
        shape: const RoundedRectangleBorder(borderRadius: btnRadius),
        textStyle: GoogleFonts.inter(
          fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: 0.8),
      ),
    ),

    // § 4c  OutlinedButton → Navy border, transparent fill
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.brandNavy,
        side: const BorderSide(color: AppColors.brandNavy, width: 1.5),
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
        shape: const RoundedRectangleBorder(borderRadius: btnRadius),
        textStyle: GoogleFonts.inter(
          fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: 0.5),
      ),
    ),

    // § 4d  TextButton → Copper text
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.brandCopper,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        shape: const RoundedRectangleBorder(borderRadius: btnRadius),
        textStyle: GoogleFonts.inter(
          fontSize: 14, fontWeight: FontWeight.w600, letterSpacing: 0.3),
      ),
    ),

    // § 4e  FAB → Copper
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.brandCopper,
      foregroundColor: Colors.white,
      elevation:       4,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(AppRadius.md))),
    ),

    // § 5  Inputs
    inputDecorationTheme: InputDecorationTheme(
      filled:      true,
      fillColor:   AppColors.surface,
      hintStyle:   GoogleFonts.inter(
          color: AppColors.textSecondary, fontSize: 15),
      labelStyle:  GoogleFonts.inter(
          color: AppColors.textSecondary, fontSize: 15),
      floatingLabelStyle: GoogleFonts.inter(
          color: AppColors.brandCopper, fontSize: 13, fontWeight: FontWeight.w600),
      contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      border: const OutlineInputBorder(
        borderRadius: inputRadius,
        borderSide: BorderSide(color: AppColors.divider, width: 1),
      ),
      enabledBorder: const OutlineInputBorder(
        borderRadius: inputRadius,
        borderSide: BorderSide(color: AppColors.divider, width: 1),
      ),
      focusedBorder: const OutlineInputBorder(
        borderRadius: inputRadius,
        borderSide: BorderSide(color: AppColors.brandCopper, width: 1.5),
      ),
      errorBorder: const OutlineInputBorder(
        borderRadius: inputRadius,
        borderSide: BorderSide(color: AppColors.error, width: 1),
      ),
      focusedErrorBorder: const OutlineInputBorder(
        borderRadius: inputRadius,
        borderSide: BorderSide(color: AppColors.error, width: 1.5),
      ),
      errorStyle: GoogleFonts.inter(color: AppColors.error, fontSize: 12),
    ),

    // Chip theme
    chipTheme: ChipThemeData(
      backgroundColor:   AppColors.paperBackground,
      selectedColor:     AppColors.brandCopper.withOpacity(0.15),
      disabledColor:     AppColors.divider,
      labelStyle:        GoogleFonts.inter(
          color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w500),
      secondaryLabelStyle: GoogleFonts.inter(
          color: AppColors.brandCopper, fontSize: 13, fontWeight: FontWeight.w600),
      side: const BorderSide(color: AppColors.divider),
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(AppRadius.full))),
    ),

    // Tab bar
    tabBarTheme: TabBarThemeData(
      labelColor:         AppColors.brandCopper,
      unselectedLabelColor: AppColors.textSecondary,
      indicatorColor:     AppColors.brandCopper,
      indicatorSize:      TabBarIndicatorSize.label,
      labelStyle:         GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700),
      unselectedLabelStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500),
    ),

    // List tiles
    listTileTheme: const ListTileThemeData(
      iconColor:   AppColors.textSecondary,
      textColor:   AppColors.textPrimary,
      tileColor:   Colors.transparent,
      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    ),

    // Switches, Checkboxes, Radio
    switchTheme: SwitchThemeData(
      thumbColor: WidgetStateProperty.resolveWith((states) =>
          states.contains(WidgetState.selected)
              ? AppColors.brandCopper
              : AppColors.textSecondary),
      trackColor: WidgetStateProperty.resolveWith((states) =>
          states.contains(WidgetState.selected)
              ? AppColors.brandCopper.withOpacity(0.35)
              : AppColors.divider),
    ),
    checkboxTheme: CheckboxThemeData(
      fillColor: WidgetStateProperty.resolveWith((states) =>
          states.contains(WidgetState.selected)
              ? AppColors.brandCopper
              : Colors.transparent),
      checkColor: WidgetStateProperty.all(Colors.white),
      side: const BorderSide(color: AppColors.divider, width: 1.5),
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.sm)),
    ),
    radioTheme: RadioThemeData(
      fillColor: WidgetStateProperty.resolveWith((states) =>
          states.contains(WidgetState.selected)
              ? AppColors.brandCopper
              : AppColors.textSecondary),
    ),

    // Progress indicators
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color:            AppColors.brandCopper,
      linearTrackColor: AppColors.divider,
      circularTrackColor: AppColors.divider,
    ),

    // Snackbar
    snackBarTheme: SnackBarThemeData(
      backgroundColor: AppColors.brandNavy,
      contentTextStyle: GoogleFonts.inter(color: Colors.white, fontSize: 14),
      actionTextColor:  AppColors.brandCopperSoft,
      behavior:         SnackBarBehavior.floating,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(AppRadius.md))),
      elevation: 4,
    ),

    // Tooltip
    tooltipTheme: TooltipThemeData(
      decoration: BoxDecoration(
        color: AppColors.brandNavy,
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      textStyle: GoogleFonts.inter(color: Colors.white, fontSize: 12),
    ),

    splashFactory: InkRipple.splashFactory,
    splashColor:   AppColors.brandCopper.withOpacity(0.12),
    highlightColor: AppColors.brandCopper.withOpacity(0.06),
  );
}
