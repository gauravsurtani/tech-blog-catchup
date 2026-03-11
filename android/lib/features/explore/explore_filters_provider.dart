import 'package:flutter_riverpod/flutter_riverpod.dart';

class ExploreFiltersState {
  final Set<String> selectedSources;
  final Set<String> selectedTags;
  final String searchQuery;
  final String sortBy;
  final int currentPage;

  const ExploreFiltersState({
    this.selectedSources = const {},
    this.selectedTags = const {},
    this.searchQuery = '',
    this.sortBy = '-published_at',
    this.currentPage = 0,
  });

  ExploreFiltersState copyWith({
    Set<String>? selectedSources,
    Set<String>? selectedTags,
    String? searchQuery,
    String? sortBy,
    int? currentPage,
  }) {
    return ExploreFiltersState(
      selectedSources: selectedSources ?? this.selectedSources,
      selectedTags: selectedTags ?? this.selectedTags,
      searchQuery: searchQuery ?? this.searchQuery,
      sortBy: sortBy ?? this.sortBy,
      currentPage: currentPage ?? this.currentPage,
    );
  }
}

class ExploreFiltersNotifier extends StateNotifier<ExploreFiltersState> {
  ExploreFiltersNotifier() : super(const ExploreFiltersState());

  void toggleSource(String source) {
    final updated = {...state.selectedSources};
    if (updated.contains(source)) {
      updated.remove(source);
    } else {
      updated.add(source);
    }
    state = state.copyWith(selectedSources: updated, currentPage: 0);
  }

  void toggleTag(String tag) {
    final updated = {...state.selectedTags};
    if (updated.contains(tag)) {
      updated.remove(tag);
    } else {
      updated.add(tag);
    }
    state = state.copyWith(selectedTags: updated, currentPage: 0);
  }

  void setSearch(String query) {
    state = state.copyWith(searchQuery: query, currentPage: 0);
  }

  void setSort(String sort) {
    state = state.copyWith(sortBy: sort, currentPage: 0);
  }

  void setPage(int page) {
    state = state.copyWith(currentPage: page);
  }

  void clearAll() {
    state = const ExploreFiltersState();
  }
}

final exploreFiltersProvider =
    StateNotifierProvider<ExploreFiltersNotifier, ExploreFiltersState>(
  (ref) => ExploreFiltersNotifier(),
);
