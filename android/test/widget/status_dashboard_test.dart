import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tech_blog_catchup/features/player/audio_player_provider.dart';
import 'package:tech_blog_catchup/features/player/audio_player_state.dart';
import 'package:tech_blog_catchup/features/status/status_provider.dart';
import 'package:tech_blog_catchup/features/status/status_screen.dart';

import 'helpers/fixtures.dart';
import 'helpers/mock_api_client.dart';
import 'helpers/test_app.dart';
import 'pages/status_page.dart';

class MockAudioPlayerNotifier extends Mock implements AudioPlayerNotifier {}

void main() {
  late MockApiClient mockApi;
  late MockAudioPlayerNotifier mockAudioPlayer;

  setUp(() {
    mockApi = MockApiClient();
    mockAudioPlayer = MockAudioPlayerNotifier();
    when(() => mockAudioPlayer.state).thenReturn(const AudioPlayerState());
  });

  group('StatusScreen', () {
    testWidgets('shows Dashboard title', (tester) async {
      await tester.pumpWidget(
        buildSingleScreenTestApp(
          mockApi: mockApi,
          child: const StatusScreen(),
          extraOverrides: [
            statusProvider.overrideWith((ref) async => testStatusInfo),
            crawlStatusProvider.overrideWith((ref) async => testCrawlStatus),
            audioPlayerProvider
                .overrideWith((_) => mockAudioPlayer),
          ],
        ),
      );
      await tester.pumpAndSettle();

      final page = StatusPageObject(tester);
      expect(page.appBarTitle, findsOneWidget);
    });

    testWidgets('shows total posts count', (tester) async {
      await tester.pumpWidget(
        buildSingleScreenTestApp(
          mockApi: mockApi,
          child: const StatusScreen(),
          extraOverrides: [
            statusProvider.overrideWith((ref) async => testStatusInfo),
            crawlStatusProvider.overrideWith((ref) async => testCrawlStatus),
            audioPlayerProvider
                .overrideWith((_) => mockAudioPlayer),
          ],
        ),
      );
      await tester.pumpAndSettle();

      final page = StatusPageObject(tester);
      expect(page.totalPostsText, findsOneWidget);
      expect(find.text('25 Total Posts'), findsOneWidget);
    });

    testWidgets('shows Crawl All Sources button', (tester) async {
      await tester.pumpWidget(
        buildSingleScreenTestApp(
          mockApi: mockApi,
          child: const StatusScreen(),
          extraOverrides: [
            statusProvider.overrideWith((ref) async => testStatusInfo),
            crawlStatusProvider.overrideWith((ref) async => testCrawlStatus),
            audioPlayerProvider
                .overrideWith((_) => mockAudioPlayer),
          ],
        ),
      );
      await tester.pumpAndSettle();

      final page = StatusPageObject(tester);
      expect(page.crawlButton, findsOneWidget);
    });

    testWidgets('shows Generate Podcasts button', (tester) async {
      await tester.pumpWidget(
        buildSingleScreenTestApp(
          mockApi: mockApi,
          child: const StatusScreen(),
          extraOverrides: [
            statusProvider.overrideWith((ref) async => testStatusInfo),
            crawlStatusProvider.overrideWith((ref) async => testCrawlStatus),
            audioPlayerProvider
                .overrideWith((_) => mockAudioPlayer),
          ],
        ),
      );
      await tester.pumpAndSettle();

      final page = StatusPageObject(tester);
      expect(page.generateButton, findsOneWidget);
    });
  });
}
