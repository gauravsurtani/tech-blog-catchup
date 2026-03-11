import 'package:flutter_test/flutter_test.dart';
import 'package:tech_blog_catchup/models/tag.dart';

void main() {
  group('Tag', () {
    test('fromJson parses all fields with snake_case keys', () {
      final json = <String, dynamic>{
        'name': 'Machine Learning',
        'slug': 'machine-learning',
        'post_count': 15,
      };

      final tag = Tag.fromJson(json);

      expect(tag.name, 'Machine Learning');
      expect(tag.slug, 'machine-learning');
      expect(tag.postCount, 15);
    });

    test('toJson produces correct snake_case keys', () {
      const tag = Tag(
        name: 'Infrastructure',
        slug: 'infrastructure',
        postCount: 8,
      );

      final json = tag.toJson();

      expect(json['name'], 'Infrastructure');
      expect(json['slug'], 'infrastructure');
      expect(json['post_count'], 8);
    });

    test('toJson/fromJson round-trip preserves all fields', () {
      const original = Tag(
        name: 'Frontend',
        slug: 'frontend',
        postCount: 42,
      );

      final json = original.toJson();
      final restored = Tag.fromJson(json);

      expect(restored, original);
    });

    test('fromJson with zero post count', () {
      final json = <String, dynamic>{
        'name': 'Empty Tag',
        'slug': 'empty-tag',
        'post_count': 0,
      };

      final tag = Tag.fromJson(json);
      expect(tag.postCount, 0);
    });
  });
}
