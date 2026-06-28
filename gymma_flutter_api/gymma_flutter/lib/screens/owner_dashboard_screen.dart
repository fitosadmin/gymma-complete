import 'package:flutter/material.dart';
import '../theme.dart';

class OwnerDashboardScreen extends StatefulWidget {
  const OwnerDashboardScreen({super.key});
  @override
  State<OwnerDashboardScreen> createState() => _OwnerDashboardScreenState();
}

class _OwnerDashboardScreenState extends State<OwnerDashboardScreen> {
  final _announce = TextEditingController();

  static const _stats = [
    (Icons.visibility_outlined, 'Profile views', '2,418', '+12%'),
    (Icons.chat_bubble_outline, 'Inquiries', '63', '+8%'),
    (Icons.star_outline, 'Avg. rating', '4.7', '+0.1'),
    (Icons.people_outline, 'Members', '312', '+19'),
  ];

  static const _inquiries = [
    ('Rahul S.', 'Annual', '2h ago', 'New'),
    ('Meghna R.', 'Quarterly', '5h ago', 'New'),
    ('Aditya K.', 'Monthly', '1d ago', 'Contacted'),
    ('Priya N.', 'Half-Yearly', '2d ago', 'Contacted'),
    ('Sameer P.', 'Annual', '3d ago', 'Joined'),
  ];

  @override
  void dispose() {
    _announce.dispose();
    super.dispose();
  }

  Color _statusBg(String s) => switch (s) {
        'New' => AppColors.primary50,
        'Joined' => AppColors.secondary50,
        _ => AppColors.neutral100,
      };
  Color _statusFg(String s) => switch (s) {
        'New' => AppColors.primary700,
        'Joined' => AppColors.secondary700,
        _ => AppColors.neutral600,
      };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        backgroundColor: AppColors.neutral50,
        title: const Text('Owner dashboard', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // gym header
          Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: const [
                  Text('Iron Temple Fitness',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                  SizedBox(width: 8),
                  _LiveDot(),
                ]),
                const Text('Indiranagar, Bengaluru',
                    style: TextStyle(color: AppColors.neutral500)),
              ]),
            ),
          ]),
          const SizedBox(height: 16),
          // profile completion
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.neutral0,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: AppColors.neutral200),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: const [
                Text('Profile completion', style: TextStyle(fontWeight: FontWeight.w600)),
                Spacer(),
                Text('80%', style: TextStyle(fontWeight: FontWeight.w800)),
              ]),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.full),
                child: const LinearProgressIndicator(
                  value: 0.8,
                  minHeight: 8,
                  backgroundColor: AppColors.neutral100,
                  color: AppColors.primary500,
                ),
              ),
            ]),
          ),
          const SizedBox(height: 16),
          // stats grid
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.7,
            children: _stats
                .map((s) => Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.neutral0,
                        borderRadius: BorderRadius.circular(AppRadius.lg),
                        border: Border.all(color: AppColors.neutral200),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(s.$1, size: 18, color: AppColors.neutral500),
                          const Spacer(),
                          Text(s.$3,
                              style: const TextStyle(
                                  fontSize: 22, fontWeight: FontWeight.w800)),
                          Row(children: [
                            Text(s.$2,
                                style: const TextStyle(
                                    color: AppColors.neutral500, fontSize: 12)),
                            const Spacer(),
                            Text(s.$4,
                                style: const TextStyle(
                                    color: AppColors.secondary700,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600)),
                          ]),
                        ],
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: 8),
          // quick actions
          Row(children: [
            _action(Icons.edit_outlined, 'Edit profile'),
            const SizedBox(width: 10),
            _action(Icons.add_photo_alternate_outlined, 'Upload photos'),
            const SizedBox(width: 10),
            _action(Icons.notifications_none, 'Notify'),
          ]),
          const SizedBox(height: 20),
          const Text('Recent inquiries',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          const SizedBox(height: 10),
          Container(
            decoration: BoxDecoration(
              color: AppColors.neutral0,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: AppColors.neutral200),
            ),
            child: Column(
              children: [
                for (int i = 0; i < _inquiries.length; i++) ...[
                  if (i > 0) const Divider(height: 1),
                  ListTile(
                    leading: CircleAvatar(
                      backgroundColor: AppColors.neutral100,
                      child: Text(_inquiries[i].$1[0],
                          style: const TextStyle(
                              color: AppColors.neutral700, fontWeight: FontWeight.w700)),
                    ),
                    title: Text(_inquiries[i].$1,
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text('${_inquiries[i].$2} plan · ${_inquiries[i].$3}'),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                          color: _statusBg(_inquiries[i].$4),
                          borderRadius: BorderRadius.circular(AppRadius.full)),
                      child: Text(_inquiries[i].$4,
                          style: TextStyle(
                              color: _statusFg(_inquiries[i].$4),
                              fontSize: 11,
                              fontWeight: FontWeight.w600)),
                    ),
                  ),
                ]
              ],
            ),
          ),
          const SizedBox(height: 20),
          const Text('Send announcement',
              style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          const SizedBox(height: 10),
          TextField(
            controller: _announce,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Share an update with your members…',
              filled: true,
              fillColor: AppColors.neutral0,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              style: FilledButton.styleFrom(
                  backgroundColor: AppColors.ink,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.md))),
              onPressed: () {
                if (_announce.text.trim().isEmpty) return;
                _announce.clear();
                ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Announcement sent to members')));
              },
              child: const Text('Send to members',
                  style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _action(IconData icon, String label) => Expanded(
        child: OutlinedButton(
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.neutral700,
            side: const BorderSide(color: AppColors.neutral200),
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
          ),
          onPressed: () => ScaffoldMessenger.of(context)
              .showSnackBar(SnackBar(content: Text('$label (demo)'))),
          child: Column(children: [
            Icon(icon, size: 20),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 11)),
          ]),
        ),
      );
}

class _LiveDot extends StatelessWidget {
  const _LiveDot();
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
            color: AppColors.secondary50, borderRadius: BorderRadius.circular(AppRadius.full)),
        child: Row(mainAxisSize: MainAxisSize.min, children: const [
          CircleAvatar(radius: 3, backgroundColor: AppColors.secondary500),
          SizedBox(width: 5),
          Text('Live',
              style: TextStyle(
                  color: AppColors.secondary700, fontSize: 11, fontWeight: FontWeight.w600)),
        ]),
      );
}
