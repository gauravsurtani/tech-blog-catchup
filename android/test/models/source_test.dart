import 'package:flutter_test/flutter_test.dart';
import 'package:tech_blog_catchup/models/source.dart';

void main() {
  group('Source', () {
    test('fromJson parses all fields with snake_case keys', () {
      final json = <String, dynamic>{
        'key': 'meta',
        'name': 'Meta Engineering',
        'post_count': 25,
      };

      final source = Source.fromJson(json);

      expect(source.key, 'meta');
      expect(source.name, 'Meta Engineering');
      expect(source.postCount, 25);
    });

    test('toJson produces correct snake_case keys', () {
      const source = Source(
        key: 'uber',
        name: 'Uber Engineering',
        postCount: 17,
      );

      final json = source.toJson();

      expect(json['key'], 'uber');
      expect(json['name'], 'Uber Engineering');
      expect(json['post_count'], 17);
    });

    test('toJson/fromJson round-trip preserves all fields', () {
      const original = Source(
        key: 'airbnb',
        name: 'Airbnb Tech Blog',
        postCount: 3,
      );

      final json = original.toJson();
      final restored = Source.fromJson(json);

      expect(restored, original);
    });

    test('fromJson with zero post count', () {
      final json = <String, dynamic>{
        'key': 'new-source',
        'name': 'New Source',
        'post_count': 0,
      };

      final source = Source.fromJson(json);
      expect(source.postCount, 0);
    });
  });
}
