import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../data/api_client.dart';
import '../data/reviews_repository.dart';
import '../models/gymma_review.dart';
import '../theme.dart';
import '../widgets/gradient_button.dart';

const _fivePointValues = [0, 25, 50, 75, 100];
const _likert5Labels = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];
const _overall5Labels = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
const _frequency5Labels = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'];
const _binary3Labels = ['No', 'Somewhat', 'Yes'];
const _binary3Values = [0, 50, 100];

const _dimensionPageLabels = <String, String>{
  ...gymmaDimensionLabels,
  'meta': 'A couple more things',
};

/// "Rate this gym" — a short poll, one page per dimension, feeding
/// gymma-reviews-api. Reachable from Gym Detail for logged-in members;
/// the backend is the source of truth on membership eligibility, this
/// screen just surfaces whatever it says clearly.
class GymReviewPollScreen extends StatefulWidget {
  final String gymId;
  final String gymName;
  const GymReviewPollScreen({super.key, required this.gymId, required this.gymName});

  @override
  State<GymReviewPollScreen> createState() => _GymReviewPollScreenState();
}

class _GymReviewPollScreenState extends State<GymReviewPollScreen> {
  bool _loading = true;
  String? _loadError;
  List<MapEntry<String, List<PollQuestion>>> _groups = [];
  final Map<int, int> _answers = {};
  final PageController _pageController = PageController();
  int _currentPage = 0;
  final DateTime _startTime = DateTime.now();

  bool _isSubmitting = false;
  bool _submitted = false;
  String _resultMessage = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final questions = await ReviewsRepository.instance.getPoll(widget.gymId);
      final groups = <String, List<PollQuestion>>{};
      for (final q in questions) {
        groups.putIfAbsent(q.dimension, () => []).add(q);
      }
      if (mounted) {
        setState(() {
          _groups = groups.entries.toList();
          _loading = false;
        });
      }
    } on ApiException catch (e) {
      if (mounted) setState(() { _loadError = e.message; _loading = false; });
    } catch (_) {
      if (mounted) setState(() { _loadError = 'Could not load the rating form.'; _loading = false; });
    }
  }

  bool _pageComplete(int page) =>
      _groups[page].value.every((q) => _answers.containsKey(q.questionNumber));

  void _nextPage() {
    if (_currentPage < _groups.length - 1) {
      _pageController.nextPage(
          duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      _submit();
    }
  }

  Future<void> _handleBack() async {
    if (_submitted) {
      Navigator.pop(context, true);
      return;
    }
    if (_currentPage > 0) {
      _pageController.previousPage(
          duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
      return;
    }
    if (_answers.isEmpty) {
      Navigator.pop(context, false);
      return;
    }
    final discard = await _confirmDiscard();
    if (discard && mounted) Navigator.pop(context, false);
  }

  Future<bool> _confirmDiscard() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Discard this rating?'),
        content: const Text('Your answers so far won\'t be saved.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep going')),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Discard'),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  Future<void> _submit() async {
    setState(() => _isSubmitting = true);
    final elapsedMs = DateTime.now().difference(_startTime).inMilliseconds;
    try {
      final result = await ReviewsRepository.instance.submitPoll(
        gymId: widget.gymId,
        responses: _answers,
        submissionTimeMs: elapsedMs,
      );
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
        _submitted = true;
        _resultMessage = (result['preliminary_impact'] as String?) ??
            'Your rating has been recorded.';
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      if (e.statusCode == 403 || e.statusCode == 409) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Text(e.statusCode == 403 ? 'Membership required' : 'Already rated'),
            content: Text(e.message),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.message), backgroundColor: AppColors.error));
      }
    } catch (_) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Something went wrong. Please try again.'),
          backgroundColor: AppColors.error));
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _handleBack();
      },
      child: Scaffold(
        backgroundColor: AppColors.paperBackground,
        appBar: AppBar(
          title: Text('Rate ${widget.gymName}',
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 17)),
          leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: _handleBack),
          backgroundColor: AppColors.paperBackground,
          elevation: 0,
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _loadError != null
                ? _errorView()
                : _submitted
                    ? _successView()
                    : _pollView(),
      ),
    );
  }

  Widget _errorView() => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off, size: 44, color: AppColors.neutral300),
              const SizedBox(height: 12),
              Text(_loadError!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.neutral500)),
              const SizedBox(height: 16),
              FilledButton(onPressed: _load, child: const Text('Retry')),
            ],
          ),
        ),
      );

  Widget _successView() => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                    color: AppColors.success.withOpacity(0.12), shape: BoxShape.circle),
                child: const Icon(Icons.check_rounded, color: AppColors.success, size: 42),
              ),
              const SizedBox(height: 24),
              const Text('Thanks for rating this gym!',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
              const SizedBox(height: 10),
              Text(_resultMessage,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppColors.textSecondary, height: 1.5)),
              const SizedBox(height: 28),
              GradientButton(
                label: 'Done',
                onPressed: () => Navigator.pop(context, true),
              ),
            ],
          ),
        ),
      );

  Widget _pollView() {
    final total = _groups.length;
    final isLastPage = _currentPage == total - 1;
    final complete = _pageComplete(_currentPage);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 8),
          child: Row(
            children: [
              for (int i = 0; i < total; i++) ...[
                Expanded(
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    height: 5,
                    decoration: BoxDecoration(
                      color: i <= _currentPage ? AppColors.brandCopper : AppColors.divider,
                      borderRadius: BorderRadius.circular(AppRadius.full),
                    ),
                  ),
                ),
                if (i != total - 1) const SizedBox(width: 5),
              ],
            ],
          ),
        ),
        Expanded(
          child: PageView(
            controller: _pageController,
            physics: const NeverScrollableScrollPhysics(),
            onPageChanged: (i) => setState(() => _currentPage = i),
            children: [for (final g in _groups) _dimensionPage(g.key, g.value)],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
          child: GradientButton(
            label: isLastPage ? 'Submit rating' : 'Continue',
            icon: isLastPage ? Icons.check_rounded : Icons.arrow_forward_rounded,
            isLoading: _isSubmitting,
            onPressed: complete && !_isSubmitting ? _nextPage : null,
          ),
        ),
      ],
    );
  }

  Widget _dimensionPage(String dimension, List<PollQuestion> questions) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
      children: [
        Text(_dimensionPageLabels[dimension] ?? dimension,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
        const SizedBox(height: 4),
        Text('${questions.length} question${questions.length == 1 ? '' : 's'}',
            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
        const SizedBox(height: 20),
        for (final q in questions) _questionCard(q),
      ],
    );
  }

  Widget _questionCard(PollQuestion q) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(q.questionText,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, height: 1.35)),
          const SizedBox(height: 14),
          _responseWidget(q),
        ],
      ),
    );
  }

  void _answer(int questionNumber, int value) {
    HapticFeedback.selectionClick();
    setState(() => _answers[questionNumber] = value);
  }

  Widget _responseWidget(PollQuestion q) {
    switch (q.responseType) {
      case 'nps11':
        return _npsSelector(q.questionNumber);
      case 'binary3':
        return _choiceRow(q.questionNumber, _binary3Labels, _binary3Values);
      case 'likert5':
        return _fivePointList(q.questionNumber, _likert5Labels);
      case 'overall5':
        return _fivePointList(q.questionNumber, _overall5Labels);
      case 'frequency5':
        return _fivePointList(q.questionNumber, _frequency5Labels);
      default:
        return _fivePointList(q.questionNumber, _likert5Labels);
    }
  }

  Widget _npsSelector(int questionNumber) {
    final selected = _answers[questionNumber];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            for (int i = 0; i <= 10; i++)
              GestureDetector(
                onTap: () => _answer(questionNumber, i * 10),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  width: 32,
                  height: 32,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: selected == i * 10 ? AppColors.brandCopper : AppColors.paperBackground,
                    shape: BoxShape.circle,
                    border: Border.all(
                        color: selected == i * 10 ? AppColors.brandCopper : AppColors.divider),
                  ),
                  child: Text('$i',
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: selected == i * 10 ? Colors.white : AppColors.textSecondary)),
                ),
              ),
          ],
        ),
        const SizedBox(height: 6),
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Not likely', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
            Text('Very likely', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
          ],
        ),
      ],
    );
  }

  Widget _choiceRow(int questionNumber, List<String> labels, List<int> values) {
    final selected = _answers[questionNumber];
    return Row(
      children: [
        for (int i = 0; i < labels.length; i++) ...[
          if (i != 0) const SizedBox(width: 8),
          Expanded(
            child: GestureDetector(
              onTap: () => _answer(questionNumber, values[i]),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: selected == values[i] ? AppColors.brandCopper : AppColors.paperBackground,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  border: Border.all(
                      color: selected == values[i] ? AppColors.brandCopper : AppColors.divider),
                ),
                child: Text(labels[i],
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: selected == values[i] ? Colors.white : AppColors.textPrimary)),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _fivePointList(int questionNumber, List<String> labels) {
    final selected = _answers[questionNumber];
    return Column(
      children: [
        for (int i = 0; i < labels.length; i++) ...[
          if (i != 0) const SizedBox(height: 8),
          GestureDetector(
            onTap: () => _answer(questionNumber, _fivePointValues[i]),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: selected == _fivePointValues[i]
                    ? AppColors.brandCopper.withOpacity(0.08)
                    : AppColors.paperBackground,
                borderRadius: BorderRadius.circular(AppRadius.md),
                border: Border.all(
                  color: selected == _fivePointValues[i]
                      ? AppColors.brandCopper
                      : AppColors.divider,
                  width: selected == _fivePointValues[i] ? 1.6 : 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    selected == _fivePointValues[i]
                        ? Icons.radio_button_checked
                        : Icons.radio_button_off,
                    size: 18,
                    color: selected == _fivePointValues[i]
                        ? AppColors.brandCopper
                        : AppColors.neutral400,
                  ),
                  const SizedBox(width: 10),
                  Text(labels[i],
                      style: TextStyle(
                          fontSize: 13.5,
                          fontWeight: selected == _fivePointValues[i]
                              ? FontWeight.w700
                              : FontWeight.w500,
                          color: AppColors.textPrimary)),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}
