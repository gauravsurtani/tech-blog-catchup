import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../models/post.dart';
import '../../theme/app_config.dart';

class HomeState {
  final List<Post> posts;
  final bool isLoading;
  final bool hasMore;
  final int pendingCount;
  final String? error;

  const HomeState({
    this.posts = const [],
    this.isLoading = false,
    this.hasMore = true,
    this.pendingCount = 0,
    this.error,
  });

  HomeState copyWith({
    List<Post>? posts,
    bool? isLoading,
    bool? hasMore,
    int? pendingCount,
    String? error,
  }) {
    return HomeState(
      posts: posts ?? this.posts,
      isLoading: isLoading ?? this.isLoading,
      hasMore: hasMore ?? this.hasMore,
      pendingCount: pendingCount ?? this.pendingCount,
      error: error,
    );
  }
}

class HomeNotifier extends StateNotifier<HomeState> {
  HomeNotifier(this._ref) : super(const HomeState()) {
    loadInitial();
  }

  final Ref _ref;

  Future<void> loadInitial() async {
    state = state.copyWith(isLoading: true, error: null);
    final api = _ref.read(apiClientProvider);

    try {
      final result = await api.getPosts(
        audioStatus: 'ready',
        sort: '-published_at',
        limit: AppConfig.homePageSize,
        offset: 0,
      );

      // Fetch pending count separately
      final pendingResult = await api.getPosts(
        audioStatus: 'pending',
        limit: 1,
        offset: 0,
      );

      state = state.copyWith(
        posts: result.posts,
        isLoading: false,
        hasMore: result.posts.length < result.total,
        pendingCount: pendingResult.total,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> loadMore() async {
    if (state.isLoading || !state.hasMore) return;

    state = state.copyWith(isLoading: true);
    final api = _ref.read(apiClientProvider);

    try {
      final result = await api.getPosts(
        audioStatus: 'ready',
        sort: '-published_at',
        limit: AppConfig.homePageSize,
        offset: state.posts.length,
      );

      final allPosts = [...state.posts, ...result.posts];
      state = state.copyWith(
        posts: allPosts,
        isLoading: false,
        hasMore: allPosts.length < result.total,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> refresh() async {
    state = const HomeState();
    await loadInitial();
  }
}

final homeProvider = StateNotifierProvider<HomeNotifier, HomeState>(
  HomeNotifier.new,
);
