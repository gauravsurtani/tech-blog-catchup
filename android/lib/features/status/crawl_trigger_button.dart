import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_client.dart';
import '../../core/providers.dart';
import '../../theme/app_config.dart';
import 'status_provider.dart';

class CrawlTriggerButton extends ConsumerStatefulWidget {
  final String label;
  final IconData icon;
  final Future<Map<String, dynamic>> Function(ApiClient client) onTrigger;

  const CrawlTriggerButton({
    super.key,
    required this.label,
    required this.icon,
    required this.onTrigger,
  });

  @override
  ConsumerState<CrawlTriggerButton> createState() => _CrawlTriggerButtonState();
}

class _CrawlTriggerButtonState extends ConsumerState<CrawlTriggerButton> {
  bool _loading = false;

  Future<void> _trigger() async {
    if (_loading) return;
    setState(() => _loading = true);

    try {
      final client = ref.read(apiClientProvider);
      await widget.onTrigger(client);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${widget.label} started')),
        );
        ref.invalidate(statusProvider);
        ref.invalidate(crawlStatusProvider);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed: $e'),
            backgroundColor: AppConfig.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: _loading ? null : _trigger,
      icon: _loading
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Icon(widget.icon, size: 18),
      label: Text(
        widget.label,
        style: const TextStyle(fontSize: 13),
      ),
    );
  }
}
