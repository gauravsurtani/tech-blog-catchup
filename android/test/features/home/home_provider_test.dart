import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tech_blog_catchup/core/providers.dart';
import 'package:tech_blog_catchup/features/home/home_provider.dart';
import 'package:tech_blog_catchup/models/paginated_posts.dart';
import 'package:tech_blog_catchup/services/api_client.dart';

import '../../widget/helpers/fixtures.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  late MockApiClient mockApi;

  setUp(() {
    mockApi = MockApiClient();
  });

  /// Sets up standard mocks for loadInitial (ready posts + pending count).
  void stubLoadInitial({int readyTotal = 3, int pendingTotal = 5}) {
    when(() => mockApi.getPosts(
          audioStatus: 'ready',
          sort: '-published_at',
          limit: any(named: 'limit'),
          offset: 0,
        )).thenAnswer((_) async => paginatedReady(total: readyTotal));

    when(() => mockApi.getPosts(
          audioStatus: 'pending',
          limit: 1,
          offset: 0,
        )).thenAnswer((_) async => paginatedPending(total: pendingTotal));
  }

  ProviderContainer createContainer() {
    final c = ProviderContainer(
      overrides: [apiClientProvider.overrideWithValue(mockApi)],
    );
    addTearDown(c.dispose);
    return c;
  }

  group('HomeNotifier', () {
    test('loadInitial fetches ready posts and pending count', () async {
      stubLoadInitial();
      final container = createContainer();

      // Reading the notifier triggers constructor -> loadInitial()
      container.read(homeProvider.notifier);

      // Let the async work complete
      await Future<void>.delayed(Duration.zero);

      final state = container.read(homeProvider);
      expect(state.posts, readyPosts);
      expect(state.pendingCount, 5);
      expect(state.isLoading, false);
      expect(state.error, isNull);
    });

    test('loadMore appends posts and updates hasMore', () async {
      // readyTotal > 3 means hasMore = true after initial load
      stubLoadInitial(readyTotal: 10);
      final container = createContainer();
      final notifier = container.read(homeProvider.notifier);
      await Future<void>.delayed(Duration.zero);

      // Stub the loadMore call (offset = 3, since initial loaded 3 posts)
      when(() => mockApi.getPosts(
            audioStatus: 'ready',
            sort: '-published_at',
            limit: any(named: 'limit'),
            offset: 3,
          )).thenAnswer((_) async => PaginatedPosts(
            posts: readyPosts,
            total: 10,
            offset: 3,
            limit: 12,
          ));

      await notifier.loadMore();

      final state = container.read(homeProvider);
      expect(state.posts.length, 6);
      expect(state.hasMore, true);
      expect(state.isLoading, false);
    });

    test('loadMore skips if isLoading', () async {
      stubLoadInitial(readyTotal: 10);
      final container = createContainer();
      final notifier = container.read(homeProvider.notifier);
      await Future<void>.delayed(Duration.zero);

      // Mock a slow API response
      when(() => mockApi.getPosts(
            audioStatus: 'ready',
            sort: '-published_at',
            limit: any(named: 'limit'),
            offset: 3,
          )).thenAnswer((_) async {
        await Future<void>.delayed(const Duration(milliseconds: 100));
        return PaginatedPosts(
          posts: readyPosts,
          total: 10,
          offset: 3,
          limit: 12,
        );
      });

      // Fire two concurrent loadMore calls
      final f1 = notifier.loadMore();
      final f2 = notifier.loadMore(); // should be skipped (isLoading=true)

      await Future.wait([f1, f2]);

      // getPosts for offset:3 should only be called once
      verify(() => mockApi.getPosts(
            audioStatus: 'ready',
            sort: '-published_at',
            limit: any(named: 'limit'),
            offset: 3,
          )).called(1);
    });

    test('refresh resets state and calls loadInitial again', () async {
      stubLoadInitial();
      final container = createContainer();
      final notifier = container.read(homeProvider.notifier);
      await Future<void>.delayed(Duration.zero);

      // Verify initial posts loaded
      expect(container.read(homeProvider).posts.length, 3);

      await notifier.refresh();

      final state = container.read(homeProvider);
      expect(state.posts, readyPosts);
      expect(state.isLoading, false);
      // loadInitial called twice: constructor + refresh
      verify(() => mockApi.getPosts(
            audioStatus: 'ready',
            sort: '-published_at',
            limit: any(named: 'limit'),
            offset: 0,
          )).called(2);
    });

    test('error handling sets error string', () async {
      when(() => mockApi.getPosts(
            audioStatus: 'ready',
            sort: '-published_at',
            limit: any(named: 'limit'),
            offset: 0,
          )).thenThrow(Exception('Connection refused'));

      final container = createContainer();
      container.read(homeProvider.notifier);
      await Future<void>.delayed(Duration.zero);

      final state = container.read(homeProvider);
      expect(state.isLoading, false);
      expect(state.error, contains('Connection refused'));
      expect(state.posts, isEmpty);
    });
  });
}
