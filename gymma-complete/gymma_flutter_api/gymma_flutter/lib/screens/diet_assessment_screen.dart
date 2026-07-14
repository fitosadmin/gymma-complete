import 'package:flutter/material.dart';
import '../data/api_client.dart';
import '../data/diet_repository.dart';
import '../theme.dart';
import '../widgets/gradient_button.dart';
import '../widgets/branded_expansion_tile.dart';
import '../widgets/diet_plan_view.dart' show kGoalLabels, kActivityLabels, kDietaryPatternLabels;

/// Diet calculator intake form. Unlike the Workout assessment (a 9-section
/// branching wizard driven by an Experience-Score gate), diet_suggestion's
/// schema is flat with no server-side conditional logic — so this is a
/// single scrolling form rather than a multi-step wizard, with the optional/
/// advanced fields tucked into a collapsed BrandedExpansionTile so the
/// primary path (6 required fields) stays fast.
class DietAssessmentScreen extends StatefulWidget {
  const DietAssessmentScreen({super.key});

  @override
  State<DietAssessmentScreen> createState() => _DietAssessmentScreenState();
}

class _DietAssessmentScreenState extends State<DietAssessmentScreen> {
  bool _isSubmitting = false;
  bool _dirty = false;
  String? _error;

  final Map<String, dynamic> _answers = {
    'age': 28,
    'gender': 'male',
    'weightKg': 70,
    'heightCm': 170,
    'goal': 'maintain',
    'activityKey': 'moderately_active',
    'dietaryPattern': 'omnivore',
  };

  bool _knowsBodyFat = false;
  final _labelCtrl = TextEditingController();

  static const _exerciseTypeIcons = {
    'resistance': Icons.fitness_center_rounded,
    'cardio': Icons.directions_run_rounded,
    'mixed': Icons.all_inclusive_rounded,
    'none': Icons.self_improvement_rounded,
  };

  static const _exerciseTypeLabels = {
    'resistance': 'Resistance Training',
    'cardio': 'Cardio',
    'mixed': 'Mixed',
    'none': 'None',
  };

  static const _medicalConditionLabels = {
    'diabetes_type2': 'Type 2 Diabetes',
    'kidney_disease': 'Kidney Disease',
    'hypothyroidism': 'Hypothyroidism',
    'hypertension': 'Hypertension',
    'pcos': 'PCOS',
    'celiac': 'Celiac Disease',
  };

  static const _allergyLabels = {
    'dairy': 'Dairy',
    'eggs': 'Eggs',
    'wheat': 'Wheat',
    'peanuts': 'Peanuts',
    'tree_nuts': 'Tree Nuts',
    'soy': 'Soy',
    'fish': 'Fish',
    'shellfish': 'Shellfish',
  };

  static const _cookingTimeOptions = {
    'under_15_min': 'Under 15 min',
    'about_30_min': '~30 min',
    'flexible': 'Flexible / 1hr+',
  };

  static const _cuisineOptions = [
    'Indian', 'Mediterranean', 'Asian', 'Mexican', 'Continental', 'Middle Eastern', 'American',
  ];

  @override
  void dispose() {
    _labelCtrl.dispose();
    super.dispose();
  }

  void _touch(void Function() fn) => setState(() {
        fn();
        _dirty = true;
      });

  Future<bool> _confirmDiscard() async {
    if (!_dirty) return true;
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Discard this plan?'),
        content: const Text("You'll lose what you've entered so far."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep Editing')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Discard', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  Future<void> _submit() async {
    if (_isSubmitting) return; // guards a rapid double-tap firing two calculate requests
    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    final medicalConditions = (_answers['medicalConditions'] as List?)?.cast<String>() ?? const <String>[];
    final foodAllergies = (_answers['foodAllergies'] as List?)?.cast<String>() ?? const <String>[];
    final cuisinePreferences = (_answers['cuisinePreferences'] as List?)?.cast<String>() ?? const <String>[];

    final payload = <String, dynamic>{
      'age': _answers['age'],
      'gender': _answers['gender'],
      'weightKg': (_answers['weightKg'] as num).toDouble(),
      'heightCm': (_answers['heightCm'] as num).toDouble(),
      'goal': _answers['goal'],
      'activityKey': _answers['activityKey'],
      'dietaryPattern': _answers['dietaryPattern'],
      if (_knowsBodyFat && _answers['bodyFatPercent'] != null)
        'bodyFatPercent': (_answers['bodyFatPercent'] as num).toDouble(),
      if (_answers['exerciseType'] != null) 'exerciseType': _answers['exerciseType'],
      if (medicalConditions.isNotEmpty) 'medicalConditions': medicalConditions,
      if (foodAllergies.isNotEmpty) 'foodAllergies': foodAllergies,
      if (_answers['cookingTime'] != null) 'cookingTime': _answers['cookingTime'],
      if (_answers['budgetTier'] != null) 'budgetTier': _answers['budgetTier'],
      if (cuisinePreferences.isNotEmpty) 'cuisinePreferences': cuisinePreferences,
      if (_labelCtrl.text.trim().isNotEmpty) 'label': _labelCtrl.text.trim(),
    };

    try {
      await DietRepository.instance.calculate(payload);
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e is ApiException ? e.message : 'Something went wrong. Please try again.';
      });
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        if (await _confirmDiscard() && mounted) Navigator.pop(context);
      },
      child: Scaffold(
        backgroundColor: AppColors.paperBackground,
        appBar: AppBar(
          title: const Text('Diet Plan', style: TextStyle(fontWeight: FontWeight.w700)),
        ),
        body: _isSubmitting ? _buildLoadingState() : _buildForm(),
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircularProgressIndicator(color: AppColors.brandCopper),
          SizedBox(height: 20),
          Text('Crunching your numbers…', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          SizedBox(height: 6),
          Text('Calculating your calorie and macro targets.',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        if (_error != null) ...[
          Container(
            padding: const EdgeInsets.all(14),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: AppColors.error.withOpacity(0.08),
              border: Border.all(color: AppColors.error.withOpacity(0.4)),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Row(children: [
              const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13))),
            ]),
          ),
        ],
        _sectionLabel('ABOUT YOU', 'Body Basics'),
        const SizedBox(height: 14),
        _segmented('Gender', 'gender', const {'male': 'Male', 'female': 'Female', 'other': 'Other'}),
        const SizedBox(height: 14),
        _intSlider('Age', 'age', 13, 90, unit: 'yrs'),
        _intSlider('Weight', 'weightKg', 30, 180, unit: 'kg'),
        _intSlider('Height', 'heightCm', 120, 220, unit: 'cm'),
        const SizedBox(height: 10),
        _sectionLabel('WHAT YOU\'RE AFTER', 'Goal'),
        const SizedBox(height: 14),
        ...kGoalLabels.entries.map((e) => _radioTile(
              e.value,
              e.key,
              'goal',
              icon: switch (e.key) {
                'lose_fat' => Icons.trending_down_rounded,
                'build_muscle' => Icons.trending_up_rounded,
                _ => Icons.balance_rounded,
              },
            )),
        const SizedBox(height: 10),
        _sectionLabel('HOW MUCH YOU MOVE', 'Activity Level'),
        const SizedBox(height: 14),
        ...kActivityLabels.entries.map((e) => _radioTile(e.value, e.key, 'activityKey')),
        const SizedBox(height: 10),
        _sectionLabel('HOW YOU EAT', 'Dietary Pattern'),
        const SizedBox(height: 14),
        ...kDietaryPatternLabels.entries.map((e) => _radioTile(e.value, e.key, 'dietaryPattern')),
        const SizedBox(height: 20),
        BrandedExpansionTile(
          title: const Text('Optional Details', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
          subtitle: const Text('Body fat, medical conditions, allergies, cuisine…', style: TextStyle(fontSize: 12)),
          children: [_buildOptionalSection()],
        ),
        const SizedBox(height: 28),
        GradientButton(
          label: 'Calculate My Plan',
          icon: Icons.auto_awesome_rounded,
          onPressed: _submit,
        ),
      ],
    );
  }

  Widget _buildOptionalSection() {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            value: _knowsBodyFat,
            activeColor: AppColors.brandCopper,
            title: const Text('I know my body fat %', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            onChanged: (v) => _touch(() {
              _knowsBodyFat = v;
              if (v) _answers['bodyFatPercent'] ??= 20;
            }),
          ),
          if (_knowsBodyFat) _intSlider('Body Fat %', 'bodyFatPercent', 3, 60, unit: '%'),
          const SizedBox(height: 8),
          _label('Exercise Type'),
          ..._exerciseTypeLabels.entries.map(
            (e) => _radioTile(e.value, e.key, 'exerciseType', icon: _exerciseTypeIcons[e.key]),
          ),
          const SizedBox(height: 12),
          _multiSelect('Medical Conditions', 'medicalConditions', _medicalConditionLabels),
          const SizedBox(height: 8),
          _multiSelect('Food Allergies', 'foodAllergies', _allergyLabels),
          const SizedBox(height: 8),
          _label('Cooking Time'),
          ..._cookingTimeOptions.entries.map((e) => _radioTile(e.value, e.key, 'cookingTime')),
          const SizedBox(height: 12),
          _label('Budget'),
          ...const {'economy': 'Economy', 'moderate': 'Moderate', 'premium': 'Premium'}
              .entries
              .map((e) => _radioTile(e.value, e.key, 'budgetTier')),
          const SizedBox(height: 12),
          _label('Cuisine Preferences'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _cuisineOptions.map((c) {
              final selected = ((_answers['cuisinePreferences'] as List?)?.cast<String>() ?? const []).contains(c);
              return FilterChip(
                label: Text(c),
                selected: selected,
                selectedColor: AppColors.brandCopper.withOpacity(0.15),
                checkmarkColor: AppColors.brandCopper,
                labelStyle: TextStyle(
                  color: selected ? AppColors.brandCopper : AppColors.textSecondary,
                  fontWeight: selected ? FontWeight.w700 : FontWeight.normal,
                ),
                onSelected: (v) => _touch(() {
                  final list = List<String>.from((_answers['cuisinePreferences'] as List?)?.cast<String>() ?? const []);
                  v ? list.add(c) : list.remove(c);
                  _answers['cuisinePreferences'] = list;
                }),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
          _label('Plan Name (optional)'),
          TextField(
            controller: _labelCtrl,
            maxLength: 100,
            onChanged: (_) => _dirty = true,
            decoration: InputDecoration(
              hintText: 'e.g. Summer Cut',
              isDense: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
            ),
          ),
        ],
      ),
    );
  }

  // ── Reusable field builders (mirror assessment_screen.dart's patterns) ──

  Widget _sectionLabel(String eyebrow, String title) => Column(
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

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(text, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: AppColors.textSecondary)),
      );

  Widget _intSlider(String label, String key, num min, num max, {String unit = ''}) {
    final current = (_answers[key] as num?)?.toInt() ?? min.toInt();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          RichText(
            text: TextSpan(children: [
              TextSpan(
                  text: '$current',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.brandCopper)),
              TextSpan(text: ' $unit', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
            ]),
          ),
        ]),
        Slider(
          value: current.toDouble().clamp(min.toDouble(), max.toDouble()),
          min: min.toDouble(),
          max: max.toDouble(),
          divisions: (max - min).toInt(),
          activeColor: AppColors.brandCopper,
          onChanged: (v) => _touch(() => _answers[key] = v.round()),
        ),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _segmented(String label, String key, Map<String, String> options) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label(label),
        Row(
          children: options.entries.map((e) {
            final selected = _answers[key] == e.key;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.only(right: 8),
                child: GestureDetector(
                  onTap: () => _touch(() => _answers[key] = e.key),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: selected ? AppColors.brandCopper : AppColors.surface,
                      borderRadius: BorderRadius.circular(AppRadius.full),
                      border: Border.all(color: selected ? AppColors.brandCopper : AppColors.divider),
                    ),
                    child: Text(
                      e.value,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: selected ? Colors.white : AppColors.textSecondary,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _radioTile(String label, String value, String key, {IconData? icon}) {
    final isSelected = _answers[key] == value;
    return GestureDetector(
      onTap: () => _touch(() => _answers[key] = value),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.brandCopper.withOpacity(0.08) : AppColors.surface,
          border: Border.all(color: isSelected ? AppColors.brandCopper : AppColors.divider, width: isSelected ? 2 : 1),
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSelected ? AppColors.brandCopper : AppColors.textSecondary,
              size: 20,
            ),
            if (icon != null) ...[
              const SizedBox(width: 10),
              Icon(icon, size: 18, color: isSelected ? AppColors.brandCopper : AppColors.textSecondary),
            ],
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.normal,
                  color: isSelected ? AppColors.textPrimary : AppColors.textSecondary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _multiSelect(String label, String key, Map<String, String> options) {
    final selected = (_answers[key] as List?)?.cast<String>() ?? const <String>[];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label(label),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.entries.map((e) {
            final active = selected.contains(e.key);
            return FilterChip(
              label: Text(e.value),
              selected: active,
              selectedColor: AppColors.brandCopper.withOpacity(0.15),
              checkmarkColor: AppColors.brandCopper,
              labelStyle: TextStyle(
                color: active ? AppColors.brandCopper : AppColors.textSecondary,
                fontWeight: active ? FontWeight.w700 : FontWeight.normal,
              ),
              onSelected: (v) => _touch(() {
                final list = List<String>.from(selected);
                v ? list.add(e.key) : list.remove(e.key);
                _answers[key] = list;
              }),
            );
          }).toList(),
        ),
      ],
    );
  }
}
