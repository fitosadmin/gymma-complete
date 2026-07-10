import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';
import 'login_screen.dart';
import 'owner_login_screen.dart';

/// Landing / onboarding screen shown to every unauthenticated user.
/// The user chooses their path from here: member, owner, or guest browse.
class OnboardingScreen extends StatefulWidget {
  /// Called when the user taps "Browse Gyms" — lets the parent GuestShell
  /// switch to the Explore tab without pushing a new route.
  final VoidCallback? onBrowse;

  const OnboardingScreen({super.key, this.onBrowse});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with TickerProviderStateMixin {
  late AnimationController _bgCtrl;
  late Animation<double> _bgAnim;
  late AnimationController _cardCtrl;
  late Animation<Offset> _cardSlide;
  late Animation<double> _cardFade;

  @override
  void initState() {
    super.initState();
    _bgCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900));
    _bgAnim = CurvedAnimation(parent: _bgCtrl, curve: Curves.easeOut);

    _cardCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _cardSlide =
        Tween<Offset>(begin: const Offset(0, 0.1), end: Offset.zero).animate(
            CurvedAnimation(parent: _cardCtrl, curve: Curves.easeOutCubic));
    _cardFade =
        CurvedAnimation(parent: _cardCtrl, curve: Curves.easeOut);

    Future.delayed(const Duration(milliseconds: 80), () {
      if (mounted) {
        _bgCtrl.forward();
        Future.delayed(const Duration(milliseconds: 200),
            () { if (mounted) _cardCtrl.forward(); });
      }
    });
  }

  @override
  void dispose() {
    _bgCtrl.dispose();
    _cardCtrl.dispose();
    super.dispose();
  }

  void _goMemberLogin() {
    Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  void _goOwnerLogin() {
    Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const OwnerLoginScreen()));
  }

  void _browseGyms() {
    widget.onBrowse?.call();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.brandNavyDark,
        body: Stack(
          children: [
            // ── Animated background blobs ──────────────────────────────────
            FadeTransition(
              opacity: _bgAnim,
              child: Stack(
                children: [
                  Positioned(
                    top: -60,
                    right: -70,
                    child: _Blob(size: 280,
                        color: AppColors.brandCopper.withOpacity(0.13)),
                  ),
                  Positioned(
                    top: 80,
                    left: -90,
                    child: _Blob(size: 220,
                        color: AppColors.brandNavy.withOpacity(0.55)),
                  ),
                  Positioned(
                    bottom: 120,
                    right: -50,
                    child: _Blob(size: 180,
                        color: AppColors.brandCopper.withOpacity(0.07)),
                  ),
                  Positioned(
                    bottom: -30,
                    left: -30,
                    child: _Blob(size: 160,
                        color: AppColors.brandNavy.withOpacity(0.4)),
                  ),
                ],
              ),
            ),

            SafeArea(
              child: SingleChildScrollView(
                physics: const ClampingScrollPhysics(),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: MediaQuery.of(context).size.height -
                        MediaQuery.of(context).padding.top -
                        MediaQuery.of(context).padding.bottom,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // ── Hero ────────────────────────────────────────────
                      FadeTransition(
                        opacity: _bgAnim,
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(28, 52, 28, 0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Logo
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
                                'Your gym,\nyour journey.',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 42,
                                  fontWeight: FontWeight.w800,
                                  height: 1.1,
                                  letterSpacing: -1.4,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(
                                'Discover the best gyms in Bengaluru.\nManage your members. Track your workouts.',
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.55),
                                  fontSize: 15,
                                  height: 1.55,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 44),

                      // ── Options card ────────────────────────────────────
                      SlideTransition(
                        position: _cardSlide,
                        child: FadeTransition(
                          opacity: _cardFade,
                          child: Container(
                            margin: const EdgeInsets.fromLTRB(16, 0, 16, 40),
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius:
                                  BorderRadius.circular(AppRadius.xxl),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.30),
                                  blurRadius: 44,
                                  offset: const Offset(0, 18),
                                )
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                const Text(
                                  'How would you like to continue?',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Choose an option below to get started.',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textSecondary.withOpacity(0.8),
                                  ),
                                ),
                                const SizedBox(height: 24),

                                // ── Option 1: Member login ───────────────
                                _OptionTile(
                                  icon: Icons.person_rounded,
                                  iconBg: AppColors.brandCopper.withOpacity(0.12),
                                  iconColor: AppColors.brandCopper,
                                  title: 'I\'m a Member',
                                  subtitle: 'Sign in to track workouts & view your plan',
                                  onTap: _goMemberLogin,
                                  trailing: _ArrowChip(
                                      label: 'Sign In',
                                      color: AppColors.brandCopper),
                                ),

                                const Padding(
                                  padding: EdgeInsets.symmetric(vertical: 12),
                                  child: Divider(height: 1,
                                      color: AppColors.divider),
                                ),

                                // ── Option 2: Owner login ────────────────
                                _OptionTile(
                                  icon: Icons.storefront_rounded,
                                  iconBg: AppColors.brandNavy.withOpacity(0.10),
                                  iconColor: AppColors.brandNavy,
                                  title: 'I\'m a Gym Owner',
                                  subtitle: 'Manage your gym, members & announcements',
                                  onTap: _goOwnerLogin,
                                  trailing: _ArrowChip(
                                      label: 'Sign In',
                                      color: AppColors.brandNavy),
                                ),

                                const Padding(
                                  padding: EdgeInsets.symmetric(vertical: 12),
                                  child: Divider(height: 1,
                                      color: AppColors.divider),
                                ),

                                // ── Option 3: Guest browse ───────────────
                                _OptionTile(
                                  icon: Icons.explore_rounded,
                                  iconBg: AppColors.success.withOpacity(0.10),
                                  iconColor: AppColors.success,
                                  title: 'Browse Gyms',
                                  subtitle: 'Explore Bengaluru\'s gyms without an account',
                                  onTap: _browseGyms,
                                  trailing: _ArrowChip(
                                      label: 'Explore',
                                      color: AppColors.success),
                                ),

                                const SizedBox(height: 8),
                              ],
                            ),
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

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _OptionTile extends StatefulWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final Widget trailing;

  const _OptionTile({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
    required this.trailing,
  });

  @override
  State<_OptionTile> createState() => _OptionTileState();
}

class _OptionTileState extends State<_OptionTile> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        HapticFeedback.selectionClick();
        widget.onTap();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
        decoration: BoxDecoration(
          color: _pressed
              ? AppColors.paperBackground
              : Colors.transparent,
          borderRadius: BorderRadius.circular(AppRadius.md),
        ),
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: widget.iconBg,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Icon(widget.icon, color: widget.iconColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    widget.subtitle,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            widget.trailing,
          ],
        ),
      ),
    );
  }
}

class _ArrowChip extends StatelessWidget {
  final String label;
  final Color color;
  const _ArrowChip({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.10),
        borderRadius: BorderRadius.circular(AppRadius.full),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(width: 3),
          Icon(Icons.arrow_forward_rounded, size: 12, color: color),
        ],
      ),
    );
  }
}

/// Decorative circular blob for the background
class _Blob extends StatelessWidget {
  final double size;
  final Color color;
  const _Blob({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size),
      painter: _BlobPainter(color: color),
    );
  }
}

class _BlobPainter extends CustomPainter {
  final Color color;
  const _BlobPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 64;
    canvas.drawArc(
      Rect.fromLTWH(0, 0, size.width, size.height),
      -math.pi / 4,
      math.pi,
      false,
      paint,
    );
  }

  @override
  bool shouldRepaint(_BlobPainter old) => old.color != color;
}
