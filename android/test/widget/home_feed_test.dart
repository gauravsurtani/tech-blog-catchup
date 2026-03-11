import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tech_blog_catchup/features/home/home_screen.dart';
import 'package:tech_blog_catchup/models/paginated_posts.dart';

import 'helpers/fixtures.dart';
import 'helpers/mock_api_client.dart';
import 'helpers/test_app.dart';
import 'pages/home_page.dart';

void main() {
  late MockApiClient mockApi;
  late HomePageObject page;

  setUp(() {
    mockApi = MockApiClient();
  });

  /// Helper: stub both getPosts calls that HomeNotifier.loadInitial() makes.
  void stubHomeDefaults() {
    when(() => mockApi.getPosts(
          audioStatus: 'ready',
          sort: '-published_at',
          limit: 12,
          offset: 0,
        )).thenAnswer((_) async => paginatedReady());

    when(() => mockApi.getPosts(
          audioStatus: 'pending',
          limit: 1,
          offset: 0,
        )).thenAnswer((_) async => paginatedPending());
  }

  Widget buildHome() {
    return buildSingleScreenTestApp(
      mockApi: mockApi,
      child: const HomeScreen(),
    );
  }

  group('HomeScreen', () {
    testWidgets('shows loading spinner initially', (tester) async {
      // Use a completer that never resolves so the loading state persists.
      final neverReady = Completer<PaginatedPosts>();
      final neverPending = Completer<PaginatedPosts>();

      when(() => mockApi.getPosts(
            audioStatus: 'ready',
            sort: '-published_at',
            limit: 12,
            offset: 0,
          )).thenAnswer((_) => neverReady.future);
      when(() => mockApi.getPosts(
            audioStatus: 'pending',
            limit: 1,
            offset: 0,
          )).thenAnswer((_) => neverPending.future);

      await tester.pumpWidget(buildHome());
      // Pump once to let the widget tree build with loading state.
      await tester.pump();

      page = HomePageObject(tester);
      expect(page.loadingIndicator, findsOneWidget);
    });

    testWidgets('displays ready posts after load', (tester) async {
      stubHomeDefaults();

      await tester.pumpWidget(buildHome());
      await tester.pumpAndSettle();

      page = HomePageObject(tester);
      expect(page.appBarTitle, findsOneWidget);
      expect(page.postItems, findsNWidgets(readyPosts.length));
      expect(page.postTitle('Building Scalable ML Pipelines'), findsOneWidget);
      expect(
        page.postTitle('React Server Components Deep Dive'),
        findsOneWidget,
      );
    });

    testWidgets('shows pending footer with count', (tester) async {
      stubHomeDefaults();

      await tester.pumpWidget(buildHome());
      await tester.pumpAndSettle();

      page = HomePageObject(tester);
      // Drag the list up to reveal the footer at the bottom.
      await tester.drag(find.byType(ListView), const Offset(0, -500));
      await tester.pumpAndSettle();

      expect(page.pendingFooter, findsOneWidget);
    });

    testWidgets('shows empty state when no posts', (tester) async {
      when(() => mockApi.getPosts(
            audioStatus: 'ready',
            sort: '-published_at',
            limit: 12,
            offset: 0,
          )).thenAnswer((_) async => const PaginatedPosts(
            posts: [],
            total: 0,
            offset: 0,
            limit: 12,
          ));
      when(() => mockApi.getPosts(
            audioStatus: 'pending',
            limit: 1,
            offset: 0,
          )).thenAnswer((_) async => const PaginatedPosts(
            posts: [],
            total: 0,
            offset: 0,
            limit: 1,
          ));

      await tester.pumpWidget(buildHome());
      await tester.pumpAndSettle();

      page = HomePageObject(tester);
      expect(page.emptyStateText, findsOneWidget);
      expect(page.postItems, findsNothing);
    });

    testWidgets('shows error state on API failure', (tester) async {
      when(() => mockApi.getPosts(
            audioStatus: 'ready',
            sort: '-published_at',
            limit: 12,
            offset: 0,
          )).thenThrow(Exception('Network error'));
      when(() => mockApi.getPosts(
            audioStatus: 'pending',
            limit: 1,
            offset: 0,
          )).thenThrow(Exception('Network error'));

      await tester.pumpWidget(buildHome());
      await tester.pumpAndSettle();

      page = HomePageObject(tester);
      expect(page.errorText, findsOneWidget);
      expect(page.retryButton, findsOneWidget);
    });
  });
}
