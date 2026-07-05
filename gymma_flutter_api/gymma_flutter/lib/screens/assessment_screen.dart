import 'dart:convert';
import 'package:flutter/material.dart';
import '../data/fitos_repository.dart';
import '../theme.dart';

class AssessmentScreen extends StatefulWidget {
  const AssessmentScreen({super.key});

  @override
  State<AssessmentScreen> createState() => _AssessmentScreenState();
}

class _AssessmentScreenState extends State<AssessmentScreen> {
  bool _isSubmitting = false;
  final PageController _pageController = PageController();
  int _currentPage = 0;
  static const int _totalPages = 6;

  final Map<String, dynamic> _answers = {
    // S0: Safety — all false means medically cleared (PAR-Q inverted logic)
    'S0_Q1': false, 'S0_Q2': false, 'S0_Q3': false, 'S0_Q4': false,
    'S0_Q5': false, 'S0_Q7': false,

    // S1: Identity & Body
    'S1_AGE': 25, 'S1_SEX': 'M', 'S1_HEIGHT': 170.0, 'S1_WEIGHT': 70.0,
    'S1_BODY_COMP_GOAL': 'Build muscle',

    // S2: Recovery
    'S2_SLEEP': 7, 'S2_SLEEP_QUALITY': 3, 'S2_STRESS': 'Med',
    'S2_OCCUPATION': 'Light', 'S2_NUTRITION': 'Inconsistent',

    // S3: Training History
    'S3_DURATION': 'Never', 'S3_COMPOUNDS': <String>[], 'S3_PROGRAM': false,
    'S3_FREQUENCY': 0, 'S3_1RM_AWARE': false,

    // S4: Goals
    'S4_PRIMARY': 'General_Health', 'S4_TIMELINE': '12',
    'S4_TARGET_AREAS': <String>[],

    // S5: Availability
    'S5_DAYS': 3, 'S5_TIME': 45, 'S5_GYM_TYPE': 'Commercial',

    // S6: Medical
    'S6_CURRENT_INJURY': false, 'S6_PAST_SURGERY': false, 'S6_PHYSIO': false,

    // S7 & S8: set to null; filtered before submit so optional fields are omitted
    'S7_SQUAT_DEPTH': null, 'S7_OVERHEAD': null, 'S7_HINGE': null,
    'S7_LUNGE': null, 'S7_ROTARY': null,
    'S8_STYLE': null, 'S8_SPLIT': null, 'S8_CARDIO': null, 'S8_RPE': null,
    'S8_DISLIKES': <String>[],
  };

  void _nextPage() {
    if (_currentPage < _totalPages - 1) {
      _pageController.nextPage(
          duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      _submitAssessment();
    }
  }

  void _prevPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
          duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      Navigator.pop(context);
    }
  }

  Future<void> _submitAssessment() async {
    setState(() => _isSubmitting = true);
    try {
      // Remove null optional fields so Zod doesn't reject them
      final payload = Map<String, dynamic>.from(_answers)
        ..removeWhere((k, v) => v == null);

      debugPrint('=== ASSESSMENT PAYLOAD ===');
      debugPrint(const JsonEncoder.withIndent('  ').convert(payload));
      debugPrint('==========================');

      final assessment = await FitosRepository.instance.submitAssessment(payload);
      final assessmentId = assessment['assessmentId'] as String?;
      if (assessmentId == null) throw Exception('No assessmentId in response');

      await FitosRepository.instance.generatePlan({'assessmentId': assessmentId});

      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      debugPrint('Assessment/plan error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Fitos AI Assessment'),
        leading: IconButton(
            icon: const Icon(Icons.arrow_back), onPressed: _prevPage),
        elevation: 0,
        backgroundColor: Colors.white,
      ),
      body: _isSubmitting ? _buildLoadingState() : _buildForm(),
    );
  }

  Widget _buildForm() {
    return Column(
      children: [
        LinearProgressIndicator(
          value: (_currentPage + 1) / _totalPages,
          backgroundColor: AppColors.neutral200,
          color: AppColors.primary500,
          minHeight: 4,
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
          child: Row(
            children: [
              Text(
                'Step ${_currentPage + 1} of $_totalPages',
                style: const TextStyle(color: AppColors.neutral500, fontSize: 13),
              ),
            ],
          ),
        ),
        Expanded(
          child: PageView(
            controller: _pageController,
            physics: const NeverScrollableScrollPhysics(),
            onPageChanged: (i) => setState(() => _currentPage = i),
            children: [
              _buildPage1Identity(),
              _buildPage2Goals(),
              _buildPage3TrainingHistory(),
              _buildPage4Availability(),
              _buildPage5HealthRecovery(),
              _buildPage6MobilityPrefs(),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
          child: SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: _nextPage,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary500,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppRadius.md)),
              ),
              child: Text(
                _currentPage == _totalPages - 1 ? 'Generate My Plan' : 'Continue',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: AppColors.primary500),
          SizedBox(height: 24),
          Text('Fitos AI is analyzing your profile…',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          SizedBox(height: 8),
          Text('Building your optimal routine.',
              style: TextStyle(color: AppColors.neutral500)),
        ],
      ),
    );
  }

  // ─── Page 1: Identity ────────────────────────────────────────────────────
  Widget _buildPage1Identity() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        _sectionHeader('About You', 'Basic info helps calibrate your strength standards.'),
        _buildDropdown('Biological Sex', _answers['S1_SEX'] as String, ['M', 'F', 'Other'],
            (v) => setState(() => _answers['S1_SEX'] = v)),
        _buildIntSlider('Age', 'S1_AGE', 15, 90, unit: 'yrs'),
        _buildIntSlider('Height', 'S1_HEIGHT', 140, 220, unit: 'cm'),
        _buildIntSlider('Weight', 'S1_WEIGHT', 40, 150, unit: 'kg'),
        const SizedBox(height: 8),
        _label('Body Composition Goal'),
        ...[
          ('Lose fat', 'Lose fat'),
          ('Build muscle', 'Build muscle'),
          ('Recomposition (lose fat + gain muscle)', 'Recomposition'),
          ('Maintain current composition', 'Maintain'),
          ('Improve athletic performance', 'Performance'),
        ].map((p) => _radioTile(p.$1, p.$2, 'S1_BODY_COMP_GOAL')),
      ],
    );
  }

  // ─── Page 2: Goals ───────────────────────────────────────────────────────
  Widget _buildPage2Goals() {
    final primary = _answers['S4_PRIMARY'] as String;
    final goals = [
      ('Hypertrophy (Muscle Size)', 'Hypertrophy'),
      ('Strength & Power', 'Strength'),
      ('Muscular Endurance', 'Endurance'),
      ('Athletic Power', 'Power'),
      ('General Health & Fitness', 'General_Health'),
      ('Body Recomposition', 'Recomposition'),
    ];
    final secondaryGoals = goals.where((g) => g.$2 != primary).toList();

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        _sectionHeader('Your Goals', 'Tell us what you want to achieve.'),
        _label('Primary Training Goal'),
        ...goals.map((p) => _radioTile(p.$1, p.$2, 'S4_PRIMARY')),
        const SizedBox(height: 8),
        _label('Secondary Goal (optional)'),
        _radioTile('None', '', 'S4_SECONDARY_DISPLAY'),
        ...secondaryGoals.map((p) => _radioTile(p.$1, p.$2, 'S4_SECONDARY_DISPLAY')),
        const SizedBox(height: 8),
        _label('Target Timeline'),
        Wrap(
          spacing: 10,
          children: ['4', '8', '12', '16', '20+'].map((t) => ChoiceChip(
            label: Text('$t wks'),
            selected: _answers['S4_TIMELINE'] == t,
            selectedColor: AppColors.primary500.withOpacity(0.2),
            onSelected: (_) => setState(() => _answers['S4_TIMELINE'] = t),
          )).toList(),
        ),
        const SizedBox(height: 16),
        _buildMultiSelect(
          'Target Muscle Groups (optional)',
          'S4_TARGET_AREAS',
          ['Arms', 'Chest', 'Back', 'Shoulders', 'Core', 'Legs', 'Glutes', 'Full Body'],
        ),
      ],
    );
  }

  // ─── Page 3: Training History ─────────────────────────────────────────────
  Widget _buildPage3TrainingHistory() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        _sectionHeader('Training History', 'We use this to match exercise complexity to your level.'),
        _buildDropdown(
          'Years of Training Experience',
          _answers['S3_DURATION'] as String,
          ['Never', '<6mo', '6-12mo', '1-2yr', '2-5yr', '5+yr'],
          (v) => setState(() => _answers['S3_DURATION'] = v),
        ),
        _buildMultiSelect(
          'Compound Lifts You Can Perform',
          'S3_COMPOUNDS',
          ['Squat', 'Deadlift', 'Bench Press', 'Overhead Press', 'Pull-up'],
        ),
        _buildIntSlider(
          'Current Training Frequency',
          'S3_FREQUENCY',
          0, 7,
          unit: 'days/wk',
        ),
        const Divider(height: 32),
        SwitchListTile(
          title: const Text('Following a structured program?'),
          subtitle: const Text('A scheduled plan you stick to each week'),
          value: _answers['S3_PROGRAM'] as bool,
          activeColor: AppColors.primary500,
          onChanged: (v) => setState(() => _answers['S3_PROGRAM'] = v),
        ),
        SwitchListTile(
          title: const Text('Do you know your 1-Rep Max (1RM)?'),
          subtitle: const Text('The maximum weight you can lift for one rep'),
          value: _answers['S3_1RM_AWARE'] as bool,
          activeColor: AppColors.primary500,
          onChanged: (v) => setState(() => _answers['S3_1RM_AWARE'] = v),
        ),
      ],
    );
  }

  // ─── Page 4: Availability ─────────────────────────────────────────────────
  Widget _buildPage4Availability() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        _sectionHeader('Your Schedule', 'We build your split around your available time.'),
        _buildIntSlider('Days Available per Week', 'S5_DAYS', 1, 7, unit: 'days'),
        _buildIntSlider('Session Length', 'S5_TIME', 15, 120, unit: 'min'),
        const SizedBox(height: 8),
        _label('Gym Type'),
        _radioTile('Commercial Gym (full equipment)', 'Commercial', 'S5_GYM_TYPE'),
        _radioTile('Home Gym (limited equipment)', 'Home', 'S5_GYM_TYPE'),
        _radioTile('Outdoor / Calisthenics Park', 'Outdoor', 'S5_GYM_TYPE'),
      ],
    );
  }

  // ─── Page 5: Health & Recovery ────────────────────────────────────────────
  Widget _buildPage5HealthRecovery() {
    final hasInjury = _answers['S6_CURRENT_INJURY'] as bool;
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        _sectionHeader('Health & Recovery', 'Honest answers help us keep your plan safe.'),
        _buildIntSlider('Average Sleep per Night', 'S2_SLEEP', 3, 12, unit: 'hrs'),
        _buildIntSlider('Sleep Quality', 'S2_SLEEP_QUALITY', 1, 5,
            unit: '/5', valueLabels: const {1: 'Poor', 3: 'OK', 5: 'Great'}),
        _buildDropdown(
          'Nutrition Quality',
          _answers['S2_NUTRITION'] as String,
          ['Poor', 'Inconsistent', 'Consistent', 'Strict'],
          (v) => setState(() => _answers['S2_NUTRITION'] = v),
        ),
        _label('Daily Stress Level'),
        Row(children: [
          _compactChip('Low 😌', 'Low', 'S2_STRESS'),
          const SizedBox(width: 8),
          _compactChip('Medium 😤', 'Med', 'S2_STRESS'),
          const SizedBox(width: 8),
          _compactChip('High 😰', 'High', 'S2_STRESS'),
        ]),
        const SizedBox(height: 16),
        _buildDropdown(
          'Occupation Activity Level',
          _answers['S2_OCCUPATION'] as String,
          ['Sedentary', 'Light', 'Active', 'Very_Active'],
          (v) => setState(() => _answers['S2_OCCUPATION'] = v),
          displayMap: {
            'Sedentary': 'Sedentary (desk job, mostly sitting)',
            'Light': 'Light (mostly standing/walking)',
            'Active': 'Active (physical work)',
            'Very_Active': 'Very Active (heavy physical work)',
          },
        ),
        const Divider(height: 32),
        _label('Medical & Injury'),
        SwitchListTile(
          title: const Text('Currently injured?'),
          value: hasInjury,
          activeColor: AppColors.primary500,
          onChanged: (v) {
            setState(() {
              _answers['S6_CURRENT_INJURY'] = v;
              if (!v) {
                _answers.remove('S6_INJURY_LIST');
                _answers.remove('S6_PAIN_SCALE');
              } else {
                _answers['S6_INJURY_LIST'] = <String>[];
                _answers['S6_PAIN_SCALE'] = 3;
              }
            });
          },
        ),
        if (hasInjury) ...[
          _buildMultiSelect(
            'Injured Areas',
            'S6_INJURY_LIST',
            ['Shoulder', 'Elbow', 'Wrist', 'Lower Back', 'Upper Back',
             'Hip', 'Knee', 'Ankle', 'Neck', 'Other'],
          ),
          _buildIntSlider('Pain Level (0 = none, 10 = severe)', 'S6_PAIN_SCALE', 0, 10, unit: '/10'),
        ],
        SwitchListTile(
          title: const Text('Had surgery in the past year?'),
          value: _answers['S6_PAST_SURGERY'] as bool,
          activeColor: AppColors.primary500,
          onChanged: (v) => setState(() => _answers['S6_PAST_SURGERY'] = v),
        ),
        SwitchListTile(
          title: const Text('Currently seeing a physiotherapist?'),
          value: _answers['S6_PHYSIO'] as bool,
          activeColor: AppColors.primary500,
          onChanged: (v) => setState(() => _answers['S6_PHYSIO'] = v),
        ),
        SwitchListTile(
          title: const Text('Medically cleared to exercise'),
          subtitle: const Text('I have no known conditions requiring medical supervision'),
          value: !(_answers['S0_Q2'] as bool),
          activeColor: AppColors.primary500,
          onChanged: (v) {
            setState(() {
              final blocked = !v;
              _answers['S0_Q1'] = blocked;
              _answers['S0_Q2'] = blocked;
              _answers['S0_Q3'] = blocked;
              _answers['S0_Q4'] = blocked;
              _answers['S0_Q5'] = blocked;
              _answers['S0_Q7'] = blocked;
            });
          },
        ),
      ],
    );
  }

  // ─── Page 6: Mobility & Preferences ──────────────────────────────────────
  Widget _buildPage6MobilityPrefs() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        _sectionHeader('Mobility & Preferences',
            'Optional — improves exercise selection and plan style.'),
        _label('Can you squat below parallel?'),
        _inlineChips('S7_SQUAT_DEPTH',
            ['Yes', 'No', 'Only with raised heels']),
        const SizedBox(height: 8),
        _label('Can you reach arms fully overhead?'),
        _inlineChips('S7_OVERHEAD', ['Yes', 'No', 'Partial']),
        const SizedBox(height: 8),
        _label('Hip hinge (deadlift-style movement)?'),
        _inlineChips('S7_HINGE', ['Yes', 'No', 'Almost']),
        const SizedBox(height: 8),
        _label('Single-leg lunge stable?'),
        _inlineChips('S7_LUNGE', ['Yes', 'No', 'Unstable']),
        const SizedBox(height: 8),
        _label('Rotational movements (twisting, core rotation)?'),
        _inlineChips('S7_ROTARY', ['Yes', 'No', 'Limited']),
        const Divider(height: 32),
        _label('Preferred Training Style'),
        _inlineChips('S8_STYLE',
            ['Free Weights', 'Machines', 'Calisthenics', 'Mixed']),
        const SizedBox(height: 8),
        _label('Preferred Split Style'),
        _inlineChips('S8_SPLIT',
            ['Full Body', 'Upper/Lower', 'Push/Pull/Legs', 'Bro Split']),
        const SizedBox(height: 8),
        _label('Cardio Preference'),
        _inlineChips('S8_CARDIO', ['None', 'Low', 'Moderate', 'High']),
        const SizedBox(height: 8),
        _label('Intensity Tracking Method'),
        _inlineChips('S8_RPE', ['RPE', '%1RM', 'Neither']),
      ],
    );
  }

  // ─── Shared Widgets ───────────────────────────────────────────────────────

  Widget _sectionHeader(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(subtitle,
            style: const TextStyle(color: AppColors.neutral500, fontSize: 14)),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _label(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
    );
  }

  Widget _buildIntSlider(
    String label,
    String key,
    num min,
    num max, {
    String unit = '',
    Map<int, String>? valueLabels,
  }) {
    final current = (_answers[key] as num?)?.toInt() ?? min.toInt();
    final displayLabel = valueLabels?[current] ?? '';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(label,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          RichText(
            text: TextSpan(children: [
              TextSpan(
                  text: '$current',
                  style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: AppColors.primary500)),
              TextSpan(
                  text: ' $unit${displayLabel.isNotEmpty ? ' ($displayLabel)' : ''}',
                  style: const TextStyle(
                      color: AppColors.neutral500, fontSize: 13)),
            ]),
          ),
        ]),
        Slider(
          value: current.toDouble(),
          min: min.toDouble(),
          max: max.toDouble(),
          divisions: (max - min).toInt(),
          activeColor: AppColors.primary500,
          onChanged: (v) => setState(() => _answers[key] = v.round()),
        ),
        const SizedBox(height: 12),
      ],
    );
  }

  Widget _buildDropdown(
    String label,
    String value,
    List<String> options,
    Function(String) onChanged, {
    Map<String, String>? displayMap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label(label),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.neutral200),
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: options.contains(value) ? value : options.first,
              items: options
                  .map((o) => DropdownMenuItem(
                      value: o,
                      child: Text(displayMap?[o] ?? o)))
                  .toList(),
              onChanged: (v) {
                if (v != null) onChanged(v);
              },
            ),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _radioTile(String label, String value, String key) {
    // For secondary goal, handle the empty-string "None" option
    final isSecondary = key == 'S4_SECONDARY_DISPLAY';
    String? currentSecondary = _answers['S4_SECONDARY'] as String?;
    final isSelected = isSecondary
        ? (value.isEmpty ? currentSecondary == null : currentSecondary == value)
        : _answers[key] == value;

    return GestureDetector(
      onTap: () {
        setState(() {
          if (isSecondary) {
            _answers['S4_SECONDARY'] = value.isEmpty ? null : value;
          } else {
            _answers[key] = value;
            // If primary goal changed, clear secondary if they now match
            if (key == 'S4_PRIMARY' && _answers['S4_SECONDARY'] == value) {
              _answers['S4_SECONDARY'] = null;
            }
          }
        });
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary500.withOpacity(0.08) : Colors.white,
          border: Border.all(
            color: isSelected ? AppColors.primary500 : AppColors.neutral200,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSelected ? AppColors.primary500 : AppColors.neutral400,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  color: isSelected ? AppColors.primary700 : AppColors.neutral700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _compactChip(String label, String value, String key) {
    final isSelected = _answers[key] == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _answers[key] = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary500 : Colors.white,
            border: Border.all(
                color: isSelected ? AppColors.primary500 : AppColors.neutral200),
            borderRadius: BorderRadius.circular(AppRadius.sm),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isSelected ? Colors.white : AppColors.neutral700,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }

  // Horizontal wrap of chips for a single-select enum field (S7, S8)
  Widget _inlineChips(String key, List<String> options) {
    final selected = _answers[key] as String?;
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: options.map((opt) {
          final active = selected == opt;
          return GestureDetector(
            onTap: () => setState(() {
              _answers[key] = active ? null : opt; // toggle off = null (omitted)
            }),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: active ? AppColors.primary500 : Colors.white,
                border: Border.all(
                    color: active ? AppColors.primary500 : AppColors.neutral200),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                opt,
                style: TextStyle(
                  color: active ? Colors.white : AppColors.neutral700,
                  fontWeight: active ? FontWeight.w600 : FontWeight.normal,
                  fontSize: 13,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildMultiSelect(
      String label, String key, List<String> options) {
    final selected = (_answers[key] as List?)?.cast<String>() ?? <String>[];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _label(label),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.map((opt) {
            final active = selected.contains(opt);
            return FilterChip(
              label: Text(opt),
              selected: active,
              selectedColor: AppColors.primary500.withOpacity(0.15),
              checkmarkColor: AppColors.primary500,
              labelStyle: TextStyle(
                color: active ? AppColors.primary700 : AppColors.neutral700,
                fontWeight: active ? FontWeight.w600 : FontWeight.normal,
              ),
              onSelected: (v) {
                setState(() {
                  final list = List<String>.from(selected);
                  if (v) {
                    list.add(opt);
                  } else {
                    list.remove(opt);
                  }
                  _answers[key] = list;
                });
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}
