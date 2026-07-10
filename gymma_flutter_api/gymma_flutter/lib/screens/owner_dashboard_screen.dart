import 'package:flutter/material.dart';
import '../data/owner_repository.dart';
import '../theme.dart';
import 'send_broadcast_screen.dart';


class OwnerDashboardScreen extends StatefulWidget {
  const OwnerDashboardScreen({super.key});

  @override
  State<OwnerDashboardScreen> createState() => _OwnerDashboardScreenState();
}

class _OwnerDashboardScreenState extends State<OwnerDashboardScreen> {
  final OwnerRepository _repo = OwnerRepository();
  final _addMemberNameController = TextEditingController();
  final _addMemberPhoneController = TextEditingController();

  bool _isLoading = true;
  String? _error;

  Map<String, dynamic>? _gym;
  List<Map<String, dynamic>> _members = [];

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  @override
  void dispose() {
    _addMemberNameController.dispose();
    _addMemberPhoneController.dispose();
    super.dispose();
  }

  Future<void> _loadDashboardData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final gyms = await _repo.listOwnerGyms();
      if (gyms.isNotEmpty) {
        final gym = gyms.first;
        _gym = gym;
        final members = await _repo.getGymMembers(gym['id']);
        _members = members;
      }
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _addMember() async {
    final fullName = _addMemberNameController.text.trim();
    final phone = _addMemberPhoneController.text.trim();
    if (fullName.isEmpty || phone.isEmpty) return;

    if (_gym == null) return;

    Navigator.of(context).pop(); // close dialog
    setState(() => _isLoading = true);

    try {
      await _repo.addMember(_gym!['id'], fullName, phone);
      _addMemberNameController.clear();
      _addMemberPhoneController.clear();
      await _loadDashboardData(); // Refresh list
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('ApiException(null): ', ''))),
        );
      }
    }
  }

  Future<void> _removeMember(String memberId) async {
    if (_gym == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove Member'),
        content: const Text('Are you sure you want to remove this member? They will lose access to your gym.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Remove', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isLoading = true);
    try {
      await _repo.removeMember(_gym!['id'], memberId);
      await _loadDashboardData();
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('ApiException(null): ', ''))),
        );
      }
    }
  }

  void _showAddMemberDialog() {
    _addMemberNameController.clear();
    _addMemberPhoneController.clear();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add New Member', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
        contentPadding: const EdgeInsets.fromLTRB(24, 16, 24, 16),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Enter member details to enroll them.', style: TextStyle(color: AppColors.neutral500, fontSize: 13)),
            const SizedBox(height: 24),
            const Text('Full Name', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
            const SizedBox(height: 6),
            TextField(
              controller: _addMemberNameController,
              textCapitalization: TextCapitalization.words,
              decoration: InputDecoration(
                hintText: 'e.g. Rahul Sharma',
                filled: true,
                fillColor: AppColors.neutral0,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Phone Number', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
            const SizedBox(height: 6),
            TextField(
              controller: _addMemberPhoneController,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                hintText: 'e.g. 9876543210',
                filled: true,
                fillColor: AppColors.neutral0,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
              ),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary50,
                borderRadius: BorderRadius.circular(AppRadius.md),
                border: Border.all(color: AppColors.primary500.withOpacity(0.2)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.people_outline, color: AppColors.primary700, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'The member can log into the Gymma mobile app using this phone number and the default password Gymma@1234.',
                      style: const TextStyle(fontSize: 11.5, color: AppColors.primary700, height: 1.4, fontWeight: FontWeight.w500),
                    ),
                  )
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            style: TextButton.styleFrom(foregroundColor: AppColors.neutral600),
            child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
          ElevatedButton(
            onPressed: _addMember,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.neutral900,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
            ),
            child: const Text('Add Member', style: TextStyle(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutral50,
      appBar: AppBar(
        backgroundColor: AppColors.neutral50,
        title: const Text('Owner Dashboard',
            style: TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          IconButton(
            icon: const Icon(Icons.campaign_outlined),
            tooltip: 'Send Broadcast',
            onPressed: _gym == null
                ? null
                : () => Navigator.of(context).push(MaterialPageRoute(
                      builder: (_) => SendBroadcastScreen(
                        gymId: _gym!['id'] as String,
                        gymName: _gym!['name'] as String? ?? 'Your Gym',
                      ),
                    )),
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDashboardData,
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                        const SizedBox(height: 16),
                        Text(_error!, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton(
                            onPressed: _loadDashboardData,
                            child: const Text('Retry'))
                      ],
                    ),
                  ),
                )
              : _gym == null
                  ? const Center(
                      child: Text('No gym found for your account.\nPlease contact support.',
                          textAlign: TextAlign.center))
                  : _buildDashboard(),
    );
  }

  Widget _buildDashboard() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Gym Header
        Row(children: [
          Expanded(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Text(_gym!['name'] ?? 'Your Gym',
                        style: const TextStyle(
                            fontSize: 20, fontWeight: FontWeight.w800)),
                    const SizedBox(width: 8),
                    const _LiveDot(),
                  ]),
                  Text('${_gym!['city'] ?? 'Bengaluru'}, ${_gym!['area'] ?? 'Area'}',
                      style: const TextStyle(color: AppColors.neutral500)),
                ]),
          ),
        ]),
        const SizedBox(height: 24),

        // Member Management Section
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Member Management',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
            TextButton.icon(
              onPressed: _showAddMemberDialog,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add Member'),
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primary700,
                backgroundColor: AppColors.primary50,
              ),
            )
          ],
        ),
        const SizedBox(height: 12),

        if (_members.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.neutral0,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: AppColors.neutral200),
            ),
            child: const Center(
              child: Text('No active members.\nAdd members using the button above.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.neutral500)),
            ),
          )
        else
          Container(
            decoration: BoxDecoration(
              color: AppColors.neutral0,
              borderRadius: BorderRadius.circular(AppRadius.lg),
              border: Border.all(color: AppColors.neutral200),
            ),
            child: ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _members.length,
              separatorBuilder: (ctx, i) => const Divider(height: 1),
              itemBuilder: (ctx, i) {
                final member = _members[i];
                final fullName = member['full_name'] as String? ?? 'Unknown User';
                final email = member['email'] as String? ?? '';
                final membershipId = member['membership_id'] as String?;

                if (membershipId == null) return const SizedBox();

                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppColors.primary50,
                    child: Text(fullName.isNotEmpty ? fullName[0].toUpperCase() : '?',
                        style: const TextStyle(
                            color: AppColors.primary700,
                            fontWeight: FontWeight.w700)),
                  ),
                  title: Text(fullName,
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text(email),
                  trailing: IconButton(
                    icon: const Icon(Icons.remove_circle_outline, color: AppColors.error),
                    onPressed: () => _removeMember(membershipId),
                    tooltip: 'Remove Member',
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
}

class _LiveDot extends StatelessWidget {
  const _LiveDot();
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
            color: AppColors.secondary50,
            borderRadius: BorderRadius.circular(AppRadius.full)),
        child: const Row(mainAxisSize: MainAxisSize.min, children: [
          CircleAvatar(radius: 3, backgroundColor: AppColors.secondary500),
          SizedBox(width: 5),
          Text('Live',
              style: TextStyle(
                  color: AppColors.secondary700,
                  fontSize: 11,
                  fontWeight: FontWeight.w600)),
        ]),
      );
}
