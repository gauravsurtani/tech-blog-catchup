import 'package:freezed_annotation/freezed_annotation.dart';
import 'post.dart';

part 'paginated_posts.freezed.dart';
part 'paginated_posts.g.dart';

@freezed
class PaginatedPosts with _$PaginatedPosts {
  const factory PaginatedPosts({
    required List<Post> posts,
    required int total,
    required int offset,
    required int limit,
  }) = _PaginatedPosts;

  factory PaginatedPosts.fromJson(Map<String, dynamic> json) =>
      _$PaginatedPostsFromJson(json);
}
