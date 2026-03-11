import 'package:flutter_test/flutter_test.dart';
import 'package:tech_blog_catchup/models/paginated_posts.dart';
import 'package:tech_blog_catchup/models/post.dart';

void main() {
  group('PaginatedPosts', () {
    test('fromJson parses items list with nested posts', () {
      final json = <String, dynamic>{
        'posts': [
          {
            'id': 1,
            'url': 'https://example.com/post-1',
            'source_key': 'meta',
            'source_name': 'Meta Engineering',
            'title': 'Post One',
            'audio_status': 'ready',
            'tags': ['ai'],
          },
          {
            'id': 2,
            'url': 'https://example.com/post-2',
            'source_key': 'uber',
            'source_name': 'Uber Engineering',
            'title': 'Post Two',
          },
        ],
        'total': 50,
        'offset': 0,
        'limit': 20,
      };

      final paginated = PaginatedPosts.fromJson(json);

      expect(paginated.posts, hasLength(2));
      expect(paginated.posts[0], isA<Post>());
      expect(paginated.posts[0].id, 1);
      expect(paginated.posts[0].title, 'Post One');
      expect(paginated.posts[0].audioStatus, 'ready');
      expect(paginated.posts[0].tags, ['ai']);
      expect(paginated.posts[1].id, 2);
      expect(paginated.posts[1].audioStatus, 'pending');
      expect(paginated.total, 50);
      expect(paginated.offset, 0);
      expect(paginated.limit, 20);
    });

    test('fromJson with empty posts list', () {
      final json = <String, dynamic>{
        'posts': <dynamic>[],
        'total': 0,
        'offset': 0,
        'limit': 20,
      };

      final paginated = PaginatedPosts.fromJson(json);

      expect(paginated.posts, isEmpty);
      expect(paginated.total, 0);
    });

    test('fromJson with offset pagination', () {
      final json = <String, dynamic>{
        'posts': [
          {
            'id': 21,
            'url': 'https://example.com/post-21',
            'source_key': 'github',
            'source_name': 'GitHub Engineering',
            'title': 'Page Two Post',
          },
        ],
        'total': 50,
        'offset': 20,
        'limit': 20,
      };

      final paginated = PaginatedPosts.fromJson(json);

      expect(paginated.offset, 20);
      expect(paginated.limit, 20);
      expect(paginated.total, 50);
      expect(paginated.posts, hasLength(1));
    });

    test('toJson produces correct keys', () {
      const paginated = PaginatedPosts(
        posts: [
          Post(
            id: 1,
            url: 'https://example.com/p',
            sourceKey: 'meta',
            sourceName: 'Meta',
            title: 'Test',
          ),
        ],
        total: 1,
        offset: 0,
        limit: 20,
      );

      final json = paginated.toJson();

      expect(json['posts'], isList);
      expect(json['total'], 1);
      expect(json['offset'], 0);
      expect(json['limit'], 20);
    });
  });
}
