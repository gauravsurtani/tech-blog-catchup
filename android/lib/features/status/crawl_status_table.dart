import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/app_config.dart';
import '../../models/crawl_status.dart';
import 'status_provider.dart';

class CrawlStatusTable extends ConsumerWidget {
  const CrawlStatusTable({super.key});

  String _formatTime(DateTime? dt) {
    if (dt == null) return 'Never';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final crawlAsync = ref.watch(crawlStatusProvider);

    return crawlAsync.when(
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.all(AppConfig.spacingXl),
          child: CircularProgressIndicator(),
        ),
      ),
      error: (err, _) => Padding(
        padding: const EdgeInsets.all(AppConfig.spacingLg),
        child: Text(
          'Failed to load crawl status',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppConfig.error,
              ),
        ),
      ),
      data: (items) => Column(
        children: items.map((item) => _buildRow(context, item)).toList(),
      ),
    );
  }

  Widget _buildRow(BuildContext context, CrawlStatusItem item) {
    final discoverableText = item.totalDiscoverable != null
        ? '${item.postCount} / ${item.totalDiscoverable}'
        : '${item.postCount}';

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppConfig.spacingSm),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: AppConfig.crawlStatusColor(item.status),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: AppConfig.spacingMd),
          Expanded(
            flex: 3,
            child: Text(
              item.sourceName,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppConfig.onSurface,
                  ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          SizedBox(
            width: 64,
            child: Text(
              discoverableText,
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.end,
            ),
          ),
          const SizedBox(width: AppConfig.spacingMd),
          SizedBox(
            width: 64,
            child: Text(
              _formatTime(item.lastCrawlAt),
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}
