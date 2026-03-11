import 'package:freezed_annotation/freezed_annotation.dart';
import '../../models/post.dart';

part 'audio_player_state.freezed.dart';

@freezed
class AudioPlayerState with _$AudioPlayerState {
  const factory AudioPlayerState({
    Post? currentTrack,
    @Default([]) List<Post> queue,
    @Default([]) List<Post> history,
    @Default(false) bool isPlaying,
    @Default(Duration.zero) Duration position,
    @Default(Duration.zero) Duration duration,
    @Default(1.0) double volume,
    @Default(1.0) double playbackRate,
    @Default(false) bool isExpanded,
  }) = _AudioPlayerState;
}
