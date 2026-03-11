import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:just_audio/just_audio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../models/post.dart';
import '../../theme/app_config.dart';
import 'audio_player_service.dart';
import 'audio_player_state.dart';

final audioPlayerProvider =
    StateNotifierProvider<AudioPlayerNotifier, AudioPlayerState>(
  (ref) => AudioPlayerNotifier(),
);

class AudioPlayerNotifier extends StateNotifier<AudioPlayerState> {
  AudioPlayerNotifier() : super(const AudioPlayerState()) {
    _service = AudioPlayerService();
    _init();
  }

  late final AudioPlayerService _service;
  final List<StreamSubscription<dynamic>> _subscriptions = [];

  Future<void> _init() async {
    await _restorePreferences();

    _subscriptions.add(
      _service.positionStream.listen((pos) {
        if (mounted) state = state.copyWith(position: pos);
      }),
    );

    _subscriptions.add(
      _service.durationStream.listen((dur) {
        if (mounted && dur != null) state = state.copyWith(duration: dur);
      }),
    );

    _subscriptions.add(
      _service.playingStream.listen((playing) {
        if (mounted) state = state.copyWith(isPlaying: playing);
      }),
    );

    _subscriptions.add(
      _service.processingStateStream.listen((procState) {
        if (procState == ProcessingState.completed) {
          playNext();
        }
      }),
    );
  }

  // ── Playback ──────────────────────────────────

  Future<void> play(Post post) async {
    if (state.currentTrack != null) {
      state = state.copyWith(
        history: [...state.history, state.currentTrack!],
      );
    }
    state = state.copyWith(
      currentTrack: post,
      position: Duration.zero,
      duration: Duration.zero,
    );
    await _service.play(post);
  }

  Future<void> pause() async {
    await _service.pause();
  }

  Future<void> resume() async {
    await _service.resume();
  }

  Future<void> togglePlayPause() async {
    if (state.isPlaying) {
      await pause();
    } else {
      await resume();
    }
  }

  Future<void> seekTo(Duration position) async {
    await _service.seekTo(position);
  }

  Future<void> seekForward() async {
    await _service.seekForward();
  }

  Future<void> seekBackward() async {
    await _service.seekBackward();
  }

  Future<void> setVolume(double volume) async {
    await _service.setVolume(volume);
    state = state.copyWith(volume: volume);
    await _savePreferences();
  }

  Future<void> setPlaybackRate(double rate) async {
    await _service.setPlaybackRate(rate);
    state = state.copyWith(playbackRate: rate);
    await _savePreferences();
  }

  void toggleExpanded() {
    state = state.copyWith(isExpanded: !state.isExpanded);
  }

  // ── Queue ─────────────────────────────────────

  void addToQueue(Post post) {
    state = state.copyWith(queue: [...state.queue, post]);
    _savePreferences();
  }

  void removeFromQueue(int index) {
    final updated = [...state.queue];
    if (index >= 0 && index < updated.length) {
      updated.removeAt(index);
      state = state.copyWith(queue: updated);
      _savePreferences();
    }
  }

  void reorderQueue(int oldIndex, int newIndex) {
    final updated = [...state.queue];
    if (newIndex > oldIndex) newIndex--;
    final item = updated.removeAt(oldIndex);
    updated.insert(newIndex, item);
    state = state.copyWith(queue: updated);
    _savePreferences();
  }

  void clearQueue() {
    state = state.copyWith(queue: []);
    _savePreferences();
  }

  Future<void> playNext() async {
    if (state.queue.isEmpty) {
      await _service.stop();
      state = state.copyWith(isPlaying: false);
      return;
    }
    final next = state.queue.first;
    final remaining = state.queue.sublist(1);
    state = state.copyWith(queue: remaining);
    await play(next);
    await _savePreferences();
  }

  Future<void> playPrevious() async {
    if (state.position.inSeconds >
        AppConfig.previousRestartThresholdSeconds) {
      await seekTo(Duration.zero);
      return;
    }
    if (state.history.isEmpty) {
      await seekTo(Duration.zero);
      return;
    }
    final prev = state.history.last;
    final updatedHistory =
        state.history.sublist(0, state.history.length - 1);
    if (state.currentTrack != null) {
      state = state.copyWith(
        queue: [state.currentTrack!, ...state.queue],
      );
    }
    state = state.copyWith(history: updatedHistory);
    state = state.copyWith(
      currentTrack: prev,
      position: Duration.zero,
      duration: Duration.zero,
    );
    await _service.play(prev);
  }

  // ── Persistence ───────────────────────────────

  static const _prefsKeyQueue = 'audio_player_queue';
  static const _prefsKeyVolume = 'audio_player_volume';
  static const _prefsKeyRate = 'audio_player_rate';

  Future<void> _savePreferences() async {
    final prefs = await SharedPreferences.getInstance();
    final queueJson =
        state.queue.map((p) => jsonEncode(p.toJson())).toList();
    await prefs.setStringList(_prefsKeyQueue, queueJson);
    await prefs.setDouble(_prefsKeyVolume, state.volume);
    await prefs.setDouble(_prefsKeyRate, state.playbackRate);
  }

  Future<void> _restorePreferences() async {
    final prefs = await SharedPreferences.getInstance();

    final volume =
        prefs.getDouble(_prefsKeyVolume) ?? AppConfig.defaultVolume;
    final rate =
        prefs.getDouble(_prefsKeyRate) ?? AppConfig.defaultPlaybackRate;

    final queueJson = prefs.getStringList(_prefsKeyQueue) ?? [];
    final queue = queueJson
        .map((s) => Post.fromJson(jsonDecode(s) as Map<String, dynamic>))
        .toList();

    state = state.copyWith(
      volume: volume,
      playbackRate: rate,
      queue: queue,
    );

    await _service.setVolume(volume);
    await _service.setPlaybackRate(rate);
  }

  @override
  void dispose() {
    for (final sub in _subscriptions) {
      sub.cancel();
    }
    _service.dispose();
    super.dispose();
  }
}
