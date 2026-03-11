import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../models/paginated_posts.dart';
import '../../theme/app_config.dart';
import 'explore_filters_provider.dart';

final exploreProvider = FutureProvider<PaginatedPosts>((ref) async {
  final filters = ref.watch(exploreFiltersProvider);
  final api = ref.read(apiClientProvider);

  return api.getPosts(
    source: filters.selectedSources.isNotEmpty
        ? filters.selectedSources.join(',')
        : null,
    tag: filters.selectedTags.isNotEmpty
        ? filters.selectedTags.join(',')
        : null,
    search: filters.searchQuery.isNotEmpty ? filters.searchQuery : null,
    sort: filters.sortBy,
    offset: filters.currentPage * AppConfig.explorePageSize,
    limit: AppConfig.explorePageSize,
  );
});

final sourcesProvider = FutureProvider((ref) {
  final api = ref.read(apiClientProvider);
  return api.getSources();
});

final tagsProvider = FutureProvider((ref) {
  final api = ref.read(apiClientProvider);
  return api.getTags();
});
