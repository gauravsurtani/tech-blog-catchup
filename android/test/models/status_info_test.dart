import 'package:flutter_test/flutter_test.dart';
import 'package:tech_blog_catchup/models/status_info.dart';
import 'package:tech_blog_catchup/models/source.dart';
import 'package:tech_blog_catchup/models/tag.dart';

void main() {
  group('StatusInfo', () {
    test('fromJson parses full JSON including nested objects', () {
      final json = <String, dynamic>{
        'total_posts': 50,
        'posts_by_source': [
          {'key': 'meta', 'name': 'Meta Engineering', 'post_count': 25},
          {'key': 'uber', 'name': 'Uber Engineering', 'post_count': 17},
          {'key': 'airbnb', 'name': 'Airbnb Tech', 'post_count': 8},
        ],
        'audio_counts': {
          'ready': 13,
          'pending': 30,
          'processing': 2,
          'failed': 5,
        },
        'tag_counts': [
          {'name': 'Machine Learning', 'slug': 'machine-learning', 'post_count': 12},
          {'name': 'Infrastructure', 'slug': 'infrastructure', 'post_count': 8},
        ],
      };

      final status = StatusInfo.fromJson(json);

      expect(status.totalPosts, 50);
      expect(status.postsBySource, hasLength(3));
      expect(status.postsBySource[0].key, 'meta');
      expect(status.postsBySource[0].name, 'Meta Engineering');
      expect(status.postsBySource[0].postCount, 25);
      expect(status.postsBySource[1].key, 'uber');
      expect(status.postsBySource[2].postCount, 8);
      expect(status.audioCounts['ready'], 13);
      expect(status.audioCounts['pending'], 30);
      expect(status.audioCounts['processing'], 2);
      expect(status.audioCounts['failed'], 5);
      expect(status.tagCounts, hasLength(2));
      expect(status.tagCounts[0].name, 'Machine Learning');
      expect(status.tagCounts[0].slug, 'machine-learning');
      expect(status.tagCounts[0].postCount, 12);
      expect(status.tagCounts[1].name, 'Infrastructure');
    });

    test('fromJson with empty lists and map', () {
      final json = <String, dynamic>{
        'total_posts': 0,
        'posts_by_source': <dynamic>[],
        'audio_counts': <String, dynamic>{},
        'tag_counts': <dynamic>[],
      };

      final status = StatusInfo.fromJson(json);

      expect(status.totalPosts, 0);
      expect(status.postsBySource, isEmpty);
      expect(status.audioCounts, isEmpty);
      expect(status.tagCounts, isEmpty);
    });

    test('postsBySource contains Source objects', () {
      final json = <String, dynamic>{
        'total_posts': 5,
        'posts_by_source': [
          {'key': 'github', 'name': 'GitHub Engineering', 'post_count': 5},
        ],
        'audio_counts': <String, dynamic>{'ready': 5},
        'tag_counts': <dynamic>[],
      };

      final status = StatusInfo.fromJson(json);

      expect(status.postsBySource[0], isA<Source>());
      expect(status.postsBySource[0].key, 'github');
    });

    test('tagCounts contains Tag objects', () {
      final json = <String, dynamic>{
        'total_posts': 10,
        'posts_by_source': <dynamic>[],
        'audio_counts': <String, dynamic>{},
        'tag_counts': [
          {'name': 'AI', 'slug': 'ai', 'post_count': 10},
        ],
      };

      final status = StatusInfo.fromJson(json);

      expect(status.tagCounts[0], isA<Tag>());
      expect(status.tagCounts[0].slug, 'ai');
    });

    test('toJson produces correct snake_case keys', () {
      const status = StatusInfo(
        totalPosts: 20,
        postsBySource: [
          Source(key: 'meta', name: 'Meta', postCount: 20),
        ],
        audioCounts: {'ready': 10, 'pending': 10},
        tagCounts: [
          Tag(name: 'Frontend', slug: 'frontend', postCount: 5),
        ],
      );

      final json = status.toJson();

      expect(json['total_posts'], 20);
      expect(json['posts_by_source'], isList);
      expect(json['audio_counts'], isMap);
      expect(json['tag_counts'], isList);
    });
  });
}
