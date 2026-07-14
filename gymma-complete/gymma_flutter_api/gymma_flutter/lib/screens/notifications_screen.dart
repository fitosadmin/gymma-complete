import 'dart:async';
import 'package:flutter/material.dart';
import '../data/auth_service.dart';
import '../data/broadcast_repository.dart';
import '../data/broadcast_socket_service.dart';
import '../theme.dart';

/// The member-side feed for gym broadcasts (owner announcements/alerts/
/// updates), reached via the bell icon on MemberDashboardScreen. Pops with
/// `true` if anything was marked read during this visit, so the caller can
/// refresh its unread badge without a shared state manager.
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _repo = BroadcastRepository();

  bool _loading = true;
  String? _error;
  List<Map<String, dynamic>> _broadcasts = [];
  bool _anyMarkedRead = false;
  StreamSubscription<Map<String, dynamic>>? _socketSub;

  String? get _gymId => AuthService.instance.gymId;

  @override
  void initState() {
    super.initState();
    _load();
    BroadcastSocketService.instance.connect();
    _socketSub = BroadcastSocketService.instance.onBroadcast.listen(_onLiveBroadcast);
  }

  @override
  void dispose() {
    _socketSub?.cancel();
    BroadcastSocketService.instance.disconnect();
    super.dispose();
  }

  /// A broadcast just arrived over the WebSocket while this screen is open —
  /// prepend it so it shows up without waiting for the next pull-to-refresh.
  /// The live payload uses `broadcast_id` (REST list items use `id`), and
  /// has no `is_read`/`sender_name` yet since no receipt exists for this
  /// user at emit time.
  void _onLiveBroadcast(Map<String, dynamic> payload) {
    if (!mounted) return;
    final gymId = _gymId;
    if (gymId != null && payload['gym_id'] != gymId) return;
    if (_broadcasts.any((b) => b['id'] == payload['broadcast_id'])) return;
    setState(() {
      _broadcasts.insert(0, {
        'id': payload['broadcast_id'],
        'gym_id': payload['gym_id'],
        'sender_id': payload['sender_id'],
        'title': payload['title'],
        'message': payload['message'],
        'type': payload['type'],
        'priority': payload['priority'],
        'is_read': false,
        'sent_at': payload['sent_at'],
      });
    });
  }

  Future<void> _load() async {
    final gymId = _gymId;
    if (gymId == null) {
      setState(() {
        _loading = false;
        _error = null;
        _broadcasts = [];
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final items = await _repo.listBroadcasts(gymId);
      if (!mounted) return;
      setState(() {
        _broadcasts = items;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
        _loading = false;
      });
    }
  }

  Future<void> _openBroadcast(Map<String, dynamic> b) async {
    final wasUnread = b['is_read'] != true;
    if (wasUnread) {
      final id = b['id'] as String;
      setState(() => b['is_read'] = true);
      _anyMarkedRead = true;
      try {
        await _repo.markRead(id);
      } catch (_) {
        // Non-critical — the read state already reflects locally; the
        // receipt just didn't reach the server this time.
      }
    }
    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _BroadcastDetailSheet(broadcast: b),
    );
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        Navigator.of(context).pop(_anyMarkedRead);
      },
      child: Scaffold(
        backgroundColor: AppColors.paperBackground,
        appBar: AppBar(
          title: const Text('Announcements', style: TextStyle(fontWeight: FontWeight.w700)),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: () => Navigator.of(context).pop(_anyMarkedRead),
          ),
        ),
        body: RefreshIndicator(
          onRefresh: _load,
          color: AppColors.brandCopper,
          child: _buildBody(),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_gymId == null) {
      return _message(
        icon: Icons.groups_outlined,
        title: 'Not linked to a gym yet',
        subtitle: 'Once your gym adds you as a member, announcements from them will show up here.',
      );
    }
    if (_error != null) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          const SizedBox(height: 80),
          Icon(Icons.error_outline, size: 48, color: AppColors.error, semanticLabel: 'Error'),
          const SizedBox(height: 16),
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textSecondary)),
            ),
          ),
          const SizedBox(height: 16),
          Center(child: OutlinedButton(onPressed: _load, child: const Text('Retry'))),
        ],
      );
    }
    if (_broadcasts.isEmpty) {
      return _message(
        icon: Icons.notifications_none_rounded,
        title: 'No announcements yet',
        subtitle: 'Updates about your gym, membership and workouts will show up here.',
      );
    }
    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      itemCount: _broadcasts.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (_, i) => _BroadcastTile(
        broadcast: _broadcasts[i],
        onTap: () => _openBroadcast(_broadcasts[i]),
      ),
    );
  }

  Widget _message({required IconData icon, required String title, required String subtitle}) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        const SizedBox(height: 60),
        Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(color: AppColors.divider.withOpacity(0.5), shape: BoxShape.circle),
                  child: Icon(icon, size: 34, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 20),
                Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                Text(subtitle, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textSecondary, height: 1.5)),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _BroadcastTile extends StatelessWidget {
  final Map<String, dynamic> broadcast;
  final VoidCallback onTap;
  const _BroadcastTile({required this.broadcast, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final type = broadcast['type'] as String? ?? 'announcement';
    final priority = broadcast['priority'] as String? ?? 'normal';
    final unread = broadcast['is_read'] != true;
    final (icon, color) = _typeStyle(type);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.lg),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppRadius.lg),
          border: Border.all(color: unread ? color.withOpacity(0.3) : AppColors.divider),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(color: color.withOpacity(0.12), shape: BoxShape.circle),
                  child: Icon(icon, color: color, size: 20),
                ),
                if (priority == 'high')
                  Positioned(
                    right: -2,
                    top: -2,
                    child: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: AppColors.error,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.surface, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          broadcast['title'] as String? ?? '',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 14.5,
                            fontWeight: unread ? FontWeight.w800 : FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      if (unread) ...[
                        const SizedBox(width: 6),
                        Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppColors.brandCopper, shape: BoxShape.circle)),
                      ],
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    broadcast['message'] as String? ?? '',
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      if (broadcast['sender_name'] != null) ...[
                        Text(broadcast['sender_name'] as String, style: const TextStyle(fontSize: 11.5, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
                        const Text(' · ', style: TextStyle(fontSize: 11.5, color: AppColors.textSecondary)),
                      ],
                      Text(_formatSentAt(broadcast['sent_at'] as String?), style: const TextStyle(fontSize: 11.5, color: AppColors.textSecondary)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  (IconData, Color) _typeStyle(String type) {
    switch (type) {
      case 'alert':
        return (Icons.warning_amber_rounded, AppColors.error);
      case 'update':
        return (Icons.autorenew_rounded, AppColors.brandNavy);
      case 'announcement':
      default:
        return (Icons.campaign_rounded, AppColors.brandCopper);
    }
  }
}

class _BroadcastDetailSheet extends StatelessWidget {
  final Map<String, dynamic> broadcast;
  const _BroadcastDetailSheet({required this.broadcast});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(24, 20, 24, 24 + MediaQuery.of(context).viewInsets.bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(color: AppColors.divider, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            Text(
              broadcast['title'] as String? ?? '',
              style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 6),
            Text(
              _formatSentAt(broadcast['sent_at'] as String?),
              style: const TextStyle(fontSize: 12.5, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            Text(
              broadcast['message'] as String? ?? '',
              style: const TextStyle(fontSize: 15, color: AppColors.textPrimary, height: 1.6),
            ),
          ],
        ),
      ),
    );
  }
}

String _formatSentAt(String? iso) {
  final dt = iso != null ? DateTime.tryParse(iso)?.toLocal() : null;
  if (dt == null) return '';
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final day = DateTime(dt.year, dt.month, dt.day);
  final diff = today.difference(day).inDays;
  final time = '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  if (diff == 0) return 'Today, $time';
  if (diff == 1) return 'Yesterday, $time';
  return '${dt.day}/${dt.month}/${dt.year}';
}
