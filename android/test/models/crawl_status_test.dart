import 'package:flutter_test/flutter_test.dart';
import 'package:tech_blog_catchup/models/crawl_status.dart';

void main() {
  group('CrawlStatusItem', () {
    test('fromJson parses full JSON with all fields', () {
      final json = <String, dynamic>{
        'source_key': 'meta',
        'source_name': 'Meta Engineering',
        'enabled': true,
        'feed_url': 'https://engineering.fb.com/feed/',
        'blog_url': 'https://engineering.fb.com/',
        'status': 'idle',
        'post_count': 25,
        'total_discoverable': 1075,
        'last_crawl_at': '2025-02-15T14:30:00.000Z',
        'last_crawl_type': 'smart',
        'posts_added_last': 5,
        'urls_found_last': 120,
        'error_message': null,
      };

      final item = CrawlStatusItem.fromJson(json);

      expect(item.sourceKey, 'meta');
      expect(item.sourceName, 'Meta Engineering');
      expect(item.enabled, true);
      expect(item.feedUrl, 'https://engineering.fb.com/feed/');
      expect(item.blogUrl, 'https://engineering.fb.com/');
      expect(item.status, 'idle');
      expect(item.postCount, 25);
      expect(item.totalDiscoverable, 1075);
      expect(item.lastCrawlAt, DateTime.parse('2025-02-15T14:30:00.000Z'));
      expect(item.lastCrawlType, 'smart');
      expect(item.postsAddedLast, 5);
      expect(item.urlsFoundLast, 120);
      expect(item.errorMessage, isNull);
    });

    test('fromJson with nullable fields omitted', () {
      final json = <String, dynamic>{
        'source_key': 'new-blog',
        'source_name': 'New Blog',
        'enabled': true,
        'feed_url': 'https://new-blog.com/rss',
        'status': 'never_crawled',
        'post_count': 0,
      };

      final item = CrawlStatusItem.fromJson(json);

      expect(item.sourceKey, 'new-blog');
      expect(item.blogUrl, isNull);
      expect(item.totalDiscoverable, isNull);
      expect(item.lastCrawlAt, isNull);
      expect(item.lastCrawlType, isNull);
      expect(item.postsAddedLast, isNull);
      expect(item.urlsFoundLast, isNull);
      expect(item.errorMessage, isNull);
    });

    test('fromJson with error state', () {
      final json = <String, dynamic>{
        'source_key': 'broken',
        'source_name': 'Broken Source',
        'enabled': false,
        'feed_url': 'https://broken.com/rss',
        'status': 'error',
        'post_count': 0,
        'error_message': 'Connection timeout',
      };

      final item = CrawlStatusItem.fromJson(json);

      expect(item.enabled, false);
      expect(item.status, 'error');
      expect(item.errorMessage, 'Connection timeout');
    });

    test('toJson produces correct snake_case keys', () {
      const item = CrawlStatusItem(
        sourceKey: 'uber',
        sourceName: 'Uber Engineering',
        enabled: true,
        feedUrl: 'https://eng.uber.com/feed/',
        blogUrl: 'https://eng.uber.com/',
        status: 'idle',
        postCount: 17,
        totalDiscoverable: 530,
      );

      final json = item.toJson();

      expect(json['source_key'], 'uber');
      expect(json['source_name'], 'Uber Engineering');
      expect(json['feed_url'], 'https://eng.uber.com/feed/');
      expect(json['blog_url'], 'https://eng.uber.com/');
      expect(json['post_count'], 17);
      expect(json['total_discoverable'], 530);
    });

    test('toJson/fromJson round-trip preserves all fields', () {
      final original = CrawlStatusItem(
        sourceKey: 'cloudflare',
        sourceName: 'Cloudflare Blog',
        enabled: true,
        feedUrl: 'https://blog.cloudflare.com/rss/',
        blogUrl: 'https://blog.cloudflare.com/',
        status: 'idle',
        postCount: 10,
        totalDiscoverable: 200,
        lastCrawlAt: DateTime.utc(2025, 2, 10),
        lastCrawlType: 'smart',
        postsAddedLast: 3,
        urlsFoundLast: 50,
      );

      final json = original.toJson();
      final restored = CrawlStatusItem.fromJson(json);

      expect(restored, original);
    });
  });
}
