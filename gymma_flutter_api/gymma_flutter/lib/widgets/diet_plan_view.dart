import 'package:flutter/material.dart';
import '../theme.dart';

const Map<String, String> kGoalLabels = {
  'lose_fat': 'Lose Fat',
  'build_muscle': 'Build Muscle',
  'maintain': 'Maintain',
};

const Map<String, String> kActivityLabels = {
  'sedentary': 'Sedentary',
  'lightly_active': 'Lightly Active',
  'moderately_active': 'Moderately Active',
  'very_active': 'Very Active',
  'athlete': 'Athlete',
};

const Map<String, String> kDietaryPatternLabels = {
  'omnivore': 'Omnivore',
  'vegetarian': 'Vegetarian',
  'vegan': 'Vegan',
  'keto': 'Keto',
  'no_preference': 'No Preference',
};

/// Renders one calculated diet plan: hero calorie card, macro breakdown,
/// meal-by-meal calorie distribution, and any notes/warnings the calculator
/// attached. Shared by the diet dashboard (active plan) and plan history
/// (past plans), so this visualization is written once — mirrors the
/// hero-card / stat-card / warning-banner patterns from
/// workout_dashboard_screen.dart and workout_plan_view_screen.dart.
class DietPlanView extends StatelessWidget {
  final Map<String, dynamic> plan;
  const DietPlanView({super.key, required this.plan});

  @override
  Widget build(BuildContext context) {
    final macros = plan['macros'] as Map<String, dynamic>? ?? const {};
    final meals = plan['meals'] as Map<String, dynamic>? ?? const {};
    final notes = (plan['notes'] as List?)?.cast<String>() ?? const [];
    final warnings = (plan['warnings'] as List?)?.cast<String>() ?? const [];

    final proteinCal = (macros['proteinCal'] as num?)?.toInt() ?? 0;
    final carbsCal = (macros['carbsCal'] as num?)?.toInt() ?? 0;
    final fatCal = (macros['fatCal'] as num?)?.toInt() ?? 0;
    final macroTotal = (proteinCal + carbsCal + fatCal).clamp(1, 1 << 30);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _HeroCard(plan: plan),
        const SizedBox(height: 24),
        const _SectionLabel(eyebrow: 'BREAKDOWN', title: 'Macros'),
        const SizedBox(height: 14),
        ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.full),
          child: SizedBox(
            height: 10,
            child: Row(
              children: macroTotal <= 1
                  ? [Expanded(child: Container(color: AppColors.divider))]
                  : [
                      if (proteinCal > 0) Expanded(flex: proteinCal, child: Container(color: AppColors.brandCopper)),
                      if (carbsCal > 0) Expanded(flex: carbsCal, child: Container(color: AppColors.success)),
                      if (fatCal > 0) Expanded(flex: fatCal, child: Container(color: AppColors.warning)),
                    ],
            ),
          ),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: _MacroStat(
                label: 'Protein',
                grams: macros['proteinG'] as num? ?? 0,
                cal: proteinCal,
                color: AppColors.brandCopper,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _MacroStat(
                label: 'Carbs',
                grams: macros['carbsG'] as num? ?? 0,
                cal: carbsCal,
                color: AppColors.success,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _MacroStat(
                label: 'Fat',
                grams: macros['fatG'] as num? ?? 0,
                cal: fatCal,
                color: AppColors.warning,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        const _SectionLabel(eyebrow: 'THROUGHOUT THE DAY', title: 'Meal Split'),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(child: _MealChip('Breakfast', meals['breakfastCal'])),
            const SizedBox(width: 8),
            Expanded(child: _MealChip('Lunch', meals['lunchCal'])),
            const SizedBox(width: 8),
            Expanded(child: _MealChip('Dinner', meals['dinnerCal'])),
            const SizedBox(width: 8),
            Expanded(child: _MealChip('Snacks', meals['snacksCal'])),
          ],
        ),
        if (notes.isNotEmpty) ...[
          const SizedBox(height: 24),
          _InfoCard(
            icon: Icons.lightbulb_outline_rounded,
            iconColor: AppColors.brandCopper,
            title: 'Notes',
            items: notes,
            tint: AppColors.brandCopper,
          ),
        ],
        if (warnings.isNotEmpty) ...[
          const SizedBox(height: 16),
          _InfoCard(
            icon: Icons.shield_outlined,
            iconColor: AppColors.warning,
            title: 'Warnings',
            items: warnings,
            tint: AppColors.warning,
          ),
        ],
      ],
    );
  }
}

class _HeroCard extends StatelessWidget {
  final Map<String, dynamic> plan;
  const _HeroCard({required this.plan});

  @override
  Widget build(BuildContext context) {
    final goal = kGoalLabels[plan['goal']] ?? plan['goal']?.toString() ?? '';
    final targetCalories = plan['targetCalories'] as num? ?? 0;
    final bmr = plan['bmr'] as num? ?? 0;
    final tdee = plan['tdee'] as num? ?? 0;

    return Container(
      decoration: BoxDecoration(
        gradient: AppGradients.navyGradient,
        borderRadius: BorderRadius.circular(AppRadius.xxl),
        boxShadow: [
          BoxShadow(
            color: AppColors.brandNavy.withOpacity(0.4),
            blurRadius: 28,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -20,
            top: -20,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.brandCopper.withOpacity(0.1),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.brandCopper.withOpacity(0.2),
                    border: Border.all(color: AppColors.brandCopper.withOpacity(0.4)),
                    borderRadius: BorderRadius.circular(AppRadius.full),
                  ),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.flag_rounded, color: AppColors.brandCopper, size: 12),
                    const SizedBox(width: 4),
                    Text(goal,
                        style: const TextStyle(
                            color: AppColors.brandCopper, fontSize: 11, fontWeight: FontWeight.w700)),
                  ]),
                ),
                const SizedBox(height: 16),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      '$targetCalories',
                      style: const TextStyle(
                          color: Colors.white, fontSize: 40, fontWeight: FontWeight.w800, letterSpacing: -1),
                    ),
                    const SizedBox(width: 6),
                    Text('kcal / day',
                        style: TextStyle(color: Colors.white.withOpacity(0.55), fontSize: 14)),
                  ],
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    _HeroMiniStat('BMR', '$bmr kcal'),
                    const SizedBox(width: 24),
                    _HeroMiniStat('TDEE', '$tdee kcal'),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroMiniStat extends StatelessWidget {
  final String label;
  final String value;
  const _HeroMiniStat(this.label, this.value);

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 10, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
        ],
      );
}

class _SectionLabel extends StatelessWidget {
  final String eyebrow;
  final String title;
  const _SectionLabel({required this.eyebrow, required this.title});

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(eyebrow,
              style: const TextStyle(
                  color: AppColors.brandCopper, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 2.5)),
          const SizedBox(height: 2),
          Text(title,
              style: const TextStyle(
                  color: AppColors.textPrimary, fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: -0.3)),
        ],
      );
}

class _MacroStat extends StatelessWidget {
  final String label;
  final num grams;
  final int cal;
  final Color color;
  const _MacroStat({required this.label, required this.grams, required this.cal, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: AppColors.divider),
        boxShadow: [
          BoxShadow(color: color.withOpacity(0.07), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(height: 10),
          Text('${grams}g', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: color)),
          const SizedBox(height: 2),
          Text('$label · $cal kcal', style: const TextStyle(color: AppColors.textSecondary, fontSize: 10.5)),
        ],
      ),
    );
  }
}

class _MealChip extends StatelessWidget {
  final String label;
  final dynamic cal;
  const _MealChip(this.label, this.cal);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.paperBackground,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        children: [
          Text('${cal ?? 0}',
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 10.5, color: AppColors.textSecondary), textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final List<String> items;
  final Color tint;
  const _InfoCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.items,
    required this.tint,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: tint.withOpacity(0.1),
        border: Border.all(color: tint.withOpacity(0.5)),
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Icon(icon, color: iconColor, size: 18),
            const SizedBox(width: 8),
            Text(title, style: TextStyle(fontWeight: FontWeight.w700, color: iconColor)),
          ]),
          const SizedBox(height: 8),
          ...items.map((n) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Text('•  $n', style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, height: 1.4)),
              )),
        ],
      ),
    );
  }
}
