import 'package:flutter/material.dart';
import '../data/broadcast_repository.dart';
import '../theme.dart';
import '../widgets/gradient_button.dart';

/// Owner-side compose screen for gym-wide broadcasts, plus a history of
/// what's already been sent with read-receipt stats on tap.
class SendBroadcastScreen extends StatefulWidget {
  final String gymId;
  final String gymName;
  const SendBroadcastScreen({super.key, required this.gymId, required this.gymName});

  @override
  State<SendBroadcastScreen> createState() => _SendBroadcastScreenState();
}

class _SendBroadcastScreenState extends State<SendBroadcastScreen> {
  final _repo = BroadcastRepository();
  final _titleCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();

  String _type = 'announcement';
  String _priority = 'normal';
  bool _sending = false;

  bool _loadingSent = true;
  String? _sentError;
  List<Map<String, dynamic>> _sent = [];

  @override
  void initState() {
    super.initState();
    _loadSent();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _messageCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadSent() async {
    setState(() {
      _loadingSent = true;
      _sentError = null;
    });
    try {
      final items = await _repo.listBroadcasts(widget.gymId, limit: 30);
      if (!mounted) return;
      setState(() {
        _sent = items;
        _loadingSent = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _sentError = e.toString().replaceAll('Exception: ', '');
        _loadingSent = false;
      });
    }
  }

  Future<void> _send() async {
    final title = _titleCtrl.text.trim();
    final message = _messageCtrl.text.trim();
    if (title.isEmpty || message.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Title and message are both required.')),
      );
      return;
    }

    setState(() => _sending = true);
    try {
      final result = await _repo.createBroadcast(
        widget.gymId,
        title,
        message,
        type: _type,
        priority: _priority,
      );
      final reach = result['estimated_reach'] ?? 0;
      _titleCtrl.clear();
      _messageCtrl.clear();
      setState(() {
        _type = 'announcement';
        _priority = 'normal';
        _sending = false;
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sent to $reach member${reach == 1 ? '' : 's'}.')),
      );
      _loadSent();
    } catch (e) {
      if (!mounted) return;
      setState(() => _sending = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceAll('ApiException(null): ', ''))),
      );
    }
  }

  Future<void> _showStats(Map<String, dynamic> broadcast) async {
    final id = broadcast['id'] as String;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => FutureBuilder<Map<String, dynamic>?>(
        future: _repo.getBroadcast(id),
        builder: (context, snapshot) {
          final detail = snapshot.data;
          final stats = detail?['receipt_stats'] as Map<String, dynamic>?;
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(broadcast['title'] as String? ?? '',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 4),
                  Text(broadcast['message'] as String? ?? '',
                      style: const TextStyle(color: AppColors.textSecondary, height: 1.5)),
                  const SizedBox(height: 20),
                  if (snapshot.connectionState == ConnectionState.waiting)
                    const Center(child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator()))
                  else if (stats == null)
                    const Text('Delivery stats unavailable.', style: TextStyle(color: AppColors.textSecondary))
                  else
                    Row(
                      children: [
                        Expanded(child: _StatBlock(label: 'Delivered', value: '${stats['total_receipts']}')),
                        Expanded(child: _StatBlock(label: 'Read', value: '${stats['read_count']}')),
                      ],
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paperBackground,
      appBar: AppBar(
        title: Text('Broadcast · ${widget.gymName}', style: const TextStyle(fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          _ComposeCard(
            titleCtrl: _titleCtrl,
            messageCtrl: _messageCtrl,
            type: _type,
            priority: _priority,
            sending: _sending,
            onTypeChanged: (v) => setState(() => _type = v),
            onPriorityChanged: (v) => setState(() => _priority = v),
            onSend: _send,
          ),
          const SizedBox(height: 28),
          const Text('Sent to this gym', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          const SizedBox(height: 12),
          if (_loadingSent)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_sentError != null)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Column(
                children: [
                  Text(_sentError!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textSecondary)),
                  const SizedBox(height: 8),
                  OutlinedButton(onPressed: _loadSent, child: const Text('Retry')),
                ],
              ),
            )
          else if (_sent.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.lg),
                border: Border.all(color: AppColors.divider),
              ),
              child: const Center(
                child: Text('No broadcasts sent yet.', style: TextStyle(color: AppColors.textSecondary)),
              ),
            )
          else
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.lg),
                border: Border.all(color: AppColors.divider),
              ),
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _sent.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (_, i) {
                  final b = _sent[i];
                  return ListTile(
                    title: Text(b['title'] as String? ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text(b['message'] as String? ?? '', maxLines: 1, overflow: TextOverflow.ellipsis),
                    trailing: const Icon(Icons.chevron_right_rounded, color: AppColors.textSecondary),
                    onTap: () => _showStats(b),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}

class _ComposeCard extends StatelessWidget {
  final TextEditingController titleCtrl;
  final TextEditingController messageCtrl;
  final String type;
  final String priority;
  final bool sending;
  final ValueChanged<String> onTypeChanged;
  final ValueChanged<String> onPriorityChanged;
  final VoidCallback onSend;

  const _ComposeCard({
    required this.titleCtrl,
    required this.messageCtrl,
    required this.type,
    required this.priority,
    required this.sending,
    required this.onTypeChanged,
    required this.onPriorityChanged,
    required this.onSend,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.xl),
        border: Border.all(color: AppColors.divider),
        boxShadow: [
          BoxShadow(color: AppColors.brandNavy.withOpacity(0.06), blurRadius: 16, offset: const Offset(0, 6)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('New broadcast', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
          const SizedBox(height: 4),
          const Text('Sent instantly to every active member of your gym.',
              style: TextStyle(fontSize: 12.5, color: AppColors.textSecondary)),
          const SizedBox(height: 16),
          TextField(
            controller: titleCtrl,
            maxLength: 255,
            decoration: const InputDecoration(labelText: 'Title', hintText: 'e.g. Holiday hours this weekend'),
          ),
          const SizedBox(height: 4),
          TextField(
            controller: messageCtrl,
            maxLength: 2000,
            maxLines: 4,
            decoration: const InputDecoration(labelText: 'Message', hintText: 'Write your announcement…'),
          ),
          const SizedBox(height: 8),
          const Text('Type', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          _PillSelector(
            value: type,
            options: const {'announcement': 'Announcement', 'update': 'Update', 'alert': 'Alert'},
            onChanged: onTypeChanged,
          ),
          const SizedBox(height: 16),
          const Text('Priority', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: AppColors.textSecondary)),
          const SizedBox(height: 8),
          _PillSelector(
            value: priority,
            options: const {'low': 'Low', 'normal': 'Normal', 'high': 'High'},
            onChanged: onPriorityChanged,
          ),
          const SizedBox(height: 20),
          GradientButton(
            label: sending ? 'Sending…' : 'Send Broadcast',
            icon: Icons.campaign_rounded,
            isLoading: sending,
            onPressed: sending ? null : onSend,
          ),
        ],
      ),
    );
  }
}

class _PillSelector extends StatelessWidget {
  final String value;
  final Map<String, String> options;
  final ValueChanged<String> onChanged;
  const _PillSelector({required this.value, required this.options, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: options.entries.map((entry) {
        final selected = entry.key == value;
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => onChanged(entry.key),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: selected ? AppColors.brandCopper : AppColors.paperBackground,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                  border: Border.all(color: selected ? AppColors.brandCopper : AppColors.divider),
                ),
                child: Text(
                  entry.value,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: selected ? Colors.white : AppColors.textSecondary,
                  ),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _StatBlock extends StatelessWidget {
  final String label;
  final String value;
  const _StatBlock({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.brandCopper)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
      ],
    );
  }
}
