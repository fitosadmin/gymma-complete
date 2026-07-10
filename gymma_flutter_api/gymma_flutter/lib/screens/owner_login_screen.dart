import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../data/auth_service.dart';
import '../theme.dart';

/// Owner-specific login screen.
/// Uses Google Sign-In matching the web platform.
class OwnerLoginScreen extends StatefulWidget {
  const OwnerLoginScreen({super.key});

  @override
  State<OwnerLoginScreen> createState() => _OwnerLoginScreenState();
}

class _OwnerLoginScreenState extends State<OwnerLoginScreen>
    with TickerProviderStateMixin {
  bool _isLoading = false;
  String? _error;

  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;
  late AnimationController _slideCtrl;
  late Animation<Offset> _slideAnim;

  // The client ID matches the web application NEXT_PUBLIC_GOOGLE_CLIENT_ID
  static const _webClientId =
      '435105824000-92ln248vnfnudgkp8tdtvre2vrlnh7tq.apps.googleusercontent.com';

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    clientId: _webClientId, // Used on web and iOS if missing in plist.
    serverClientId: _webClientId, // Request serverAuthCode / idToken
  );

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
    super.dispose();
  }

  Future<void> _handleGoogleSignIn() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Prompt user to choose Google account
      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      if (account == null) {
        // User canceled the sign-in flow
        setState(() => _isLoading = false);
        return;
      }

      // Obtain auth details including idToken
      final GoogleSignInAuthentication auth = await account.authentication;
      final idToken = auth.idToken;

      if (idToken == null) {
        throw Exception('Failed to obtain ID token from Google.');
      }

      // Send idToken to our backend
      await AuthService.instance.loginAsOwnerWithGoogle(idToken);

      // On success, pop back to let HomeShell take over
      if (mounted) {
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    } catch (e) {
      if (e is PlatformException) {
        setState(() => _error =
            'Google Sign-In is not fully configured on this device yet.\n'
            'Ensure google-services.json is added for Android.');
      } else {
        setState(() =>
            _error = e.toString().replaceAll('ApiException(null): ', ''));
      }
      await _googleSignIn.signOut();
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.brandNavyDark,
        body: Stack(
          children: [
            // ── Background arcs ────────────────────────────────────────────
            Positioned(
              top: -80,
              left: -60,
              child: _Arc(size: 260,
                  color: AppColors.brandNavy.withOpacity(0.55)),
            ),
            Positioned(
              top: 60,
              right: -80,
              child: _Arc(size: 200,
                  color: AppColors.brandCopper.withOpacity(0.09)),
            ),
            Positioned(
              bottom: -40,
              right: -40,
              child: _Arc(size: 180,
                  color: AppColors.brandNavy.withOpacity(0.4)),
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
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // ── Back button ──────────────────────────────────────
                      Padding(
                        padding: const EdgeInsets.only(left: 12, top: 8),
                        child: IconButton(
                          icon: const Icon(Icons.arrow_back_ios_new_rounded,
                              color: Colors.white, size: 20),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ),

                      // ── Hero ─────────────────────────────────────────────
                      Padding(
                        padding: const EdgeInsets.fromLTRB(28, 20, 28, 0),
                        child: FadeTransition(
                          opacity: _fadeAnim,
                          child: SlideTransition(
                            position: _slideAnim,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  height: 52,
                                  width: 52,
                                  decoration: BoxDecoration(
                                    color: AppColors.brandNavy,
                                    borderRadius:
                                        BorderRadius.circular(AppRadius.md),
                                    border: Border.all(
                                        color: AppColors.brandCopper
                                            .withOpacity(0.4),
                                        width: 1.5),
                                  ),
                                  child: const Icon(Icons.storefront_rounded,
                                      color: Colors.white, size: 26),
                                ),
                                const SizedBox(height: 28),
                                const Text(
                                  'Gymma\nPartner.',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 42,
                                    fontWeight: FontWeight.w800,
                                    height: 1.1,
                                    letterSpacing: -1.4,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  'Sign in with your gym\'s Google\naccount to manage your portal.',
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

                      const SizedBox(height: 32),

                      // ── Form card ─────────────────────────────────────────
                      FadeTransition(
                        opacity: _fadeAnim,
                        child: Container(
                          margin: const EdgeInsets.fromLTRB(16, 0, 16, 32),
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius:
                                BorderRadius.circular(AppRadius.xxl),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.30),
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
                                const SizedBox(height: 24),
                              ],

                              // Google Sign In Button
                              InkWell(
                                onTap: _isLoading ? null : _handleGoogleSignIn,
                                borderRadius: BorderRadius.circular(AppRadius.xl),
                                child: Container(
                                  height: 56,
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(AppRadius.xl),
                                    border: Border.all(color: AppColors.divider),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.04),
                                        blurRadius: 10,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      if (_isLoading)
                                        const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2.5,
                                            valueColor: AlwaysStoppedAnimation(
                                                AppColors.brandNavy),
                                          ),
                                        )
                                      else ...[
                                        // A simple G icon placeholder
                                        Container(
                                          width: 24,
                                          height: 24,
                                          decoration: BoxDecoration(
                                            color: Colors.blue[600],
                                            shape: BoxShape.circle,
                                          ),
                                          alignment: Alignment.center,
                                          child: const Text(
                                            'G',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 16,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 12),
                                        const Text(
                                          'Sign in with Google',
                                          style: TextStyle(
                                            color: AppColors.textPrimary,
                                            fontSize: 16,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ]
                                    ],
                                  ),
                                ),
                              ),

                              const SizedBox(height: 32),
                              Center(
                                child: Text(
                                  'Not a partner yet?\nContact us to request a demo.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                      color: AppColors.textSecondary
                                          .withOpacity(0.7),
                                      fontSize: 13,
                                      height: 1.5),
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
