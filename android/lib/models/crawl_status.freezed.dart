// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'crawl_status.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

CrawlStatusItem _$CrawlStatusItemFromJson(Map<String, dynamic> json) {
  return _CrawlStatusItem.fromJson(json);
}

/// @nodoc
mixin _$CrawlStatusItem {
  String get sourceKey => throw _privateConstructorUsedError;
  String get sourceName => throw _privateConstructorUsedError;
  bool get enabled => throw _privateConstructorUsedError;
  String get feedUrl => throw _privateConstructorUsedError;
  String? get blogUrl => throw _privateConstructorUsedError;
  String get status => throw _privateConstructorUsedError;
  int get postCount => throw _privateConstructorUsedError;
  int? get totalDiscoverable => throw _privateConstructorUsedError;
  DateTime? get lastCrawlAt => throw _privateConstructorUsedError;
  String? get lastCrawlType => throw _privateConstructorUsedError;
  int? get postsAddedLast => throw _privateConstructorUsedError;
  int? get urlsFoundLast => throw _privateConstructorUsedError;
  String? get errorMessage => throw _privateConstructorUsedError;

  /// Serializes this CrawlStatusItem to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of CrawlStatusItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $CrawlStatusItemCopyWith<CrawlStatusItem> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $CrawlStatusItemCopyWith<$Res> {
  factory $CrawlStatusItemCopyWith(
    CrawlStatusItem value,
    $Res Function(CrawlStatusItem) then,
  ) = _$CrawlStatusItemCopyWithImpl<$Res, CrawlStatusItem>;
  @useResult
  $Res call({
    String sourceKey,
    String sourceName,
    bool enabled,
    String feedUrl,
    String? blogUrl,
    String status,
    int postCount,
    int? totalDiscoverable,
    DateTime? lastCrawlAt,
    String? lastCrawlType,
    int? postsAddedLast,
    int? urlsFoundLast,
    String? errorMessage,
  });
}

/// @nodoc
class _$CrawlStatusItemCopyWithImpl<$Res, $Val extends CrawlStatusItem>
    implements $CrawlStatusItemCopyWith<$Res> {
  _$CrawlStatusItemCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of CrawlStatusItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? sourceKey = null,
    Object? sourceName = null,
    Object? enabled = null,
    Object? feedUrl = null,
    Object? blogUrl = freezed,
    Object? status = null,
    Object? postCount = null,
    Object? totalDiscoverable = freezed,
    Object? lastCrawlAt = freezed,
    Object? lastCrawlType = freezed,
    Object? postsAddedLast = freezed,
    Object? urlsFoundLast = freezed,
    Object? errorMessage = freezed,
  }) {
    return _then(
      _value.copyWith(
            sourceKey: null == sourceKey
                ? _value.sourceKey
                : sourceKey // ignore: cast_nullable_to_non_nullable
                      as String,
            sourceName: null == sourceName
                ? _value.sourceName
                : sourceName // ignore: cast_nullable_to_non_nullable
                      as String,
            enabled: null == enabled
                ? _value.enabled
                : enabled // ignore: cast_nullable_to_non_nullable
                      as bool,
            feedUrl: null == feedUrl
                ? _value.feedUrl
                : feedUrl // ignore: cast_nullable_to_non_nullable
                      as String,
            blogUrl: freezed == blogUrl
                ? _value.blogUrl
                : blogUrl // ignore: cast_nullable_to_non_nullable
                      as String?,
            status: null == status
                ? _value.status
                : status // ignore: cast_nullable_to_non_nullable
                      as String,
            postCount: null == postCount
                ? _value.postCount
                : postCount // ignore: cast_nullable_to_non_nullable
                      as int,
            totalDiscoverable: freezed == totalDiscoverable
                ? _value.totalDiscoverable
                : totalDiscoverable // ignore: cast_nullable_to_non_nullable
                      as int?,
            lastCrawlAt: freezed == lastCrawlAt
                ? _value.lastCrawlAt
                : lastCrawlAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            lastCrawlType: freezed == lastCrawlType
                ? _value.lastCrawlType
                : lastCrawlType // ignore: cast_nullable_to_non_nullable
                      as String?,
            postsAddedLast: freezed == postsAddedLast
                ? _value.postsAddedLast
                : postsAddedLast // ignore: cast_nullable_to_non_nullable
                      as int?,
            urlsFoundLast: freezed == urlsFoundLast
                ? _value.urlsFoundLast
                : urlsFoundLast // ignore: cast_nullable_to_non_nullable
                      as int?,
            errorMessage: freezed == errorMessage
                ? _value.errorMessage
                : errorMessage // ignore: cast_nullable_to_non_nullable
                      as String?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$CrawlStatusItemImplCopyWith<$Res>
    implements $CrawlStatusItemCopyWith<$Res> {
  factory _$$CrawlStatusItemImplCopyWith(
    _$CrawlStatusItemImpl value,
    $Res Function(_$CrawlStatusItemImpl) then,
  ) = __$$CrawlStatusItemImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    String sourceKey,
    String sourceName,
    bool enabled,
    String feedUrl,
    String? blogUrl,
    String status,
    int postCount,
    int? totalDiscoverable,
    DateTime? lastCrawlAt,
    String? lastCrawlType,
    int? postsAddedLast,
    int? urlsFoundLast,
    String? errorMessage,
  });
}

/// @nodoc
class __$$CrawlStatusItemImplCopyWithImpl<$Res>
    extends _$CrawlStatusItemCopyWithImpl<$Res, _$CrawlStatusItemImpl>
    implements _$$CrawlStatusItemImplCopyWith<$Res> {
  __$$CrawlStatusItemImplCopyWithImpl(
    _$CrawlStatusItemImpl _value,
    $Res Function(_$CrawlStatusItemImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of CrawlStatusItem
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? sourceKey = null,
    Object? sourceName = null,
    Object? enabled = null,
    Object? feedUrl = null,
    Object? blogUrl = freezed,
    Object? status = null,
    Object? postCount = null,
    Object? totalDiscoverable = freezed,
    Object? lastCrawlAt = freezed,
    Object? lastCrawlType = freezed,
    Object? postsAddedLast = freezed,
    Object? urlsFoundLast = freezed,
    Object? errorMessage = freezed,
  }) {
    return _then(
      _$CrawlStatusItemImpl(
        sourceKey: null == sourceKey
            ? _value.sourceKey
            : sourceKey // ignore: cast_nullable_to_non_nullable
                  as String,
        sourceName: null == sourceName
            ? _value.sourceName
            : sourceName // ignore: cast_nullable_to_non_nullable
                  as String,
        enabled: null == enabled
            ? _value.enabled
            : enabled // ignore: cast_nullable_to_non_nullable
                  as bool,
        feedUrl: null == feedUrl
            ? _value.feedUrl
            : feedUrl // ignore: cast_nullable_to_non_nullable
                  as String,
        blogUrl: freezed == blogUrl
            ? _value.blogUrl
            : blogUrl // ignore: cast_nullable_to_non_nullable
                  as String?,
        status: null == status
            ? _value.status
            : status // ignore: cast_nullable_to_non_nullable
                  as String,
        postCount: null == postCount
            ? _value.postCount
            : postCount // ignore: cast_nullable_to_non_nullable
                  as int,
        totalDiscoverable: freezed == totalDiscoverable
            ? _value.totalDiscoverable
            : totalDiscoverable // ignore: cast_nullable_to_non_nullable
                  as int?,
        lastCrawlAt: freezed == lastCrawlAt
            ? _value.lastCrawlAt
            : lastCrawlAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        lastCrawlType: freezed == lastCrawlType
            ? _value.lastCrawlType
            : lastCrawlType // ignore: cast_nullable_to_non_nullable
                  as String?,
        postsAddedLast: freezed == postsAddedLast
            ? _value.postsAddedLast
            : postsAddedLast // ignore: cast_nullable_to_non_nullable
                  as int?,
        urlsFoundLast: freezed == urlsFoundLast
            ? _value.urlsFoundLast
            : urlsFoundLast // ignore: cast_nullable_to_non_nullable
                  as int?,
        errorMessage: freezed == errorMessage
            ? _value.errorMessage
            : errorMessage // ignore: cast_nullable_to_non_nullable
                  as String?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$CrawlStatusItemImpl implements _CrawlStatusItem {
  const _$CrawlStatusItemImpl({
    required this.sourceKey,
    required this.sourceName,
    required this.enabled,
    required this.feedUrl,
    this.blogUrl,
    required this.status,
    required this.postCount,
    this.totalDiscoverable,
    this.lastCrawlAt,
    this.lastCrawlType,
    this.postsAddedLast,
    this.urlsFoundLast,
    this.errorMessage,
  });

  factory _$CrawlStatusItemImpl.fromJson(Map<String, dynamic> json) =>
      _$$CrawlStatusItemImplFromJson(json);

  @override
  final String sourceKey;
  @override
  final String sourceName;
  @override
  final bool enabled;
  @override
  final String feedUrl;
  @override
  final String? blogUrl;
  @override
  final String status;
  @override
  final int postCount;
  @override
  final int? totalDiscoverable;
  @override
  final DateTime? lastCrawlAt;
  @override
  final String? lastCrawlType;
  @override
  final int? postsAddedLast;
  @override
  final int? urlsFoundLast;
  @override
  final String? errorMessage;

  @override
  String toString() {
    return 'CrawlStatusItem(sourceKey: $sourceKey, sourceName: $sourceName, enabled: $enabled, feedUrl: $feedUrl, blogUrl: $blogUrl, status: $status, postCount: $postCount, totalDiscoverable: $totalDiscoverable, lastCrawlAt: $lastCrawlAt, lastCrawlType: $lastCrawlType, postsAddedLast: $postsAddedLast, urlsFoundLast: $urlsFoundLast, errorMessage: $errorMessage)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CrawlStatusItemImpl &&
            (identical(other.sourceKey, sourceKey) ||
                other.sourceKey == sourceKey) &&
            (identical(other.sourceName, sourceName) ||
                other.sourceName == sourceName) &&
            (identical(other.enabled, enabled) || other.enabled == enabled) &&
            (identical(other.feedUrl, feedUrl) || other.feedUrl == feedUrl) &&
            (identical(other.blogUrl, blogUrl) || other.blogUrl == blogUrl) &&
            (identical(other.status, status) || other.status == status) &&
            (identical(other.postCount, postCount) ||
                other.postCount == postCount) &&
            (identical(other.totalDiscoverable, totalDiscoverable) ||
                other.totalDiscoverable == totalDiscoverable) &&
            (identical(other.lastCrawlAt, lastCrawlAt) ||
                other.lastCrawlAt == lastCrawlAt) &&
            (identical(other.lastCrawlType, lastCrawlType) ||
                other.lastCrawlType == lastCrawlType) &&
            (identical(other.postsAddedLast, postsAddedLast) ||
                other.postsAddedLast == postsAddedLast) &&
            (identical(other.urlsFoundLast, urlsFoundLast) ||
                other.urlsFoundLast == urlsFoundLast) &&
            (identical(other.errorMessage, errorMessage) ||
                other.errorMessage == errorMessage));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    sourceKey,
    sourceName,
    enabled,
    feedUrl,
    blogUrl,
    status,
    postCount,
    totalDiscoverable,
    lastCrawlAt,
    lastCrawlType,
    postsAddedLast,
    urlsFoundLast,
    errorMessage,
  );

  /// Create a copy of CrawlStatusItem
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$CrawlStatusItemImplCopyWith<_$CrawlStatusItemImpl> get copyWith =>
      __$$CrawlStatusItemImplCopyWithImpl<_$CrawlStatusItemImpl>(
        this,
        _$identity,
      );

  @override
  Map<String, dynamic> toJson() {
    return _$$CrawlStatusItemImplToJson(this);
  }
}

abstract class _CrawlStatusItem implements CrawlStatusItem {
  const factory _CrawlStatusItem({
    required final String sourceKey,
    required final String sourceName,
    required final bool enabled,
    required final String feedUrl,
    final String? blogUrl,
    required final String status,
    required final int postCount,
    final int? totalDiscoverable,
    final DateTime? lastCrawlAt,
    final String? lastCrawlType,
    final int? postsAddedLast,
    final int? urlsFoundLast,
    final String? errorMessage,
  }) = _$CrawlStatusItemImpl;

  factory _CrawlStatusItem.fromJson(Map<String, dynamic> json) =
      _$CrawlStatusItemImpl.fromJson;

  @override
  String get sourceKey;
  @override
  String get sourceName;
  @override
  bool get enabled;
  @override
  String get feedUrl;
  @override
  String? get blogUrl;
  @override
  String get status;
  @override
  int get postCount;
  @override
  int? get totalDiscoverable;
  @override
  DateTime? get lastCrawlAt;
  @override
  String? get lastCrawlType;
  @override
  int? get postsAddedLast;
  @override
  int? get urlsFoundLast;
  @override
  String? get errorMessage;

  /// Create a copy of CrawlStatusItem
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$CrawlStatusItemImplCopyWith<_$CrawlStatusItemImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
