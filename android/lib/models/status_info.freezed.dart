// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'status_info.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

StatusInfo _$StatusInfoFromJson(Map<String, dynamic> json) {
  return _StatusInfo.fromJson(json);
}

/// @nodoc
mixin _$StatusInfo {
  int get totalPosts => throw _privateConstructorUsedError;
  List<Source> get postsBySource => throw _privateConstructorUsedError;
  Map<String, int> get audioCounts => throw _privateConstructorUsedError;
  List<Tag> get tagCounts => throw _privateConstructorUsedError;

  /// Serializes this StatusInfo to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of StatusInfo
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $StatusInfoCopyWith<StatusInfo> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $StatusInfoCopyWith<$Res> {
  factory $StatusInfoCopyWith(
    StatusInfo value,
    $Res Function(StatusInfo) then,
  ) = _$StatusInfoCopyWithImpl<$Res, StatusInfo>;
  @useResult
  $Res call({
    int totalPosts,
    List<Source> postsBySource,
    Map<String, int> audioCounts,
    List<Tag> tagCounts,
  });
}

/// @nodoc
class _$StatusInfoCopyWithImpl<$Res, $Val extends StatusInfo>
    implements $StatusInfoCopyWith<$Res> {
  _$StatusInfoCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of StatusInfo
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? totalPosts = null,
    Object? postsBySource = null,
    Object? audioCounts = null,
    Object? tagCounts = null,
  }) {
    return _then(
      _value.copyWith(
            totalPosts: null == totalPosts
                ? _value.totalPosts
                : totalPosts // ignore: cast_nullable_to_non_nullable
                      as int,
            postsBySource: null == postsBySource
                ? _value.postsBySource
                : postsBySource // ignore: cast_nullable_to_non_nullable
                      as List<Source>,
            audioCounts: null == audioCounts
                ? _value.audioCounts
                : audioCounts // ignore: cast_nullable_to_non_nullable
                      as Map<String, int>,
            tagCounts: null == tagCounts
                ? _value.tagCounts
                : tagCounts // ignore: cast_nullable_to_non_nullable
                      as List<Tag>,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$StatusInfoImplCopyWith<$Res>
    implements $StatusInfoCopyWith<$Res> {
  factory _$$StatusInfoImplCopyWith(
    _$StatusInfoImpl value,
    $Res Function(_$StatusInfoImpl) then,
  ) = __$$StatusInfoImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    int totalPosts,
    List<Source> postsBySource,
    Map<String, int> audioCounts,
    List<Tag> tagCounts,
  });
}

/// @nodoc
class __$$StatusInfoImplCopyWithImpl<$Res>
    extends _$StatusInfoCopyWithImpl<$Res, _$StatusInfoImpl>
    implements _$$StatusInfoImplCopyWith<$Res> {
  __$$StatusInfoImplCopyWithImpl(
    _$StatusInfoImpl _value,
    $Res Function(_$StatusInfoImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of StatusInfo
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? totalPosts = null,
    Object? postsBySource = null,
    Object? audioCounts = null,
    Object? tagCounts = null,
  }) {
    return _then(
      _$StatusInfoImpl(
        totalPosts: null == totalPosts
            ? _value.totalPosts
            : totalPosts // ignore: cast_nullable_to_non_nullable
                  as int,
        postsBySource: null == postsBySource
            ? _value._postsBySource
            : postsBySource // ignore: cast_nullable_to_non_nullable
                  as List<Source>,
        audioCounts: null == audioCounts
            ? _value._audioCounts
            : audioCounts // ignore: cast_nullable_to_non_nullable
                  as Map<String, int>,
        tagCounts: null == tagCounts
            ? _value._tagCounts
            : tagCounts // ignore: cast_nullable_to_non_nullable
                  as List<Tag>,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$StatusInfoImpl implements _StatusInfo {
  const _$StatusInfoImpl({
    required this.totalPosts,
    required final List<Source> postsBySource,
    required final Map<String, int> audioCounts,
    required final List<Tag> tagCounts,
  }) : _postsBySource = postsBySource,
       _audioCounts = audioCounts,
       _tagCounts = tagCounts;

  factory _$StatusInfoImpl.fromJson(Map<String, dynamic> json) =>
      _$$StatusInfoImplFromJson(json);

  @override
  final int totalPosts;
  final List<Source> _postsBySource;
  @override
  List<Source> get postsBySource {
    if (_postsBySource is EqualUnmodifiableListView) return _postsBySource;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_postsBySource);
  }

  final Map<String, int> _audioCounts;
  @override
  Map<String, int> get audioCounts {
    if (_audioCounts is EqualUnmodifiableMapView) return _audioCounts;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(_audioCounts);
  }

  final List<Tag> _tagCounts;
  @override
  List<Tag> get tagCounts {
    if (_tagCounts is EqualUnmodifiableListView) return _tagCounts;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tagCounts);
  }

  @override
  String toString() {
    return 'StatusInfo(totalPosts: $totalPosts, postsBySource: $postsBySource, audioCounts: $audioCounts, tagCounts: $tagCounts)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$StatusInfoImpl &&
            (identical(other.totalPosts, totalPosts) ||
                other.totalPosts == totalPosts) &&
            const DeepCollectionEquality().equals(
              other._postsBySource,
              _postsBySource,
            ) &&
            const DeepCollectionEquality().equals(
              other._audioCounts,
              _audioCounts,
            ) &&
            const DeepCollectionEquality().equals(
              other._tagCounts,
              _tagCounts,
            ));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    totalPosts,
    const DeepCollectionEquality().hash(_postsBySource),
    const DeepCollectionEquality().hash(_audioCounts),
    const DeepCollectionEquality().hash(_tagCounts),
  );

  /// Create a copy of StatusInfo
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$StatusInfoImplCopyWith<_$StatusInfoImpl> get copyWith =>
      __$$StatusInfoImplCopyWithImpl<_$StatusInfoImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$StatusInfoImplToJson(this);
  }
}

abstract class _StatusInfo implements StatusInfo {
  const factory _StatusInfo({
    required final int totalPosts,
    required final List<Source> postsBySource,
    required final Map<String, int> audioCounts,
    required final List<Tag> tagCounts,
  }) = _$StatusInfoImpl;

  factory _StatusInfo.fromJson(Map<String, dynamic> json) =
      _$StatusInfoImpl.fromJson;

  @override
  int get totalPosts;
  @override
  List<Source> get postsBySource;
  @override
  Map<String, int> get audioCounts;
  @override
  List<Tag> get tagCounts;

  /// Create a copy of StatusInfo
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$StatusInfoImplCopyWith<_$StatusInfoImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
