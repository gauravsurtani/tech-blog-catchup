import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tech_blog_catchup/features/explore/explore_screen.dart';
import 'package:tech_blog_catchup/models/paginated_posts.dart';

import 'helpers/fixtures.dart';
import 'helpers/mock_api_client.dart';
import 'helpers/test_app.dart';
import 'pages/explore_page.dart';

void main() {
  late MockApiClient mockApi;
  late ExplorePageObject page;

  setUp(() {
    mockApi = MockApiClient();
  });

  /// Stub all calls that ExploreScreen's providers make on init.
  void stubExploreDefaults() {
    when(() => mockApi.getPosts(
          sort: any(named: 'sort'),
          offset: any(named: 'offset'),
          limit: any(named: 'limit'),
          source: any(named: 'source'),
          tag: any(named: 'tag'),
          search: any(named: 'search'),
          audioStatus: any(named: 'audioStatus'),
          qualityMin: any(named: 'qualityMin'),
        )).thenAnswer((_) async => paginatedExplore());

    when(() => mockApi.getSources()).thenAnswer((_) async => testSources);
    when(() => mockApi.getTags()).thenAnswer((_) async => testTags);
  }

  Widget buildExplore() {
    return buildSingleScreenTestApp(
      mockApi: mockApi,
      child: const ExploreScreen(),
    );
  }

  group('ExploreScreen', () {
    testWidgets('shows explore screen with app bar', (tester) async {
      stubExploreDefaults();

      await tester.pumpWidget(buildExplore());
      await tester.pumpAndSettle();

      page = ExplorePageObject(tester);
      expect(page.appBarTitle, findsOneWidget);
      // At least some post cards should render (not all may be visible)
      expect(page.postCards, findsWidgets);
    });

    testWidgets('displays post card titles', (tester) async {
      stubExploreDefaults();

      await tester.pumpWidget(buildExplore());
      await tester.pumpAndSettle();

      page = ExplorePageObject(tester);
      // The first post should be visible without scrolling
      expect(
        page.postTitle('Building Scalable ML Pipelines'),
        findsOneWidget,
      );
    });

    testWidgets('shows search field', (tester) async {
      stubExploreDefaults();

      await tester.pumpWidget(buildExplore());
      await tester.pumpAndSettle();

      page = ExplorePageObject(tester);
      expect(page.searchField, findsOneWidget);
      expect(find.text('Search posts...'), findsOneWidget);
    });

    testWidgets('shows sort dropdown', (tester) async {
      stubExploreDefaults();

      await tester.pumpWidget(buildExplore());
      await tester.pumpAndSettle();

      page = ExplorePageObject(tester);
      expect(page.sortDropdown, findsOneWidget);
      // Default sort label
      expect(find.text('Newest'), findsOneWidget);
    });

    testWidgets('shows filters button', (tester) async {
      stubExploreDefaults();

      await tester.pumpWidget(buildExplore());
      await tester.pumpAndSettle();

      page = ExplorePageObject(tester);
      expect(page.filtersButton, findsOneWidget);
    });

    testWidgets('shows empty state with no results', (tester) async {
      when(() => mockApi.getPosts(
            sort: any(named: 'sort'),
            offset: any(named: 'offset'),
            limit: any(named: 'limit'),
            source: any(named: 'source'),
            tag: any(named: 'tag'),
            search: any(named: 'search'),
            audioStatus: any(named: 'audioStatus'),
            qualityMin: any(named: 'qualityMin'),
          )).thenAnswer((_) async => const PaginatedPosts(
            posts: [],
            total: 0,
            offset: 0,
            limit: 20,
          ));
      when(() => mockApi.getSources()).thenAnswer((_) async => testSources);
      when(() => mockApi.getTags()).thenAnswer((_) async => testTags);

      await tester.pumpWidget(buildExplore());
      await tester.pumpAndSettle();

      page = ExplorePageObject(tester);
      expect(page.emptyStateText, findsOneWidget);
      expect(page.postCards, findsNothing);
    });
  });
}
