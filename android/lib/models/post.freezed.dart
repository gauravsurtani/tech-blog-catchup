// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'post.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
  'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models',
);

Post _$PostFromJson(Map<String, dynamic> json) {
  return _Post.fromJson(json);
}

/// @nodoc
mixin _$Post {
  int get id => throw _privateConstructorUsedError;
  String get url => throw _privateConstructorUsedError;
  String get sourceKey => throw _privateConstructorUsedError;
  String get sourceName => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String? get summary => throw _privateConstructorUsedError;
  String? get author => throw _privateConstructorUsedError;
  DateTime? get publishedAt => throw _privateConstructorUsedError;
  List<String> get tags => throw _privateConstructorUsedError;
  String get audioStatus => throw _privateConstructorUsedError;
  String? get audioPath => throw _privateConstructorUsedError;
  int? get audioDurationSecs => throw _privateConstructorUsedError;
  int? get wordCount => throw _privateConstructorUsedError;

  /// Serializes this Post to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of Post
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $PostCopyWith<Post> get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PostCopyWith<$Res> {
  factory $PostCopyWith(Post value, $Res Function(Post) then) =
      _$PostCopyWithImpl<$Res, Post>;
  @useResult
  $Res call({
    int id,
    String url,
    String sourceKey,
    String sourceName,
    String title,
    String? summary,
    String? author,
    DateTime? publishedAt,
    List<String> tags,
    String audioStatus,
    String? audioPath,
    int? audioDurationSecs,
    int? wordCount,
  });
}

/// @nodoc
class _$PostCopyWithImpl<$Res, $Val extends Post>
    implements $PostCopyWith<$Res> {
  _$PostCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of Post
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? url = null,
    Object? sourceKey = null,
    Object? sourceName = null,
    Object? title = null,
    Object? summary = freezed,
    Object? author = freezed,
    Object? publishedAt = freezed,
    Object? tags = null,
    Object? audioStatus = null,
    Object? audioPath = freezed,
    Object? audioDurationSecs = freezed,
    Object? wordCount = freezed,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as int,
            url: null == url
                ? _value.url
                : url // ignore: cast_nullable_to_non_nullable
                      as String,
            sourceKey: null == sourceKey
                ? _value.sourceKey
                : sourceKey // ignore: cast_nullable_to_non_nullable
                      as String,
            sourceName: null == sourceName
                ? _value.sourceName
                : sourceName // ignore: cast_nullable_to_non_nullable
                      as String,
            title: null == title
                ? _value.title
                : title // ignore: cast_nullable_to_non_nullable
                      as String,
            summary: freezed == summary
                ? _value.summary
                : summary // ignore: cast_nullable_to_non_nullable
                      as String?,
            author: freezed == author
                ? _value.author
                : author // ignore: cast_nullable_to_non_nullable
                      as String?,
            publishedAt: freezed == publishedAt
                ? _value.publishedAt
                : publishedAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            tags: null == tags
                ? _value.tags
                : tags // ignore: cast_nullable_to_non_nullable
                      as List<String>,
            audioStatus: null == audioStatus
                ? _value.audioStatus
                : audioStatus // ignore: cast_nullable_to_non_nullable
                      as String,
            audioPath: freezed == audioPath
                ? _value.audioPath
                : audioPath // ignore: cast_nullable_to_non_nullable
                      as String?,
            audioDurationSecs: freezed == audioDurationSecs
                ? _value.audioDurationSecs
                : audioDurationSecs // ignore: cast_nullable_to_non_nullable
                      as int?,
            wordCount: freezed == wordCount
                ? _value.wordCount
                : wordCount // ignore: cast_nullable_to_non_nullable
                      as int?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$PostImplCopyWith<$Res> implements $PostCopyWith<$Res> {
  factory _$$PostImplCopyWith(
    _$PostImpl value,
    $Res Function(_$PostImpl) then,
  ) = __$$PostImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    int id,
    String url,
    String sourceKey,
    String sourceName,
    String title,
    String? summary,
    String? author,
    DateTime? publishedAt,
    List<String> tags,
    String audioStatus,
    String? audioPath,
    int? audioDurationSecs,
    int? wordCount,
  });
}

/// @nodoc
class __$$PostImplCopyWithImpl<$Res>
    extends _$PostCopyWithImpl<$Res, _$PostImpl>
    implements _$$PostImplCopyWith<$Res> {
  __$$PostImplCopyWithImpl(_$PostImpl _value, $Res Function(_$PostImpl) _then)
    : super(_value, _then);

  /// Create a copy of Post
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? url = null,
    Object? sourceKey = null,
    Object? sourceName = null,
    Object? title = null,
    Object? summary = freezed,
    Object? author = freezed,
    Object? publishedAt = freezed,
    Object? tags = null,
    Object? audioStatus = null,
    Object? audioPath = freezed,
    Object? audioDurationSecs = freezed,
    Object? wordCount = freezed,
  }) {
    return _then(
      _$PostImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as int,
        url: null == url
            ? _value.url
            : url // ignore: cast_nullable_to_non_nullable
                  as String,
        sourceKey: null == sourceKey
            ? _value.sourceKey
            : sourceKey // ignore: cast_nullable_to_non_nullable
                  as String,
        sourceName: null == sourceName
            ? _value.sourceName
            : sourceName // ignore: cast_nullable_to_non_nullable
                  as String,
        title: null == title
            ? _value.title
            : title // ignore: cast_nullable_to_non_nullable
                  as String,
        summary: freezed == summary
            ? _value.summary
            : summary // ignore: cast_nullable_to_non_nullable
                  as String?,
        author: freezed == author
            ? _value.author
            : author // ignore: cast_nullable_to_non_nullable
                  as String?,
        publishedAt: freezed == publishedAt
            ? _value.publishedAt
            : publishedAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        tags: null == tags
            ? _value._tags
            : tags // ignore: cast_nullable_to_non_nullable
                  as List<String>,
        audioStatus: null == audioStatus
            ? _value.audioStatus
            : audioStatus // ignore: cast_nullable_to_non_nullable
                  as String,
        audioPath: freezed == audioPath
            ? _value.audioPath
            : audioPath // ignore: cast_nullable_to_non_nullable
                  as String?,
        audioDurationSecs: freezed == audioDurationSecs
            ? _value.audioDurationSecs
            : audioDurationSecs // ignore: cast_nullable_to_non_nullable
                  as int?,
        wordCount: freezed == wordCount
            ? _value.wordCount
            : wordCount // ignore: cast_nullable_to_non_nullable
                  as int?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$PostImpl implements _Post {
  const _$PostImpl({
    required this.id,
    required this.url,
    required this.sourceKey,
    required this.sourceName,
    required this.title,
    this.summary,
    this.author,
    this.publishedAt,
    final List<String> tags = const [],
    this.audioStatus = 'pending',
    this.audioPath,
    this.audioDurationSecs,
    this.wordCount,
  }) : _tags = tags;

  factory _$PostImpl.fromJson(Map<String, dynamic> json) =>
      _$$PostImplFromJson(json);

  @override
  final int id;
  @override
  final String url;
  @override
  final String sourceKey;
  @override
  final String sourceName;
  @override
  final String title;
  @override
  final String? summary;
  @override
  final String? author;
  @override
  final DateTime? publishedAt;
  final List<String> _tags;
  @override
  @JsonKey()
  List<String> get tags {
    if (_tags is EqualUnmodifiableListView) return _tags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tags);
  }

  @override
  @JsonKey()
  final String audioStatus;
  @override
  final String? audioPath;
  @override
  final int? audioDurationSecs;
  @override
  final int? wordCount;

  @override
  String toString() {
    return 'Post(id: $id, url: $url, sourceKey: $sourceKey, sourceName: $sourceName, title: $title, summary: $summary, author: $author, publishedAt: $publishedAt, tags: $tags, audioStatus: $audioStatus, audioPath: $audioPath, audioDurationSecs: $audioDurationSecs, wordCount: $wordCount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PostImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.url, url) || other.url == url) &&
            (identical(other.sourceKey, sourceKey) ||
                other.sourceKey == sourceKey) &&
            (identical(other.sourceName, sourceName) ||
                other.sourceName == sourceName) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.summary, summary) || other.summary == summary) &&
            (identical(other.author, author) || other.author == author) &&
            (identical(other.publishedAt, publishedAt) ||
                other.publishedAt == publishedAt) &&
            const DeepCollectionEquality().equals(other._tags, _tags) &&
            (identical(other.audioStatus, audioStatus) ||
                other.audioStatus == audioStatus) &&
            (identical(other.audioPath, audioPath) ||
                other.audioPath == audioPath) &&
            (identical(other.audioDurationSecs, audioDurationSecs) ||
                other.audioDurationSecs == audioDurationSecs) &&
            (identical(other.wordCount, wordCount) ||
                other.wordCount == wordCount));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    url,
    sourceKey,
    sourceName,
    title,
    summary,
    author,
    publishedAt,
    const DeepCollectionEquality().hash(_tags),
    audioStatus,
    audioPath,
    audioDurationSecs,
    wordCount,
  );

  /// Create a copy of Post
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PostImplCopyWith<_$PostImpl> get copyWith =>
      __$$PostImplCopyWithImpl<_$PostImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$PostImplToJson(this);
  }
}

abstract class _Post implements Post {
  const factory _Post({
    required final int id,
    required final String url,
    required final String sourceKey,
    required final String sourceName,
    required final String title,
    final String? summary,
    final String? author,
    final DateTime? publishedAt,
    final List<String> tags,
    final String audioStatus,
    final String? audioPath,
    final int? audioDurationSecs,
    final int? wordCount,
  }) = _$PostImpl;

  factory _Post.fromJson(Map<String, dynamic> json) = _$PostImpl.fromJson;

  @override
  int get id;
  @override
  String get url;
  @override
  String get sourceKey;
  @override
  String get sourceName;
  @override
  String get title;
  @override
  String? get summary;
  @override
  String? get author;
  @override
  DateTime? get publishedAt;
  @override
  List<String> get tags;
  @override
  String get audioStatus;
  @override
  String? get audioPath;
  @override
  int? get audioDurationSecs;
  @override
  int? get wordCount;

  /// Create a copy of Post
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PostImplCopyWith<_$PostImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

PostDetail _$PostDetailFromJson(Map<String, dynamic> json) {
  return _PostDetail.fromJson(json);
}

/// @nodoc
mixin _$PostDetail {
  int get id => throw _privateConstructorUsedError;
  String get url => throw _privateConstructorUsedError;
  String get sourceKey => throw _privateConstructorUsedError;
  String get sourceName => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String? get summary => throw _privateConstructorUsedError;
  String? get author => throw _privateConstructorUsedError;
  DateTime? get publishedAt => throw _privateConstructorUsedError;
  List<String> get tags => throw _privateConstructorUsedError;
  String get audioStatus => throw _privateConstructorUsedError;
  String? get audioPath => throw _privateConstructorUsedError;
  int? get audioDurationSecs => throw _privateConstructorUsedError;
  int? get wordCount => throw _privateConstructorUsedError;
  String? get fullText => throw _privateConstructorUsedError;
  int? get qualityScore => throw _privateConstructorUsedError;
  String? get extractionMethod => throw _privateConstructorUsedError;
  DateTime? get crawledAt => throw _privateConstructorUsedError;

  /// Serializes this PostDetail to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of PostDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $PostDetailCopyWith<PostDetail> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PostDetailCopyWith<$Res> {
  factory $PostDetailCopyWith(
    PostDetail value,
    $Res Function(PostDetail) then,
  ) = _$PostDetailCopyWithImpl<$Res, PostDetail>;
  @useResult
  $Res call({
    int id,
    String url,
    String sourceKey,
    String sourceName,
    String title,
    String? summary,
    String? author,
    DateTime? publishedAt,
    List<String> tags,
    String audioStatus,
    String? audioPath,
    int? audioDurationSecs,
    int? wordCount,
    String? fullText,
    int? qualityScore,
    String? extractionMethod,
    DateTime? crawledAt,
  });
}

/// @nodoc
class _$PostDetailCopyWithImpl<$Res, $Val extends PostDetail>
    implements $PostDetailCopyWith<$Res> {
  _$PostDetailCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of PostDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? url = null,
    Object? sourceKey = null,
    Object? sourceName = null,
    Object? title = null,
    Object? summary = freezed,
    Object? author = freezed,
    Object? publishedAt = freezed,
    Object? tags = null,
    Object? audioStatus = null,
    Object? audioPath = freezed,
    Object? audioDurationSecs = freezed,
    Object? wordCount = freezed,
    Object? fullText = freezed,
    Object? qualityScore = freezed,
    Object? extractionMethod = freezed,
    Object? crawledAt = freezed,
  }) {
    return _then(
      _value.copyWith(
            id: null == id
                ? _value.id
                : id // ignore: cast_nullable_to_non_nullable
                      as int,
            url: null == url
                ? _value.url
                : url // ignore: cast_nullable_to_non_nullable
                      as String,
            sourceKey: null == sourceKey
                ? _value.sourceKey
                : sourceKey // ignore: cast_nullable_to_non_nullable
                      as String,
            sourceName: null == sourceName
                ? _value.sourceName
                : sourceName // ignore: cast_nullable_to_non_nullable
                      as String,
            title: null == title
                ? _value.title
                : title // ignore: cast_nullable_to_non_nullable
                      as String,
            summary: freezed == summary
                ? _value.summary
                : summary // ignore: cast_nullable_to_non_nullable
                      as String?,
            author: freezed == author
                ? _value.author
                : author // ignore: cast_nullable_to_non_nullable
                      as String?,
            publishedAt: freezed == publishedAt
                ? _value.publishedAt
                : publishedAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
            tags: null == tags
                ? _value.tags
                : tags // ignore: cast_nullable_to_non_nullable
                      as List<String>,
            audioStatus: null == audioStatus
                ? _value.audioStatus
                : audioStatus // ignore: cast_nullable_to_non_nullable
                      as String,
            audioPath: freezed == audioPath
                ? _value.audioPath
                : audioPath // ignore: cast_nullable_to_non_nullable
                      as String?,
            audioDurationSecs: freezed == audioDurationSecs
                ? _value.audioDurationSecs
                : audioDurationSecs // ignore: cast_nullable_to_non_nullable
                      as int?,
            wordCount: freezed == wordCount
                ? _value.wordCount
                : wordCount // ignore: cast_nullable_to_non_nullable
                      as int?,
            fullText: freezed == fullText
                ? _value.fullText
                : fullText // ignore: cast_nullable_to_non_nullable
                      as String?,
            qualityScore: freezed == qualityScore
                ? _value.qualityScore
                : qualityScore // ignore: cast_nullable_to_non_nullable
                      as int?,
            extractionMethod: freezed == extractionMethod
                ? _value.extractionMethod
                : extractionMethod // ignore: cast_nullable_to_non_nullable
                      as String?,
            crawledAt: freezed == crawledAt
                ? _value.crawledAt
                : crawledAt // ignore: cast_nullable_to_non_nullable
                      as DateTime?,
          )
          as $Val,
    );
  }
}

/// @nodoc
abstract class _$$PostDetailImplCopyWith<$Res>
    implements $PostDetailCopyWith<$Res> {
  factory _$$PostDetailImplCopyWith(
    _$PostDetailImpl value,
    $Res Function(_$PostDetailImpl) then,
  ) = __$$PostDetailImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({
    int id,
    String url,
    String sourceKey,
    String sourceName,
    String title,
    String? summary,
    String? author,
    DateTime? publishedAt,
    List<String> tags,
    String audioStatus,
    String? audioPath,
    int? audioDurationSecs,
    int? wordCount,
    String? fullText,
    int? qualityScore,
    String? extractionMethod,
    DateTime? crawledAt,
  });
}

/// @nodoc
class __$$PostDetailImplCopyWithImpl<$Res>
    extends _$PostDetailCopyWithImpl<$Res, _$PostDetailImpl>
    implements _$$PostDetailImplCopyWith<$Res> {
  __$$PostDetailImplCopyWithImpl(
    _$PostDetailImpl _value,
    $Res Function(_$PostDetailImpl) _then,
  ) : super(_value, _then);

  /// Create a copy of PostDetail
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? url = null,
    Object? sourceKey = null,
    Object? sourceName = null,
    Object? title = null,
    Object? summary = freezed,
    Object? author = freezed,
    Object? publishedAt = freezed,
    Object? tags = null,
    Object? audioStatus = null,
    Object? audioPath = freezed,
    Object? audioDurationSecs = freezed,
    Object? wordCount = freezed,
    Object? fullText = freezed,
    Object? qualityScore = freezed,
    Object? extractionMethod = freezed,
    Object? crawledAt = freezed,
  }) {
    return _then(
      _$PostDetailImpl(
        id: null == id
            ? _value.id
            : id // ignore: cast_nullable_to_non_nullable
                  as int,
        url: null == url
            ? _value.url
            : url // ignore: cast_nullable_to_non_nullable
                  as String,
        sourceKey: null == sourceKey
            ? _value.sourceKey
            : sourceKey // ignore: cast_nullable_to_non_nullable
                  as String,
        sourceName: null == sourceName
            ? _value.sourceName
            : sourceName // ignore: cast_nullable_to_non_nullable
                  as String,
        title: null == title
            ? _value.title
            : title // ignore: cast_nullable_to_non_nullable
                  as String,
        summary: freezed == summary
            ? _value.summary
            : summary // ignore: cast_nullable_to_non_nullable
                  as String?,
        author: freezed == author
            ? _value.author
            : author // ignore: cast_nullable_to_non_nullable
                  as String?,
        publishedAt: freezed == publishedAt
            ? _value.publishedAt
            : publishedAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
        tags: null == tags
            ? _value._tags
            : tags // ignore: cast_nullable_to_non_nullable
                  as List<String>,
        audioStatus: null == audioStatus
            ? _value.audioStatus
            : audioStatus // ignore: cast_nullable_to_non_nullable
                  as String,
        audioPath: freezed == audioPath
            ? _value.audioPath
            : audioPath // ignore: cast_nullable_to_non_nullable
                  as String?,
        audioDurationSecs: freezed == audioDurationSecs
            ? _value.audioDurationSecs
            : audioDurationSecs // ignore: cast_nullable_to_non_nullable
                  as int?,
        wordCount: freezed == wordCount
            ? _value.wordCount
            : wordCount // ignore: cast_nullable_to_non_nullable
                  as int?,
        fullText: freezed == fullText
            ? _value.fullText
            : fullText // ignore: cast_nullable_to_non_nullable
                  as String?,
        qualityScore: freezed == qualityScore
            ? _value.qualityScore
            : qualityScore // ignore: cast_nullable_to_non_nullable
                  as int?,
        extractionMethod: freezed == extractionMethod
            ? _value.extractionMethod
            : extractionMethod // ignore: cast_nullable_to_non_nullable
                  as String?,
        crawledAt: freezed == crawledAt
            ? _value.crawledAt
            : crawledAt // ignore: cast_nullable_to_non_nullable
                  as DateTime?,
      ),
    );
  }
}

/// @nodoc
@JsonSerializable()
class _$PostDetailImpl implements _PostDetail {
  const _$PostDetailImpl({
    required this.id,
    required this.url,
    required this.sourceKey,
    required this.sourceName,
    required this.title,
    this.summary,
    this.author,
    this.publishedAt,
    final List<String> tags = const [],
    this.audioStatus = 'pending',
    this.audioPath,
    this.audioDurationSecs,
    this.wordCount,
    this.fullText,
    this.qualityScore,
    this.extractionMethod,
    this.crawledAt,
  }) : _tags = tags;

  factory _$PostDetailImpl.fromJson(Map<String, dynamic> json) =>
      _$$PostDetailImplFromJson(json);

  @override
  final int id;
  @override
  final String url;
  @override
  final String sourceKey;
  @override
  final String sourceName;
  @override
  final String title;
  @override
  final String? summary;
  @override
  final String? author;
  @override
  final DateTime? publishedAt;
  final List<String> _tags;
  @override
  @JsonKey()
  List<String> get tags {
    if (_tags is EqualUnmodifiableListView) return _tags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_tags);
  }

  @override
  @JsonKey()
  final String audioStatus;
  @override
  final String? audioPath;
  @override
  final int? audioDurationSecs;
  @override
  final int? wordCount;
  @override
  final String? fullText;
  @override
  final int? qualityScore;
  @override
  final String? extractionMethod;
  @override
  final DateTime? crawledAt;

  @override
  String toString() {
    return 'PostDetail(id: $id, url: $url, sourceKey: $sourceKey, sourceName: $sourceName, title: $title, summary: $summary, author: $author, publishedAt: $publishedAt, tags: $tags, audioStatus: $audioStatus, audioPath: $audioPath, audioDurationSecs: $audioDurationSecs, wordCount: $wordCount, fullText: $fullText, qualityScore: $qualityScore, extractionMethod: $extractionMethod, crawledAt: $crawledAt)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PostDetailImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.url, url) || other.url == url) &&
            (identical(other.sourceKey, sourceKey) ||
                other.sourceKey == sourceKey) &&
            (identical(other.sourceName, sourceName) ||
                other.sourceName == sourceName) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.summary, summary) || other.summary == summary) &&
            (identical(other.author, author) || other.author == author) &&
            (identical(other.publishedAt, publishedAt) ||
                other.publishedAt == publishedAt) &&
            const DeepCollectionEquality().equals(other._tags, _tags) &&
            (identical(other.audioStatus, audioStatus) ||
                other.audioStatus == audioStatus) &&
            (identical(other.audioPath, audioPath) ||
                other.audioPath == audioPath) &&
            (identical(other.audioDurationSecs, audioDurationSecs) ||
                other.audioDurationSecs == audioDurationSecs) &&
            (identical(other.wordCount, wordCount) ||
                other.wordCount == wordCount) &&
            (identical(other.fullText, fullText) ||
                other.fullText == fullText) &&
            (identical(other.qualityScore, qualityScore) ||
                other.qualityScore == qualityScore) &&
            (identical(other.extractionMethod, extractionMethod) ||
                other.extractionMethod == extractionMethod) &&
            (identical(other.crawledAt, crawledAt) ||
                other.crawledAt == crawledAt));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(
    runtimeType,
    id,
    url,
    sourceKey,
    sourceName,
    title,
    summary,
    author,
    publishedAt,
    const DeepCollectionEquality().hash(_tags),
    audioStatus,
    audioPath,
    audioDurationSecs,
    wordCount,
    fullText,
    qualityScore,
    extractionMethod,
    crawledAt,
  );

  /// Create a copy of PostDetail
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$PostDetailImplCopyWith<_$PostDetailImpl> get copyWith =>
      __$$PostDetailImplCopyWithImpl<_$PostDetailImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$PostDetailImplToJson(this);
  }
}

abstract class _PostDetail implements PostDetail {
  const factory _PostDetail({
    required final int id,
    required final String url,
    required final String sourceKey,
    required final String sourceName,
    required final String title,
    final String? summary,
    final String? author,
    final DateTime? publishedAt,
    final List<String> tags,
    final String audioStatus,
    final String? audioPath,
    final int? audioDurationSecs,
    final int? wordCount,
    final String? fullText,
    final int? qualityScore,
    final String? extractionMethod,
    final DateTime? crawledAt,
  }) = _$PostDetailImpl;

  factory _PostDetail.fromJson(Map<String, dynamic> json) =
      _$PostDetailImpl.fromJson;

  @override
  int get id;
  @override
  String get url;
  @override
  String get sourceKey;
  @override
  String get sourceName;
  @override
  String get title;
  @override
  String? get summary;
  @override
  String? get author;
  @override
  DateTime? get publishedAt;
  @override
  List<String> get tags;
  @override
  String get audioStatus;
  @override
  String? get audioPath;
  @override
  int? get audioDurationSecs;
  @override
  int? get wordCount;
  @override
  String? get fullText;
  @override
  int? get qualityScore;
  @override
  String? get extractionMethod;
  @override
  DateTime? get crawledAt;

  /// Create a copy of PostDetail
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$PostDetailImplCopyWith<_$PostDetailImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
