import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/app_config.dart';
import 'explore_filters_provider.dart';
import 'explore_provider.dart';

class SourceFilterPanel extends ConsumerWidget {
  const SourceFilterPanel({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sourcesAsync = ref.watch(sourcesProvider);
    final filters = ref.watch(exploreFiltersProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(
            horizontal: AppConfig.spacingLg,
            vertical: AppConfig.spacingSm,
          ),
          child: Text(
            'Sources',
            style: TextStyle(
              color: AppConfig.onSurface,
              fontWeight: FontWeight.w600,
              fontSize: 16,
            ),
          ),
        ),
        sourcesAsync.when(
          data: (sources) => Column(
            children: sources.map((source) {
              final selected = filters.selectedSources.contains(source.key);
              return CheckboxListTile(
                value: selected,
                onChanged: (_) => ref
                    .read(exploreFiltersProvider.notifier)
                    .toggleSource(source.key),
                title: Text(
                  source.name,
                  style: const TextStyle(
                    color: AppConfig.onSurface,
                    fontSize: 14,
                  ),
                ),
                secondary: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppConfig.spacingSm,
                    vertical: AppConfig.spacingXs,
                  ),
                  decoration: BoxDecoration(
                    color: AppConfig.surfaceVariant,
                    borderRadius: BorderRadius.circular(AppConfig.radiusFull),
                  ),
                  child: Text(
                    '${source.postCount}',
                    style: const TextStyle(
                      color: AppConfig.mutedText,
                      fontSize: 12,
                    ),
                  ),
                ),
                activeColor: AppConfig.primary,
                dense: true,
                controlAffinity: ListTileControlAffinity.leading,
              );
            }).toList(),
          ),
          loading: () => const Padding(
            padding: EdgeInsets.all(AppConfig.spacingLg),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (_, _) => const Padding(
            padding: EdgeInsets.all(AppConfig.spacingLg),
            child: Text(
              'Failed to load sources',
              style: TextStyle(color: AppConfig.error),
            ),
          ),
        ),
      ],
    );
  }
}
