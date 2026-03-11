import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tech_blog_catchup/features/player/audio_player_state.dart';
import 'package:tech_blog_catchup/models/post.dart';

/// A test-safe AudioPlayerNotifier that never touches native audio plugins.
class TestAudioPlayerNotifier extends StateNotifier<AudioPlayerState> {
  TestAudioPlayerNotifier() : super(const AudioPlayerState());

  Future<void> play(Post post) async {
    if (state.currentTrack != null) {
      state = state.copyWith(
        history: [...state.history, state.currentTrack!],
      );
    }
    state = state.copyWith(
      currentTrack: post,
      isPlaying: true,
      position: Duration.zero,
      duration: const Duration(minutes: 5),
    );
  }

  Future<void> pause() async {
    state = state.copyWith(isPlaying: false);
  }

  Future<void> resume() async {
    state = state.copyWith(isPlaying: true);
  }

  Future<void> togglePlayPause() async {
    if (state.isPlaying) {
      await pause();
    } else {
      await resume();
    }
  }

  Future<void> seekTo(Duration position) async {
    state = state.copyWith(position: position);
  }

  Future<void> seekForward() async {
    state = state.copyWith(
      position: state.position + const Duration(seconds: 10),
    );
  }

  Future<void> seekBackward() async {
    final newPos = state.position - const Duration(seconds: 10);
    state = state.copyWith(
      position: newPos.isNegative ? Duration.zero : newPos,
    );
  }

  Future<void> setVolume(double volume) async {
    state = state.copyWith(volume: volume);
  }

  Future<void> setPlaybackRate(double rate) async {
    state = state.copyWith(playbackRate: rate);
  }

  void toggleExpanded() {
    state = state.copyWith(isExpanded: !state.isExpanded);
  }

  void addToQueue(Post post) {
    state = state.copyWith(queue: [...state.queue, post]);
  }

  void removeFromQueue(int index) {
    final updated = [...state.queue];
    if (index >= 0 && index < updated.length) {
      updated.removeAt(index);
      state = state.copyWith(queue: updated);
    }
  }

  void clearQueue() {
    state = state.copyWith(queue: []);
  }

  Future<void> playNext() async {
    if (state.queue.isEmpty) {
      state = state.copyWith(isPlaying: false);
      return;
    }
    final next = state.queue.first;
    final remaining = state.queue.sublist(1);
    state = state.copyWith(queue: remaining);
    await play(next);
  }

  Future<void> playPrevious() async {
    await seekTo(Duration.zero);
  }

  void reorderQueue(int oldIndex, int newIndex) {
    final updated = [...state.queue];
    if (newIndex > oldIndex) newIndex--;
    final item = updated.removeAt(oldIndex);
    updated.insert(newIndex, item);
    state = state.copyWith(queue: updated);
  }
}
