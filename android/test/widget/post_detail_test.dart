import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tech_blog_catchup/features/post/post_detail_screen.dart';
import 'package:tech_blog_catchup/models/post.dart';

import 'helpers/fixtures.dart';
import 'helpers/mock_api_client.dart';
import 'helpers/test_app.dart';
import 'pages/post_detail_page.dart';

void main() {
  late MockApiClient mockApi;
  late PostDetailPageObject page;

  setUp(() {
    mockApi = MockApiClient();
  });

  Widget buildPostDetail({String postId = '1'}) {
    return buildSingleScreenTestApp(
      mockApi: mockApi,
      child: PostDetailScreen(postId: postId),
    );
  }

  /// Pump enough frames for async FutureProvider to resolve without
  /// waiting for all animations (pumpAndSettle can time out if there are
  /// infinite animations like CircularProgressIndicator).
  Future<void> pumpUntilFound(
    WidgetTester tester,
    Finder finder, {
    Duration timeout = const Duration(seconds: 5),
  }) async {
    final end = tester.binding.clock.now().add(timeout);
    while (tester.binding.clock.now().isBefore(end)) {
      await tester.pump(const Duration(milliseconds: 100));
      if (finder.evaluate().isNotEmpty) return;
    }
  }

  group('PostDetailScreen', () {
    testWidgets('shows post title in app bar', (tester) async {
      when(() => mockApi.getPost(1)).thenAnswer((_) async => postDetail);

      await tester.pumpWidget(buildPostDetail());
      await pumpUntilFound(
        tester,
        find.text('Building Scalable ML Pipelines'),
      );

      page = PostDetailPageObject(tester);
      // Title appears both in AppBar and in MarkdownBody content.
      // Verify it exists at least once (the AppBar has it).
      expect(
        page.titleInAppBar('Building Scalable ML Pipelines'),
        findsAtLeastNWidgets(1),
      );
    });

    testWidgets('renders markdown content', (tester) async {
      when(() => mockApi.getPost(1)).thenAnswer((_) async => postDetail);

      await tester.pumpWidget(buildPostDetail());
      await pumpUntilFound(tester, find.text('Building Scalable ML Pipelines'));

      page = PostDetailPageObject(tester);
      expect(page.markdownBody, findsOneWidget);
    });

    testWidgets('shows no content available when fullText is null',
        (tester) async {
      const noContentDetail = PostDetail(
        id: 10,
        url: 'https://example.com/post-10',
        sourceKey: 'test',
        sourceName: 'Test Blog',
        title: 'Empty Post',
        audioStatus: 'pending',
      );
      when(() => mockApi.getPost(10)).thenAnswer((_) async => noContentDetail);

      await tester.pumpWidget(buildPostDetail(postId: '10'));
      await pumpUntilFound(tester, find.text('Empty Post'));

      page = PostDetailPageObject(tester);
      expect(page.noContentText, findsOneWidget);
      expect(page.markdownBody, findsNothing);
    });

    testWidgets('shows play button for ready post', (tester) async {
      when(() => mockApi.getPost(1)).thenAnswer((_) async => postDetail);

      await tester.pumpWidget(buildPostDetail());
      await pumpUntilFound(tester, find.text('Play'));

      page = PostDetailPageObject(tester);
      expect(page.playButton, findsOneWidget);
      expect(page.generateButton, findsNothing);
    });

    testWidgets('shows generate button for pending post', (tester) async {
      when(() => mockApi.getPost(4))
          .thenAnswer((_) async => pendingPostDetail);

      await tester.pumpWidget(buildPostDetail(postId: '4'));
      await pumpUntilFound(tester, find.text('Generate Podcast'));

      page = PostDetailPageObject(tester);
      expect(page.generateButton, findsOneWidget);
      expect(page.playButton, findsNothing);
    });
  });
}
