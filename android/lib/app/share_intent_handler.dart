import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:receive_sharing_intent/receive_sharing_intent.dart';

import '../core/providers.dart';
import '../theme/app_config.dart';

class ShareIntentHandler extends ConsumerStatefulWidget {
  final Widget child;

  const ShareIntentHandler({super.key, required this.child});

  @override
  ConsumerState<ShareIntentHandler> createState() => _ShareIntentHandlerState();
}

class _ShareIntentHandlerState extends ConsumerState<ShareIntentHandler> {
  StreamSubscription<List<SharedMediaFile>>? _subscription;

  @override
  void initState() {
    super.initState();

    // Handle intent when app is already running
    _subscription = ReceiveSharingIntent.instance
        .getMediaStream()
        .listen(_handleSharedFiles);

    // Handle intent that launched the app
    ReceiveSharingIntent.instance.getInitialMedia().then(_handleSharedFiles);
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  void _handleSharedFiles(List<SharedMediaFile> files) {
    for (final file in files) {
      final text = file.path;
      final url = _extractUrl(text);
      if (url != null) {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Invalid URL: must start with http:// or https://')),
          );
          return;
        }
        _showAddToCrawlSheet(url);
        break;
      }
    }
  }

  String? _extractUrl(String text) {
    final regex = RegExp(r'https?://[^\s]+');
    final match = regex.firstMatch(text);
    return match?.group(0);
  }

  void _showAddToCrawlSheet(String url) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => _AddToCrawlSheet(url: url),
    );
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

class _AddToCrawlSheet extends ConsumerStatefulWidget {
  final String url;

  const _AddToCrawlSheet({required this.url});

  @override
  ConsumerState<_AddToCrawlSheet> createState() => _AddToCrawlSheetState();
}

class _AddToCrawlSheetState extends ConsumerState<_AddToCrawlSheet> {
  bool _loading = false;

  Future<void> _confirm() async {
    setState(() => _loading = true);

    try {
      final client = ref.read(apiClientProvider);
      await client.triggerCrawl(source: widget.url);

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Crawl started')),
        );
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
    return Padding(
      padding: const EdgeInsets.all(AppConfig.spacingXl),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Add to crawl?',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: AppConfig.spacingMd),
          Text(
            widget.url,
            style: Theme.of(context).textTheme.bodyMedium,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppConfig.spacingXl),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
              const SizedBox(width: AppConfig.spacingMd),
              ElevatedButton(
                onPressed: _loading ? null : _confirm,
                child: _loading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Crawl'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
