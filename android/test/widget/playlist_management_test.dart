import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tech_blog_catchup/features/player/audio_player_provider.dart';
import 'package:tech_blog_catchup/features/player/audio_player_state.dart';
import 'package:tech_blog_catchup/features/playlist/playlist_provider.dart';
import 'package:tech_blog_catchup/features/playlist/playlist_screen.dart';

import 'helpers/fixtures.dart';
import 'helpers/mock_api_client.dart';
import 'helpers/test_app.dart';
import 'pages/playlist_page.dart';

/// Mock that satisfies the [AudioPlayerNotifier] type constraint
/// without touching native audio plugins.
class MockAudioPlayerNotifier extends Mock implements AudioPlayerNotifier {}

void main() {
  late MockApiClient mockApi;
  late MockAudioPlayerNotifier mockAudioPlayer;

  setUp(() {
    mockApi = MockApiClient();
    mockAudioPlayer = MockAudioPlayerNotifier();

    // AudioPlayerNotifier extends StateNotifier<AudioPlayerState>,
    // so we stub the state getter that StateNotifier exposes.
    when(() => mockAudioPlayer.state).thenReturn(const AudioPlayerState());
  });

  group('PlaylistScreen', () {
    testWidgets('shows empty state when playlist is empty', (tester) async {
      final notifier = PlaylistNotifier(mockAudioPlayer);

      await tester.pumpWidget(
        buildSingleScreenTestApp(
          mockApi: mockApi,
          child: const PlaylistScreen(),
          extraOverrides: [
            playlistProvider.overrideWith((_) => notifier),
            audioPlayerProvider
                .overrideWith((_) => mockAudioPlayer),
          ],
        ),
      );
      await tester.pumpAndSettle();

      final page = PlaylistPageObject(tester);
      expect(page.appBarTitle, findsOneWidget);
      expect(page.emptyStateText, findsOneWidget);
      expect(page.emptyStateSubtext, findsOneWidget);
    });

    testWidgets('hides Play All and Clear when empty', (tester) async {
      final notifier = PlaylistNotifier(mockAudioPlayer);

      await tester.pumpWidget(
        buildSingleScreenTestApp(
          mockApi: mockApi,
          child: const PlaylistScreen(),
          extraOverrides: [
            playlistProvider.overrideWith((_) => notifier),
            audioPlayerProvider
                .overrideWith((_) => mockAudioPlayer),
          ],
        ),
      );
      await tester.pumpAndSettle();

      final page = PlaylistPageObject(tester);
      expect(page.playAllButton, findsNothing);
      expect(page.clearButton, findsNothing);
    });

    testWidgets('shows tracks when playlist is non-empty', (tester) async {
      final notifier = PlaylistNotifier(mockAudioPlayer);
      notifier.add(readyPosts[0]);
      notifier.add(readyPosts[1]);

      await tester.pumpWidget(
        buildSingleScreenTestApp(
          mockApi: mockApi,
          child: const PlaylistScreen(),
          extraOverrides: [
            playlistProvider.overrideWith((_) => notifier),
            audioPlayerProvider
                .overrideWith((_) => mockAudioPlayer),
          ],
        ),
      );
      await tester.pumpAndSettle();

      final page = PlaylistPageObject(tester);
      expect(page.trackTitle(readyPosts[0].title), findsOneWidget);
      expect(page.trackTitle(readyPosts[1].title), findsOneWidget);
      expect(page.emptyStateText, findsNothing);
    });

    testWidgets('shows Play All and Clear when non-empty', (tester) async {
      final notifier = PlaylistNotifier(mockAudioPlayer);
      notifier.add(readyPosts[0]);

      await tester.pumpWidget(
        buildSingleScreenTestApp(
          mockApi: mockApi,
          child: const PlaylistScreen(),
          extraOverrides: [
            playlistProvider.overrideWith((_) => notifier),
            audioPlayerProvider
                .overrideWith((_) => mockAudioPlayer),
          ],
        ),
      );
      await tester.pumpAndSettle();

      final page = PlaylistPageObject(tester);
      expect(page.playAllButton, findsOneWidget);
      expect(page.clearButton, findsOneWidget);
    });
  });
}
