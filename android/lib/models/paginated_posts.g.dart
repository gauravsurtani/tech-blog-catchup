// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'paginated_posts.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$PaginatedPostsImpl _$$PaginatedPostsImplFromJson(Map<String, dynamic> json) =>
    _$PaginatedPostsImpl(
      posts: (json['posts'] as List<dynamic>)
          .map((e) => Post.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: (json['total'] as num).toInt(),
      offset: (json['offset'] as num).toInt(),
      limit: (json['limit'] as num).toInt(),
    );

Map<String, dynamic> _$$PaginatedPostsImplToJson(
  _$PaginatedPostsImpl instance,
) => <String, dynamic>{
  'posts': instance.posts,
  'total': instance.total,
  'offset': instance.offset,
  'limit': instance.limit,
};
