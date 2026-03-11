// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'crawl_status.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$CrawlStatusItemImpl _$$CrawlStatusItemImplFromJson(
  Map<String, dynamic> json,
) => _$CrawlStatusItemImpl(
  sourceKey: json['source_key'] as String,
  sourceName: json['source_name'] as String,
  enabled: json['enabled'] as bool,
  feedUrl: json['feed_url'] as String,
  blogUrl: json['blog_url'] as String?,
  status: json['status'] as String,
  postCount: (json['post_count'] as num).toInt(),
  totalDiscoverable: (json['total_discoverable'] as num?)?.toInt(),
  lastCrawlAt: json['last_crawl_at'] == null
      ? null
      : DateTime.parse(json['last_crawl_at'] as String),
  lastCrawlType: json['last_crawl_type'] as String?,
  postsAddedLast: (json['posts_added_last'] as num?)?.toInt(),
  urlsFoundLast: (json['urls_found_last'] as num?)?.toInt(),
  errorMessage: json['error_message'] as String?,
);

Map<String, dynamic> _$$CrawlStatusItemImplToJson(
  _$CrawlStatusItemImpl instance,
) => <String, dynamic>{
  'source_key': instance.sourceKey,
  'source_name': instance.sourceName,
  'enabled': instance.enabled,
  'feed_url': instance.feedUrl,
  'blog_url': instance.blogUrl,
  'status': instance.status,
  'post_count': instance.postCount,
  'total_discoverable': instance.totalDiscoverable,
  'last_crawl_at': instance.lastCrawlAt?.toIso8601String(),
  'last_crawl_type': instance.lastCrawlType,
  'posts_added_last': instance.postsAddedLast,
  'urls_found_last': instance.urlsFoundLast,
  'error_message': instance.errorMessage,
};
