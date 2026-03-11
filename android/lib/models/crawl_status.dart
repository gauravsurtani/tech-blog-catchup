import 'package:freezed_annotation/freezed_annotation.dart';

part 'crawl_status.freezed.dart';
part 'crawl_status.g.dart';

@freezed
class CrawlStatusItem with _$CrawlStatusItem {
  const factory CrawlStatusItem({
    required String sourceKey,
    required String sourceName,
    required bool enabled,
    required String feedUrl,
    String? blogUrl,
    required String status,
    required int postCount,
    int? totalDiscoverable,
    DateTime? lastCrawlAt,
    String? lastCrawlType,
    int? postsAddedLast,
    int? urlsFoundLast,
    String? errorMessage,
  }) = _CrawlStatusItem;

  factory CrawlStatusItem.fromJson(Map<String, dynamic> json) =>
      _$CrawlStatusItemFromJson(json);
}
