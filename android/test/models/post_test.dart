import 'package:flutter_test/flutter_test.dart';
import 'package:tech_blog_catchup/models/post.dart';

void main() {
  group('Post', () {
    test('fromJson parses full JSON with all fields', () {
      final json = <String, dynamic>{
        'id': 1,
        'url': 'https://example.com/post-1',
        'source_key': 'meta',
        'source_name': 'Meta Engineering',
        'title': 'Building React Server Components',
        'summary': 'A deep dive into RSC',
        'author': 'Dan Abramov',
        'published_at': '2025-01-15T10:30:00.000Z',
        'tags': ['frontend', 'react'],
        'audio_status': 'ready',
        'audio_path': '/audio/post_1.mp3',
        'audio_duration_secs': 420,
        'word_count': 3500,
      };

      final post = Post.fromJson(json);

      expect(post.id, 1);
      expect(post.url, 'https://example.com/post-1');
      expect(post.sourceKey, 'meta');
      expect(post.sourceName, 'Meta Engineering');
      expect(post.title, 'Building React Server Components');
      expect(post.summary, 'A deep dive into RSC');
      expect(post.author, 'Dan Abramov');
      expect(post.publishedAt, DateTime.parse('2025-01-15T10:30:00.000Z'));
      expect(post.tags, ['frontend', 'react']);
      expect(post.audioStatus, 'ready');
      expect(post.audioPath, '/audio/post_1.mp3');
      expect(post.audioDurationSecs, 420);
      expect(post.wordCount, 3500);
    });

    test('fromJson parses minimal JSON with only required fields', () {
      final json = <String, dynamic>{
        'id': 2,
        'url': 'https://example.com/post-2',
        'source_key': 'uber',
        'source_name': 'Uber Engineering',
        'title': 'Scaling Microservices',
      };

      final post = Post.fromJson(json);

      expect(post.id, 2);
      expect(post.url, 'https://example.com/post-2');
      expect(post.sourceKey, 'uber');
      expect(post.sourceName, 'Uber Engineering');
      expect(post.title, 'Scaling Microservices');
      expect(post.summary, isNull);
      expect(post.author, isNull);
      expect(post.publishedAt, isNull);
      expect(post.audioPath, isNull);
      expect(post.audioDurationSecs, isNull);
      expect(post.wordCount, isNull);
    });

    test('default audioStatus is pending', () {
      final json = <String, dynamic>{
        'id': 3,
        'url': 'https://example.com/post-3',
        'source_key': 'airbnb',
        'source_name': 'Airbnb Tech',
        'title': 'Design Systems',
      };

      final post = Post.fromJson(json);
      expect(post.audioStatus, 'pending');
    });

    test('default tags is empty list', () {
      final json = <String, dynamic>{
        'id': 4,
        'url': 'https://example.com/post-4',
        'source_key': 'github',
        'source_name': 'GitHub Engineering',
        'title': 'Copilot Internals',
      };

      final post = Post.fromJson(json);
      expect(post.tags, isEmpty);
    });

    test('toJson produces correct snake_case keys', () {
      const post = Post(
        id: 10,
        url: 'https://example.com/p',
        sourceKey: 'meta',
        sourceName: 'Meta',
        title: 'Test',
        audioStatus: 'ready',
        tags: ['ai'],
        audioDurationSecs: 60,
      );

      final json = post.toJson();

      expect(json['id'], 10);
      expect(json['source_key'], 'meta');
      expect(json['source_name'], 'Meta');
      expect(json['audio_status'], 'ready');
      expect(json['tags'], ['ai']);
      expect(json['audio_duration_secs'], 60);
    });

    test('toJson/fromJson round-trip preserves all fields', () {
      final original = Post(
        id: 5,
        url: 'https://example.com/round-trip',
        sourceKey: 'cloudflare',
        sourceName: 'Cloudflare Blog',
        title: 'Workers Performance',
        summary: 'Summary text',
        author: 'John Doe',
        publishedAt: DateTime.utc(2025, 3, 10, 12, 0),
        tags: ['infrastructure', 'performance'],
        audioStatus: 'ready',
        audioPath: '/audio/post_5.mp3',
        audioDurationSecs: 300,
        wordCount: 2000,
      );

      final json = original.toJson();
      final restored = Post.fromJson(json);

      expect(restored, original);
    });
  });

  group('PostDetail', () {
    test('fromJson parses full JSON with all fields', () {
      final json = <String, dynamic>{
        'id': 10,
        'url': 'https://example.com/detail',
        'source_key': 'netflix',
        'source_name': 'Netflix Tech Blog',
        'title': 'Streaming Architecture',
        'summary': 'How Netflix streams',
        'author': 'Netflix Team',
        'published_at': '2025-02-20T08:00:00.000Z',
        'tags': ['streaming', 'infrastructure'],
        'audio_status': 'ready',
        'audio_path': '/audio/post_10.mp3',
        'audio_duration_secs': 600,
        'word_count': 5000,
        'full_text': '# Streaming Architecture\n\nBody text...',
        'quality_score': 85,
        'extraction_method': 'trafilatura',
        'crawled_at': '2025-02-19T12:00:00.000Z',
      };

      final detail = PostDetail.fromJson(json);

      expect(detail.id, 10);
      expect(detail.url, 'https://example.com/detail');
      expect(detail.sourceKey, 'netflix');
      expect(detail.sourceName, 'Netflix Tech Blog');
      expect(detail.title, 'Streaming Architecture');
      expect(detail.summary, 'How Netflix streams');
      expect(detail.author, 'Netflix Team');
      expect(detail.publishedAt, DateTime.parse('2025-02-20T08:00:00.000Z'));
      expect(detail.tags, ['streaming', 'infrastructure']);
      expect(detail.audioStatus, 'ready');
      expect(detail.audioPath, '/audio/post_10.mp3');
      expect(detail.audioDurationSecs, 600);
      expect(detail.wordCount, 5000);
      expect(detail.fullText, '# Streaming Architecture\n\nBody text...');
      expect(detail.qualityScore, 85);
      expect(detail.extractionMethod, 'trafilatura');
      expect(detail.crawledAt, DateTime.parse('2025-02-19T12:00:00.000Z'));
    });

    test('fromJson with minimal JSON uses defaults', () {
      final json = <String, dynamic>{
        'id': 11,
        'url': 'https://example.com/minimal-detail',
        'source_key': 'github',
        'source_name': 'GitHub Engineering',
        'title': 'Minimal Post',
      };

      final detail = PostDetail.fromJson(json);

      expect(detail.audioStatus, 'pending');
      expect(detail.tags, isEmpty);
      expect(detail.fullText, isNull);
      expect(detail.qualityScore, isNull);
      expect(detail.extractionMethod, isNull);
      expect(detail.crawledAt, isNull);
    });

    test('toJson/fromJson round-trip preserves all fields', () {
      final original = PostDetail(
        id: 12,
        url: 'https://example.com/rt',
        sourceKey: 'uber',
        sourceName: 'Uber',
        title: 'Round Trip Detail',
        fullText: 'Full content here',
        qualityScore: 72,
        extractionMethod: 'llm',
        crawledAt: DateTime.utc(2025, 1, 1),
      );

      final json = original.toJson();
      final restored = PostDetail.fromJson(json);

      expect(restored, original);
    });
  });

  group('PostDetailToPost extension', () {
    test('toPost() preserves all shared fields', () {
      final detail = PostDetail(
        id: 20,
        url: 'https://example.com/ext',
        sourceKey: 'meta',
        sourceName: 'Meta Engineering',
        title: 'Extension Test',
        summary: 'Testing toPost',
        author: 'Author',
        publishedAt: DateTime.utc(2025, 6, 1),
        tags: ['testing'],
        audioStatus: 'ready',
        audioPath: '/audio/post_20.mp3',
        audioDurationSecs: 180,
        wordCount: 1200,
        fullText: 'This should not carry over',
        qualityScore: 90,
        extractionMethod: 'trafilatura',
        crawledAt: DateTime.utc(2025, 5, 31),
      );

      final post = detail.toPost();

      expect(post.id, detail.id);
      expect(post.url, detail.url);
      expect(post.sourceKey, detail.sourceKey);
      expect(post.sourceName, detail.sourceName);
      expect(post.title, detail.title);
      expect(post.summary, detail.summary);
      expect(post.author, detail.author);
      expect(post.publishedAt, detail.publishedAt);
      expect(post.tags, detail.tags);
      expect(post.audioStatus, detail.audioStatus);
      expect(post.audioPath, detail.audioPath);
      expect(post.audioDurationSecs, detail.audioDurationSecs);
      expect(post.wordCount, detail.wordCount);
    });

    test('toPost() returns a Post instance', () {
      const detail = PostDetail(
        id: 21,
        url: 'https://example.com/type-check',
        sourceKey: 'uber',
        sourceName: 'Uber',
        title: 'Type Check',
      );

      final post = detail.toPost();
      expect(post, isA<Post>());
    });
  });
}
