import 'package:flutter/material.dart';
import '../data/auth_service.dart';
import '../theme.dart';

/// The member's account screen. Replaces what used to be a bare
/// "Coming soon" placeholder — this is also the only place sign-out lives,
/// so tapping a header avatar elsewhere in the app never logs anyone out
/// by accident.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  Future<void> _confirmLogout(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Log out?'),
        content: const Text('You\'ll need to sign in again to see your workouts and membership.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.error),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Log out'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      if (context.mounted) {
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
      await AuthService.instance.logout();
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService.instance.user;
    final fullName = (user?['fullName'] as String?)?.trim();
    final displayName = (fullName == null || fullName.isEmpty) ? 'Member' : fullName;
    final initial = displayName.isNotEmpty ? displayName[0].toUpperCase() : 'M';
    final email = user?['email'] as String?;
    final phone = user?['phone'] as String?;
    final role = (user?['role'] as String?)?.replaceFirstMapped(
        RegExp(r'^[a-z]'), (m) => m.group(0)!.toUpperCase());

    return Scaffold(
      backgroundColor: AppColors.paperBackground,
      appBar: AppBar(
        title: const Text('Profile', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
        children: [
          Center(
            child: Column(
              children: [
                Container(
                  width: 84,
                  height: 84,
                  decoration: const BoxDecoration(
                    gradient: AppGradients.brandGradient,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    initial,
                    style: const TextStyle(
                        color: Colors.white, fontSize: 32, fontWeight: FontWeight.w800),
                  ),
                ),
                const SizedBox(height: 16),
                Text(displayName,
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                if (role != null && role.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(role, style: const TextStyle(color: AppColors.textSecondary)),
                ],
              ],
            ),
          ),
          const SizedBox(height: 28),
          Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: AppColors.divider),
            ),
            child: Column(
              children: [
                if (phone != null && phone.isNotEmpty)
                  _infoRow(Icons.phone_outlined, 'Phone', phone),
                if (phone != null && phone.isNotEmpty && email != null && email.isNotEmpty)
                  const Divider(height: 1, indent: 16, endIndent: 16),
                if (email != null && email.isNotEmpty)
                  _infoRow(Icons.mail_outline, 'Email', email),
                if ((phone == null || phone.isEmpty) && (email == null || email.isEmpty))
                  _infoRow(Icons.info_outline, 'Account', 'No contact details on file'),
              ],
            ),
          ),
          const SizedBox(height: 28),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.error,
              side: const BorderSide(color: AppColors.error),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppRadius.md)),
            ),
            onPressed: () => _confirmLogout(context),
            icon: const Icon(Icons.logout_rounded, size: 18),
            label: const Text('Log out', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Icon(icon, size: 20, color: AppColors.textSecondary),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  const SizedBox(height: 2),
                  Text(value,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ],
        ),
      );
}
