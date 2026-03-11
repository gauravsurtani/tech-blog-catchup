import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/post.dart';
import '../player/audio_player_provider.dart';

class PlaylistNotifier extends StateNotifier<List<Post>> {
  final AudioPlayerNotifier _audioPlayer;

  PlaylistNotifier(this._audioPlayer) : super([]);

  void add(Post post) {
    if (state.any((p) => p.id == post.id)) return;
    state = [...state, post];
  }

  void remove(int index) {
    if (index < 0 || index >= state.length) return;
    state = [...state]..removeAt(index);
  }

  void reorder(int oldIndex, int newIndex) {
    if (oldIndex < 0 || oldIndex >= state.length) return;
    final adjusted = newIndex > oldIndex ? newIndex - 1 : newIndex;
    if (adjusted < 0 || adjusted >= state.length) return;
    final items = [...state];
    final item = items.removeAt(oldIndex);
    items.insert(adjusted, item);
    state = items;
  }

  void clear() {
    state = [];
  }

  void playAll() {
    if (state.isEmpty) return;
    _audioPlayer.clearQueue();
    for (final post in state.skip(1)) {
      _audioPlayer.addToQueue(post);
    }
    _audioPlayer.play(state.first);
    state = [];
  }
}

final playlistProvider =
    StateNotifierProvider<PlaylistNotifier, List<Post>>((ref) {
  final audioPlayer = ref.read(audioPlayerProvider.notifier);
  return PlaylistNotifier(audioPlayer);
});
