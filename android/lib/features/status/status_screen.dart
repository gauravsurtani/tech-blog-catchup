import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/app_config.dart';
import 'status_provider.dart';
import 'audio_breakdown_card.dart';
import 'crawl_status_table.dart';
import 'crawl_trigger_button.dart';

class StatusScreen extends ConsumerWidget {
  const StatusScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statusAsync = ref.watch(statusProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Dashboard')),
      body: statusAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppConfig.error),
              const SizedBox(height: AppConfig.spacingMd),
              Text('Failed to load status', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: AppConfig.spacingSm),
              Text(err.toString(), style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: AppConfig.spacingLg),
              OutlinedButton(
                onPressed: () => ref.invalidate(statusProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (status) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(statusProvider);
            ref.invalidate(crawlStatusProvider);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(AppConfig.spacingLg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${status.totalPosts} Total Posts',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: AppConfig.spacingLg),
                AudioBreakdownCard(audioCounts: status.audioCounts),
                const SizedBox(height: AppConfig.spacingXl),
                Row(
                  children: [
                    Expanded(
                      child: CrawlTriggerButton(
                        label: 'Crawl All Sources',
                        icon: Icons.download_rounded,
                        onTrigger: (client) => client.triggerCrawl(),
                      ),
                    ),
                    const SizedBox(width: AppConfig.spacingMd),
                    Expanded(
                      child: CrawlTriggerButton(
                        label: 'Generate Podcasts',
                        icon: Icons.podcasts_rounded,
                        onTrigger: (client) => client.triggerGenerate(),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppConfig.spacingXl),
                Text(
                  'Crawl Status',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: AppConfig.spacingMd),
                const CrawlStatusTable(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
