// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'audio_player_state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

/// @nodoc
mixin _$AudioPlayerState {
  Post? get currentTrack => throw _privateConstructorUsedError;
  List<Post> get queue => throw _privateConstructorUsedError;
  List<Post> get history => throw _privateConstructorUsedError;
  bool get isPlaying => throw _privateConstructorUsedError;
  Duration get position => throw _privateConstructorUsedError;
  Duration get duration => throw _privateConstructorUsedError;
  double get volume => throw _privateConstructorUsedError;
  double get playbackRate => throw _privateConstructorUsedError;
  bool get isExpanded => throw _privateConstructorUsedError;

  /// Create a copy of AudioPlayerState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $AudioPlayerStateCopyWith<AudioPlayerState> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $AudioPlayerStateCopyWith<$Res> {
  factory $AudioPlayerStateCopyWith(
    AudioPlayerState value,
    $Res Function(AudioPlayerState) then,
  ) = _$AudioPlayerStateCopyWithImpl<$Res, AudioPlayerState>;
  @useResult
  $Res call({
    Post? currentTrack,
    List<Post> queue,
    List<Post> history,
    bool isPlaying,
    Duration position,
    Duration duration,
    double volume,
    double playbackRate,
    bool isExpanded,
  });

  $PostCopyWith<$Res>? get currentTrack;
}

/// @nodoc
class _$AudioPlayerStateCopyWithImpl<$Res, $Val extends AudioPlayerState>
    implements $AudioPlayerStateCopyWith<$Res> {
  _$AudioPlayerStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of AudioPlayerState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? currentTrack = freezed,
    Object? queue = null,
    Object? history = null,
    Object? isPlaying = null,
    Object? position = null,
    Object? duration = null,
    Object? volume = null,
    Object? playbackRate = null,
    Object? isExpanded = null,
  }) {
    return _then(
      _value.copyWith(
            currentTrack: freezed == currentTrack
                ? _value.currentTrack
                : currentTrack // ignore: cast_nullable_to_non_nullable
                      as Post?,
            queue: null == queue
                ? _value.queue
                : queue // ignore: cast_nullable_to_non_nullable
                      as List<Post>,
            history: null == history
                ? _value.history
                : history // ignore: cast_nullable_to_non_nullable
                      as List<Post>,
            isPlaying: null == isPlaying
                ? _value.isPlaying
                : isPlaying // ignore: cast_nullable_to_non_nullable
                      as bool,
            position: null == position
                ? _value.position
                : position // ignore: cast_nullable_to_non_nullable
                      as Duration,
            duration: null == duration
                ? _value.duration
                : duration // ignore: cast_nullable_to_non_nullable
                      as Duration,
            volume: null == volume
                ? _value.volume
                : volume // ignore: cast_nullable_to_non_nullable
                      as double,
            playbackRate: null == playbackRate
                ? _value.playbackRate
                : playbackRate // ignore: cast_nullable_to_non_nullable
                      as double,
            isExpanded: null == isExpanded
                ? _value.isExpanded
                : isExpanded // ignore: cast_nullable_to_non_nullable
                      as bool,
          )
          as $Val,
    );
  }

  /// Create a copy of AudioPlayerState
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $PostCopyWith<$Res>? get currentTrack {
    if (_value.currentTrack == null) {
      return null;
    }

    return $PostCopyWith<$Res>(_value.currentTrack!, (value) {
      return _then(_value.copyWith(currentTrack: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$AudioPlayerStateImplCopyWith<$Res>
    implements $AudioPlayerStateCopyWith<$Res> {
  factory _$$AudioPlayerStateImplCopyWith(
    _$AudioPlayerStateImpl value,
    $Res Function(_$AudioPlayerStateImpl) then,
  ) = __$$AudioPlayerStateImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    Post? currentTrack,
    List<Post> queue,
    List<Post> history,
    bool isPlaying,
    Duration position,
    Duration duration,
    double volume,
    double playbackRate,
    bool isExpanded,
  });

  @override
  $PostCopyWith<$Res>? get currentTrack;
}

/// @nodoc
class __$$AudioPlayerStateImplCopyWithImpl<$Res>
    extends _$AudioPlayerStateCopyWithImpl<$Res, _$AudioPlayerStateImpl>
    implements _$$AudioPlayerStateImplCopyWith<$Res> {
  __$$AudioPlayerStateImplCopyWithImpl(
    _$AudioPlayerStateImpl _value,
    $Res Function(_$AudioPlayerStateImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of AudioPlayerState
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? currentTrack = freezed,
    Object? queue = null,
    Object? history = null,
    Object? isPlaying = null,
    Object? position = null,
    Object? duration = null,
    Object? volume = null,
    Object? playbackRate = null,
    Object? isExpanded = null,
  }) {
    return _then(
      _$AudioPlayerStateImpl(
        currentTrack: freezed == currentTrack
            ? _value.currentTrack
            : currentTrack // ignore: cast_nullable_to_non_nullable
                  as Post?,
        queue: null == queue
            ? _value._queue
            : queue // ignore: cast_nullable_to_non_nullable
                  as List<Post>,
        history: null == history
            ? _value._history
            : history // ignore: cast_nullable_to_non_nullable
                  as List<Post>,
        isPlaying: null == isPlaying
            ? _value.isPlaying
            : isPlaying // ignore: cast_nullable_to_non_nullable
                  as bool,
        position: null == position
            ? _value.position
            : position // ignore: cast_nullable_to_non_nullable
                  as Duration,
        duration: null == duration
            ? _value.duration
            : duration // ignore: cast_nullable_to_non_nullable
                  as Duration,
        volume: null == volume
            ? _value.volume
            : volume // ignore: cast_nullable_to_non_nullable
                  as double,
        playbackRate: null == playbackRate
            ? _value.playbackRate
            : playbackRate // ignore: cast_nullable_to_non_nullable
                  as double,
        isExpanded: null == isExpanded
            ? _value.isExpanded
            : isExpanded // ignore: cast_nullable_to_non_nullable
                  as bool,
      ),
    );
  }
}

/// @nodoc

class _$AudioPlayerStateImpl implements _AudioPlayerState {
  const _$AudioPlayerStateImpl({
    this.currentTrack,
    final List<Post> queue = const [],
    final List<Post> history = const [],
    this.isPlaying = false,
    this.position = Duration.zero,
    this.duration = Duration.zero,
    this.volume = 1.0,
    this.playbackRate = 1.0,
    this.isExpanded = false,
  }) : _queue = queue,
       _history = history;

  @override
  final Post? currentTrack;
  final List<Post> _queue;
  @override
  @JsonKey()
  List<Post> get queue {
    if (_queue is EqualUnmodifiableListView) return _queue;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_queue);
  }

  final List<Post> _history;
  @override
  @JsonKey()
  List<Post> get history {
    if (_history is EqualUnmodifiableListView) return _history;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_history);
  }

  @override
  @JsonKey()
  final bool isPlaying;
  @override
  @JsonKey()
  final Duration position;
  @override
  @JsonKey()
  final Duration duration;
  @override
  @JsonKey()
  final double volume;
  @override
  @JsonKey()
  final double playbackRate;
  @override
  @JsonKey()
  final bool isExpanded;

  @override
  String toString() {
    return 'AudioPlayerState(currentTrack: $currentTrack, queue: $queue, history: $history, isPlaying: $isPlaying, position: $position, duration: $duration, volume: $volume, playbackRate: $playbackRate, isExpanded: $isExpanded)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$AudioPlayerStateImpl &&
            (identical(other.currentTrack, currentTrack) ||
                other.currentTrack == currentTrack) &&
            const DeepCollectionEquality().equals(other._queue, _queue) &&
            const DeepCollectionEquality().equals(other._history, _history) &&
            (identical(other.isPlaying, isPlaying) ||
                other.isPlaying == isPlaying) &&
            (identical(other.position, position) ||
                other.position == position) &&
            (identical(other.duration, duration) ||
                other.duration == duration) &&
            (identical(other.volume, volume) || other.volume == volume) &&
            (identical(other.playbackRate, playbackRate) ||
                other.playbackRate == playbackRate) &&
            (identical(other.isExpanded, isExpanded) ||
                other.isExpanded == isExpanded));
  }

  @override
  int get hashCode => Object.hash(
    runtimeType,
    currentTrack,
    const DeepCollectionEquality().hash(_queue),
    const DeepCollectionEquality().hash(_history),
    isPlaying,
    position,
    duration,
    volume,
    playbackRate,
    isExpanded,
  );

  /// Create a copy of AudioPlayerState
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$AudioPlayerStateImplCopyWith<_$AudioPlayerStateImpl> get copyWith =>
      __$$AudioPlayerStateImplCopyWithImpl<_$AudioPlayerStateImpl>(
        this,
        _$identity,
      );
}

abstract class _AudioPlayerState implements AudioPlayerState {
  const factory _AudioPlayerState({
    final Post? currentTrack,
    final List<Post> queue,
    final List<Post> history,
    final bool isPlaying,
    final Duration position,
    final Duration duration,
    final double volume,
    final double playbackRate,
    final bool isExpanded,
  }) = _$AudioPlayerStateImpl;

  @override
  Post? get currentTrack;
  @override
  List<Post> get queue;
  @override
  List<Post> get history;
  @override
  bool get isPlaying;
  @override
  Duration get position;
  @override
  Duration get duration;
  @override
  double get volume;
  @override
  double get playbackRate;
  @override
  bool get isExpanded;

  /// Create a copy of AudioPlayerState
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$AudioPlayerStateImplCopyWith<_$AudioPlayerStateImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
