// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'status_info.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$StatusInfoImpl _$$StatusInfoImplFromJson(Map<String, dynamic> json) =>
    _$StatusInfoImpl(
      totalPosts: (json['total_posts'] as num).toInt(),
      postsBySource: (json['posts_by_source'] as List<dynamic>)
          .map((e) => Source.fromJson(e as Map<String, dynamic>))
          .toList(),
      audioCounts: Map<String, int>.from(json['audio_counts'] as Map),
      tagCounts: (json['tag_counts'] as List<dynamic>)
          .map((e) => Tag.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$$StatusInfoImplToJson(_$StatusInfoImpl instance) =>
    <String, dynamic>{
      'total_posts': instance.totalPosts,
      'posts_by_source': instance.postsBySource,
      'audio_counts': instance.audioCounts,
      'tag_counts': instance.tagCounts,
    };
