import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/app_config.dart';
import 'explore_filters_provider.dart';
import 'explore_provider.dart';

class TagFilterPanel extends ConsumerWidget {
  const TagFilterPanel({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tagsAsync = ref.watch(tagsProvider);
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
            'Tags',
            style: TextStyle(
              color: AppConfig.onSurface,
              fontWeight: FontWeight.w600,
              fontSize: 16,
            ),
          ),
        ),
        tagsAsync.when(
          data: (tags) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppConfig.spacingLg),
            child: Wrap(
              spacing: AppConfig.spacingSm,
              runSpacing: AppConfig.spacingSm,
              children: tags.map((tag) {
                final selected = filters.selectedTags.contains(tag.slug);
                return FilterChip(
                  selected: selected,
                  label: Text('${tag.name} (${tag.postCount})'),
                  onSelected: (_) => ref
                      .read(exploreFiltersProvider.notifier)
                      .toggleTag(tag.slug),
                  selectedColor: AppConfig.primaryMuted,
                  checkmarkColor: AppConfig.primary,
                );
              }).toList(),
            ),
          ),
          loading: () => const Padding(
            padding: EdgeInsets.all(AppConfig.spacingLg),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (_, _) => const Padding(
            padding: EdgeInsets.all(AppConfig.spacingLg),
            child: Text(
              'Failed to load tags',
              style: TextStyle(color: AppConfig.error),
            ),
          ),
        ),
      ],
    );
  }
}
