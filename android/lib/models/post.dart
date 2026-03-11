import 'package:freezed_annotation/freezed_annotation.dart';

part 'post.freezed.dart';
part 'post.g.dart';

@freezed
class Post with _$Post {
  const factory Post({
    required int id,
    required String url,
    required String sourceKey,
    required String sourceName,
    required String title,
    String? summary,
    String? author,
    DateTime? publishedAt,
    @Default([]) List<String> tags,
    @Default('pending') String audioStatus,
    String? audioPath,
    int? audioDurationSecs,
    int? wordCount,
  }) = _Post;

  factory Post.fromJson(Map<String, dynamic> json) => _$PostFromJson(json);
}

@freezed
class PostDetail with _$PostDetail {
  const factory PostDetail({
    required int id,
    required String url,
    required String sourceKey,
    required String sourceName,
    required String title,
    String? summary,
    String? author,
    DateTime? publishedAt,
    @Default([]) List<String> tags,
    @Default('pending') String audioStatus,
    String? audioPath,
    int? audioDurationSecs,
    int? wordCount,
    String? fullText,
    int? qualityScore,
    String? extractionMethod,
    DateTime? crawledAt,
  }) = _PostDetail;

  factory PostDetail.fromJson(Map<String, dynamic> json) =>
      _$PostDetailFromJson(json);
}

extension PostDetailToPost on PostDetail {
  Post toPost() => Post(
        id: id,
        url: url,
        sourceKey: sourceKey,
        sourceName: sourceName,
        title: title,
        summary: summary,
        author: author,
        publishedAt: publishedAt,
        tags: tags,
        audioStatus: audioStatus,
        audioPath: audioPath,
        audioDurationSecs: audioDurationSecs,
        wordCount: wordCount,
      );
}
