import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../data/auth_service.dart';
import '../theme.dart';
import '../widgets/gradient_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneFocus = FocusNode();
  final _passFocus = FocusNode();
  bool _isLoading = false;
  bool _obscurePass = true;
  String? _error;

  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;
  late AnimationController _slideCtrl;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 800));
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    _slideCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _slideAnim = Tween<Offset>(
            begin: const Offset(0, 0.08), end: Offset.zero)
        .animate(CurvedAnimation(parent: _slideCtrl, curve: Curves.easeOut));

    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) {
        _fadeCtrl.forward();
        _slideCtrl.forward();
      }
    });
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    _slideCtrl.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _phoneFocus.dispose();
    _passFocus.dispose();
    super.dispose();
  }

  static final _phoneRe = RegExp(r'^[6-9]\d{9}$');
  static final _emailRe = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

  Future<void> _handleLogin() async {
    final identifier = _phoneController.text.trim();
    final password = _passwordController.text;
    if (identifier.isEmpty || password.isEmpty) {
      setState(() => _error = 'Please enter your phone or email and password');
      return;
    }
    if (!_phoneRe.hasMatch(identifier) && !_emailRe.hasMatch(identifier)) {
      setState(() =>
          _error = 'Enter a valid 10-digit phone number or email address');
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await AuthService.instance.login(identifier, password);
      if (mounted) Navigator.of(context).popUntil((route) => route.isFirst);
    } catch (e) {
      setState(
          () => _error = e.toString().replaceAll('ApiException(null): ', ''));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _openForgotPassword() async {
    final emailCtrl = TextEditingController();
    bool submitting = false;
    bool sent = false;
    String? sheetError;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xxl))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheet) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 28,
            left: 24,
            right: 24,
            top: 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: sent
                ? [
                    Center(
                      child: Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                            color: AppColors.success.withOpacity(0.12),
                            shape: BoxShape.circle),
                        child: const Icon(Icons.mark_email_read_outlined,
                            color: AppColors.success, size: 30),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text('Check your email',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 6),
                    const Text(
                        'If an account exists for that address, we\'ve sent a link to reset your password.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.textSecondary, height: 1.5)),
                    const SizedBox(height: 20),
                    FilledButton(
                      style: FilledButton.styleFrom(
                          backgroundColor: AppColors.brandNavy,
                          padding: const EdgeInsets.symmetric(vertical: 14)),
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Done'),
                    ),
                  ]
                : [
                    Center(
                      child: Container(
                          width: 40,
                          height: 4,
                          decoration: BoxDecoration(
                              color: AppColors.divider,
                              borderRadius: BorderRadius.circular(2))),
                    ),
                    const SizedBox(height: 20),
                    const Text('Reset your password',
                        style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 6),
                    const Text(
                        'Enter the email on your account and we\'ll send you a reset link.',
                        style: TextStyle(color: AppColors.textSecondary, height: 1.4)),
                    const SizedBox(height: 18),
                    TextField(
                      controller: emailCtrl,
                      autofocus: true,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Email',
                        prefixIcon: Icon(Icons.mail_outline),
                      ),
                    ),
                    if (sheetError != null) ...[
                      const SizedBox(height: 8),
                      Text(sheetError!,
                          style: const TextStyle(color: AppColors.error, fontSize: 13)),
                    ],
                    const SizedBox(height: 18),
                    FilledButton(
                      style: FilledButton.styleFrom(
                          backgroundColor: AppColors.brandNavy,
                          padding: const EdgeInsets.symmetric(vertical: 14)),
                      onPressed: submitting
                          ? null
                          : () async {
                              final email = emailCtrl.text.trim();
                              if (!_emailRe.hasMatch(email)) {
                                setSheet(() => sheetError = 'Enter a valid email address');
                                return;
                              }
                              setSheet(() {
                                submitting = true;
                                sheetError = null;
                              });
                              try {
                                await AuthService.instance.forgotPassword(email);
                                setSheet(() {
                                  sent = true;
                                  submitting = false;
                                });
                              } catch (_) {
                                setSheet(() {
                                  submitting = false;
                                  sheetError = 'Something went wrong. Please try again.';
                                });
                              }
                            },
                      child: submitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white))
                          : const Text('Send reset link'),
                    ),
                  ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.brandNavyDark,
        body: Stack(
          children: [
            // ── Background decorative arcs ──────────────────────────────────
            Positioned(
              top: -80,
              right: -60,
              child: _Arc(
                  size: 260,
                  color: AppColors.brandCopper.withOpacity(0.12)),
            ),
            Positioned(
              top: 60,
              left: -100,
              child: _Arc(
                  size: 200,
                  color: AppColors.brandNavy.withOpacity(0.5)),
            ),
            Positioned(
              bottom: -40,
              left: -40,
              child: _Arc(
                  size: 180,
                  color: AppColors.brandCopper.withOpacity(0.08)),
            ),

            SafeArea(
              child: SingleChildScrollView(
                physics: const ClampingScrollPhysics(),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                      minHeight: MediaQuery.of(context).size.height -
                          MediaQuery.of(context).padding.top -
                          MediaQuery.of(context).padding.bottom),
                  child: Column(
                    children: [
                      // ── Hero section ─────────────────────────────────────
                      Padding(
                        padding: const EdgeInsets.fromLTRB(28, 52, 28, 0),
                        child: FadeTransition(
                          opacity: _fadeAnim,
                          child: SlideTransition(
                            position: _slideAnim,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Logo mark
                                Container(
                                  height: 52,
                                  width: 52,
                                  decoration: BoxDecoration(
                                    gradient: AppGradients.brandGradient,
                                    borderRadius:
                                        BorderRadius.circular(AppRadius.md),
                                  ),
                                  child: const Icon(Icons.fitness_center,
                                      color: Colors.white, size: 28),
                                ),
                                const SizedBox(height: 32),
                                const Text(
                                  'Welcome\nback.',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 44,
                                    fontWeight: FontWeight.w800,
                                    height: 1.1,
                                    letterSpacing: -1.5,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  'Sign in to access your gym,\nworkouts, and progress.',
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.55),
                                    fontSize: 15,
                                    height: 1.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(height: 36),

                      // ── Form card ────────────────────────────────────────
                      FadeTransition(
                        opacity: _fadeAnim,
                        child: Container(
                          margin: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius:
                                BorderRadius.circular(AppRadius.xxl),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.28),
                                blurRadius: 40,
                                offset: const Offset(0, 16),
                              )
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Error banner
                              if (_error != null) ...[
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 14, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: AppColors.error.withOpacity(0.08),
                                    borderRadius:
                                        BorderRadius.circular(AppRadius.md),
                                    border: Border.all(
                                        color: AppColors.error.withOpacity(0.3)),
                                  ),
                                  child: Row(children: [
                                    const Icon(Icons.error_outline,
                                        color: AppColors.error, size: 16),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(_error!,
                                          style: const TextStyle(
                                              color: AppColors.error,
                                              fontSize: 13)),
                                    ),
                                  ]),
                                ),
                                const SizedBox(height: 20),
                              ],

                              // Phone / email field
                              const _FieldLabel('Phone or Email'),
                              const SizedBox(height: 8),
                              _StyledField(
                                controller: _phoneController,
                                focusNode: _phoneFocus,
                                hintText: '9876543210 or you@email.com',
                                keyboardType: TextInputType.emailAddress,
                                prefixIcon: Icons.person_outline,
                                onSubmitted: (_) => _passFocus.requestFocus(),
                                textInputAction: TextInputAction.next,
                              ),
                              const SizedBox(height: 20),

                              // Password field
                              const _FieldLabel('Password'),
                              const SizedBox(height: 8),
                              _StyledField(
                                controller: _passwordController,
                                focusNode: _passFocus,
                                hintText: '••••••••',
                                obscureText: _obscurePass,
                                prefixIcon: Icons.lock_outline,
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePass
                                        ? Icons.visibility_outlined
                                        : Icons.visibility_off_outlined,
                                    color: AppColors.textSecondary,
                                    size: 20,
                                  ),
                                  onPressed: () => setState(
                                      () => _obscurePass = !_obscurePass),
                                ),
                                onSubmitted: (_) => _handleLogin(),
                                textInputAction: TextInputAction.done,
                              ),
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton(
                                  onPressed: _openForgotPassword,
                                  style: TextButton.styleFrom(
                                      padding: EdgeInsets.zero,
                                      minimumSize: const Size(0, 32),
                                      tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                                  child: const Text('Forgot password?'),
                                ),
                              ),

                              const SizedBox(height: 12),

                              // CTA
                              GradientButton(
                                label: 'Sign In',
                                icon: Icons.arrow_forward_rounded,
                                isLoading: _isLoading,
                                onPressed: _isLoading ? null : _handleLogin,
                              ),

                              const SizedBox(height: 20),
                              Center(
                                child: Text(
                                  'New here? Tap Explore below to browse gyms without an account.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                      color: AppColors.textSecondary
                                          .withOpacity(0.7),
                                      fontSize: 12,
                                      height: 1.4),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Sub-widgets ──────────────────────────────────────────────────────────────

class _FieldLabel extends StatelessWidget {
  final String text;
  const _FieldLabel(this.text);
  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary),
      );
}

class _StyledField extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final String hintText;
  final bool obscureText;
  final TextInputType? keyboardType;
  final IconData prefixIcon;
  final Widget? suffixIcon;
  final ValueChanged<String>? onSubmitted;
  final TextInputAction? textInputAction;

  const _StyledField({
    required this.controller,
    required this.focusNode,
    required this.hintText,
    required this.prefixIcon,
    this.obscureText = false,
    this.keyboardType,
    this.suffixIcon,
    this.onSubmitted,
    this.textInputAction,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      focusNode: focusNode,
      obscureText: obscureText,
      keyboardType: keyboardType,
      onSubmitted: onSubmitted,
      textInputAction: textInputAction,
      style: const TextStyle(
          color: AppColors.textPrimary,
          fontSize: 15,
          fontWeight: FontWeight.w500),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: TextStyle(
            color: AppColors.textSecondary.withOpacity(0.6), fontSize: 14),
        prefixIcon:
            Icon(prefixIcon, color: AppColors.textSecondary, size: 20),
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: AppColors.paperBackground,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          borderSide: const BorderSide(color: AppColors.divider),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          borderSide:
              const BorderSide(color: AppColors.brandCopper, width: 1.8),
        ),
      ),
    );
  }
}

/// Decorative arc blob for background texture
class _Arc extends StatelessWidget {
  final double size;
  final Color color;
  const _Arc({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: _ArcPainter(color: color),
    );
  }
}

class _ArcPainter extends CustomPainter {
  final Color color;
  const _ArcPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 60;
    canvas.drawArc(
      Rect.fromLTWH(0, 0, size.width, size.height),
      -math.pi / 4,
      math.pi,
      false,
      paint,
    );
  }

  @override
  bool shouldRepaint(_ArcPainter old) => old.color != color;
}
