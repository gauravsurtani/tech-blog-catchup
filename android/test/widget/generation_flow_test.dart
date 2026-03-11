import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:tech_blog_catchup/features/generate/generation_banner.dart';
import 'package:tech_blog_catchup/features/generate/generation_provider.dart';
import 'package:tech_blog_catchup/features/player/audio_player_provider.dart';
import 'package:tech_blog_catchup/features/player/audio_player_state.dart';
import 'package:tech_blog_catchup/theme/app_config.dart';

import 'helpers/mock_api_client.dart';
import 'helpers/test_app.dart';

class MockAudioPlayerNotifier extends Mock implements AudioPlayerNotifier {}

/// A test notifier that lets us set the initial state directly.
class _TestGenerationNotifier extends GenerationNotifier {
  _TestGenerationNotifier(super.ref, {required GenerationState initialState}) {
    state = initialState;
  }
}

void main() {
  late MockApiClient mockApi;
  late MockAudioPlayerNotifier mockAudioPlayer;

  setUp(() {
    mockApi = MockApiClient();
    mockAudioPlayer = MockAudioPlayerNotifier();
    when(() => mockAudioPlayer.state).thenReturn(const AudioPlayerState());
  });

  group('GenerationBanner', () {
    testWidgets('hidden when no active jobs', (tester) async {
      await tester.pumpWidget(
        buildSingleScreenTestApp(
          mockApi: mockApi,
          child: const GenerationBanner(),
          extraOverrides: [
            audioPlayerProvider
                .overrideWith((_) => mockAudioPlayer),
            generationProvider.overrideWith(
              (ref) => _TestGenerationNotifier(
                ref,
                initialState: const GenerationState(),
              ),
            ),
          ],
        ),
      );
      await tester.pumpAndSettle();

      // Banner renders SizedBox.shrink when no active jobs
      expect(find.text('Generating podcasts...'), findsNothing);
    });

    testWidgets('shows text when jobs active', (tester) async {
      await tester.pumpWidget(
        buildSingleScreenTestApp(
          mockApi: mockApi,
          child: const GenerationBanner(),
          extraOverrides: [
            audioPlayerProvider
                .overrideWith((_) => mockAudioPlayer),
            generationProvider.overrideWith(
              (ref) => _TestGenerationNotifier(
                ref,
                initialState: const GenerationState(
                  isGenerating: true,
                  activeJobIds: {1},
                ),
              ),
            ),
          ],
        ),
      );
      // Use pump() instead of pumpAndSettle() because the
      // CircularProgressIndicator animates indefinitely.
      await tester.pump();

      expect(find.text('Generating podcasts...'), findsOneWidget);
    });

    testWidgets('shows progress indicator when generating', (tester) async {
      await tester.pumpWidget(
        buildSingleScreenTestApp(
          mockApi: mockApi,
          child: const GenerationBanner(),
          extraOverrides: [
            audioPlayerProvider
                .overrideWith((_) => mockAudioPlayer),
            generationProvider.overrideWith(
              (ref) => _TestGenerationNotifier(
                ref,
                initialState: const GenerationState(
                  isGenerating: true,
                  activeJobIds: {1},
                ),
              ),
            ),
          ],
        ),
      );
      await tester.pump();

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('has correct indigo background color', (tester) async {
      await tester.pumpWidget(
        buildSingleScreenTestApp(
          mockApi: mockApi,
          child: const GenerationBanner(),
          extraOverrides: [
            audioPlayerProvider
                .overrideWith((_) => mockAudioPlayer),
            generationProvider.overrideWith(
              (ref) => _TestGenerationNotifier(
                ref,
                initialState: const GenerationState(
                  isGenerating: true,
                  activeJobIds: {1},
                ),
              ),
            ),
          ],
        ),
      );
      await tester.pump();

      final container = tester.widget<Container>(
        find.byType(Container).first,
      );
      expect(container.color, equals(AppConfig.generationBanner));
    });
  });
}
