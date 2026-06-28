import 'package:flutter/material.dart';
import '../data/api_client.dart';
import '../data/gym_repository.dart';
import '../theme.dart';
import 'owner_dashboard_screen.dart';

class PartnerScreen extends StatefulWidget {
  const PartnerScreen({super.key});
  @override
  State<PartnerScreen> createState() => _PartnerScreenState();
}

class _PartnerScreenState extends State<PartnerScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _gym = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _area = TextEditingController();
  bool _submitted = false;
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_name, _gym, _phone, _email, _area]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await GymRepository.instance.createDemoRequest(
        name: _name.text.trim(),
        phone: _phone.text.trim(),
        email: _email.text.trim(),
        gymName: _gym.text.trim(),
        area: _area.text,
      );
      if (mounted) setState(() => _submitted = true);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) setState(() => _error = 'Could not send. Please try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutral0,
      appBar: AppBar(title: const Text('Partner with us')),
      body: _submitted ? _success() : _formView(),
    );
  }

  Widget _formView() => ListView(
        padding: const EdgeInsets.all(20),
        children: [
          const Text('List your gym on Gymma',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, height: 1.2)),
          const SizedBox(height: 8),
          const Text(
              'Reach thousands of members searching for gyms near them. Tell us about your gym and our team will reach out to set up your profile.',
              style: TextStyle(color: AppColors.neutral500, height: 1.5)),
          const SizedBox(height: 24),
          Form(
            key: _form,
            child: Column(children: [
              _field(_name, 'Your name', 'Enter your name'),
              _field(_gym, 'Gym name', 'Enter your gym name'),
              _field(_phone, 'Phone number', 'Enter a phone number',
                  keyboard: TextInputType.phone,
                  validator: (v) =>
                      (v == null || !RegExp(r'^[6-9]\d{9}$').hasMatch(v.trim()))
                          ? 'Enter a valid 10-digit mobile number'
                          : null),
              _field(_email, 'Email', 'Enter your email',
                  keyboard: TextInputType.emailAddress,
                  validator: (v) =>
                      (v == null || !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v.trim()))
                          ? 'Enter a valid email'
                          : null),
              _field(_area, 'Area / locality', 'Enter your area'),
              if (_error != null) ...[
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(_error!, style: const TextStyle(color: Colors.red)),
                ),
                const SizedBox(height: 8),
              ],
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                      backgroundColor: AppColors.primary500,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.md))),
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white))
                      : const Text('Request a demo',
                          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                ),
              ),
            ]),
          ),
        ],
      );

  Widget _field(TextEditingController c, String label, String error,
          {TextInputType? keyboard, String? Function(String?)? validator}) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: TextFormField(
          controller: c,
          keyboardType: keyboard,
          validator: validator ??
              (v) => (v == null || v.trim().isEmpty) ? error : null,
          decoration: InputDecoration(
            labelText: label,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
          ),
        ),
      );

  Widget _success() => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                height: 72,
                width: 72,
                decoration: const BoxDecoration(
                    color: AppColors.secondary50, shape: BoxShape.circle),
                child: const Icon(Icons.check_rounded, color: AppColors.secondary700, size: 40),
              ),
              const SizedBox(height: 20),
              Text("Thanks, ${_name.text.trim().split(' ').first}!",
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
              const SizedBox(height: 8),
              const Text(
                  'Your request has been received. Our team will reach out shortly to get your gym listed.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.neutral500, height: 1.5)),
              const SizedBox(height: 24),
              OutlinedButton(
                onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const OwnerDashboardScreen())),
                child: const Text('Preview owner dashboard'),
              ),
            ],
          ),
        ),
      );
}
