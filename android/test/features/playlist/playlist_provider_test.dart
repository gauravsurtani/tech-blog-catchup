import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:tech_blog_catchup/features/player/audio_player_provider.dart';
import 'package:tech_blog_catchup/features/player/audio_player_state.dart';
import 'package:tech_blog_catchup/features/playlist/playlist_provider.dart';
import 'package:tech_blog_catchup/models/post.dart';

class MockAudioPlayerNotifier extends StateNotifier<AudioPlayerState>
    with Mock
    implements AudioPlayerNotifier {
  MockAudioPlayerNotifier() : super(const AudioPlayerState());
}

const _post1 = Post(
  id: 1,
  url: 'u1',
  sourceKey: 's',
  sourceName: 'S',
  title: 'T1',
  audioStatus: 'ready',
  audioPath: 'audio/p1.mp3',
);

const _post2 = Post(
  id: 2,
  url: 'u2',
  sourceKey: 's',
  sourceName: 'S',
  title: 'T2',
  audioStatus: 'ready',
  audioPath: 'audio/p2.mp3',
);

const _post3 = Post(
  id: 3,
  url: 'u3',
  sourceKey: 's',
  sourceName: 'S',
  title: 'T3',
  audioStatus: 'ready',
  audioPath: 'audio/p3.mp3',
);

void main() {
  late MockAudioPlayerNotifier mockAudioPlayer;
  late PlaylistNotifier notifier;

  setUpAll(() {
    registerFallbackValue(_post1);
  });

  setUp(() {
    mockAudioPlayer = MockAudioPlayerNotifier();
    notifier = PlaylistNotifier(mockAudioPlayer);
  });

  tearDown(() {
    notifier.dispose();
    mockAudioPlayer.dispose();
  });

  group('PlaylistNotifier', () {
    test('add appends post to state', () {
      notifier.add(_post1);
      expect(notifier.state, [_post1]);

      notifier.add(_post2);
      expect(notifier.state, [_post1, _post2]);
    });

    test('add deduplicates by id', () {
      notifier.add(_post1);
      notifier.add(_post1);
      expect(notifier.state.length, 1);
    });

    test('remove at valid index removes the post', () {
      notifier.add(_post1);
      notifier.add(_post2);
      notifier.add(_post3);

      notifier.remove(1);

      expect(notifier.state, [_post1, _post3]);
    });

    test('remove at invalid index does nothing', () {
      notifier.add(_post1);

      notifier.remove(-1);
      expect(notifier.state, [_post1]);

      notifier.remove(5);
      expect(notifier.state, [_post1]);
    });

    test('reorder moves item correctly', () {
      notifier.add(_post1);
      notifier.add(_post2);
      notifier.add(_post3);

      // Move item at index 0 to index 2
      notifier.reorder(0, 2);
      expect(notifier.state, [_post2, _post1, _post3]);
    });

    test('clear empties state', () {
      notifier.add(_post1);
      notifier.add(_post2);

      notifier.clear();

      expect(notifier.state, isEmpty);
    });

    test('playAll clears queue, queues skip(1) posts, plays first, empties state', () {
      when(() => mockAudioPlayer.clearQueue()).thenReturn(null);
      when(() => mockAudioPlayer.addToQueue(any())).thenReturn(null);
      when(() => mockAudioPlayer.play(any())).thenAnswer((_) async {});

      notifier.add(_post1);
      notifier.add(_post2);
      notifier.add(_post3);

      notifier.playAll();

      // Playlist should be empty after playAll
      expect(notifier.state, isEmpty);

      // Verify audio player interactions
      verify(() => mockAudioPlayer.clearQueue()).called(1);
      verify(() => mockAudioPlayer.addToQueue(_post2)).called(1);
      verify(() => mockAudioPlayer.addToQueue(_post3)).called(1);
      verify(() => mockAudioPlayer.play(_post1)).called(1);
    });
  });
}
