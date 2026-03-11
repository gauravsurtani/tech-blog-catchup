import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/paginated_posts.dart';
import '../../theme/app_config.dart';
import 'explore_filters_provider.dart';
import 'explore_provider.dart';
import 'pagination_bar.dart';
import 'post_card.dart';
import 'search_bar.dart';
import 'source_filter_panel.dart';
import 'tag_filter_panel.dart';

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  static const _sortOptions = {
    '-published_at': 'Newest',
    'published_at': 'Oldest',
    '-quality_score': 'Highest Quality',
    'title': 'Title A-Z',
  };

  @override
  Widget build(BuildContext context) {
    final filters = ref.watch(exploreFiltersProvider);
    final postsAsync = ref.watch(exploreProvider);

    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        title: const Text('Explore'),
      ),
      endDrawer: _buildDrawer(),
      body: Column(
        children: [
          ExploreSearchBar(
            onSearch: (q) =>
                ref.read(exploreFiltersProvider.notifier).setSearch(q),
          ),
          _buildSortRow(filters),
          const SizedBox(height: AppConfig.spacingSm),
          _buildGrid(postsAsync),
        ],
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      backgroundColor: AppConfig.surface,
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(AppConfig.spacingLg),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Filters',
                    style: TextStyle(
                      color: AppConfig.onSurface,
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  TextButton(
                    onPressed: () => ref
                        .read(exploreFiltersProvider.notifier)
                        .clearAll(),
                    child: const Text('Clear All'),
                  ),
                ],
              ),
            ),
            const Divider(),
            const Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    SourceFilterPanel(),
                    SizedBox(height: AppConfig.spacingLg),
                    TagFilterPanel(),
                    SizedBox(height: AppConfig.spacingLg),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSortRow(ExploreFiltersState filters) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppConfig.spacingLg),
      child: Row(
        children: [
          DropdownButton<String>(
            value: filters.sortBy,
            underline: const SizedBox.shrink(),
            dropdownColor: AppConfig.surface,
            style: const TextStyle(
              color: AppConfig.textSecondary,
              fontSize: 14,
            ),
            items: _sortOptions.entries
                .map((e) => DropdownMenuItem(
                      value: e.key,
                      child: Text(e.value),
                    ))
                .toList(),
            onChanged: (val) {
              if (val != null) {
                ref.read(exploreFiltersProvider.notifier).setSort(val);
              }
            },
          ),
          const Spacer(),
          OutlinedButton.icon(
            onPressed: () =>
                _scaffoldKey.currentState?.openEndDrawer(),
            icon: const Icon(Icons.filter_list, size: 18),
            label: Text(
              _activeFilterCount(filters) > 0
                  ? 'Filters (${_activeFilterCount(filters)})'
                  : 'Filters',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGrid(AsyncValue<PaginatedPosts> postsAsync) {
    return Expanded(
      child: postsAsync.when(
        data: (paginated) {
          if (paginated.posts.isEmpty) {
            return const Center(
              child: Text(
                'No posts found',
                style: TextStyle(color: AppConfig.mutedText, fontSize: 16),
              ),
            );
          }
          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppConfig.spacingSm,
                  ),
                  itemCount: paginated.posts.length,
                  itemBuilder: (context, index) =>
                      PostCard(post: paginated.posts[index]),
                ),
              ),
              PaginationBar(
                total: paginated.total,
                pageSize: AppConfig.explorePageSize,
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Failed to load posts',
                style: TextStyle(color: AppConfig.error, fontSize: 16),
              ),
              const SizedBox(height: AppConfig.spacingSm),
              ElevatedButton(
                onPressed: () => ref.invalidate(exploreProvider),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  int _activeFilterCount(ExploreFiltersState filters) {
    return filters.selectedSources.length + filters.selectedTags.length;
  }
}
