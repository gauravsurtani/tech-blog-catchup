import 'package:flutter_test/flutter_test.dart';
import 'package:tech_blog_catchup/core/utils.dart';

void main() {
  group('formatDuration', () {
    test('formats zero duration', () {
      expect(formatDuration(Duration.zero), '00:00');
    });

    test('formats seconds only', () {
      expect(formatDuration(const Duration(seconds: 5)), '00:05');
    });

    test('formats seconds with padding', () {
      expect(formatDuration(const Duration(seconds: 9)), '00:09');
    });

    test('formats minutes and seconds', () {
      expect(formatDuration(const Duration(minutes: 3, seconds: 45)), '03:45');
    });

    test('formats exact minutes', () {
      expect(formatDuration(const Duration(minutes: 10)), '10:00');
    });

    test('formats durations over an hour (shows only mm:ss)', () {
      expect(formatDuration(const Duration(hours: 1, minutes: 5, seconds: 30)), '05:30');
    });

    test('formats 59 minutes 59 seconds', () {
      expect(formatDuration(const Duration(minutes: 59, seconds: 59)), '59:59');
    });
  });

  group('formatDurationFromSeconds', () {
    test('returns empty string for null input', () {
      expect(formatDurationFromSeconds(null), '');
    });

    test('formats 0 seconds', () {
      expect(formatDurationFromSeconds(0), '00:00');
    });

    test('formats seconds under a minute', () {
      expect(formatDurationFromSeconds(45), '00:45');
    });

    test('formats exact minutes', () {
      expect(formatDurationFromSeconds(120), '02:00');
    });

    test('formats minutes and seconds', () {
      expect(formatDurationFromSeconds(420), '07:00');
    });

    test('formats large values', () {
      expect(formatDurationFromSeconds(3661), '01:01');
    });
  });
}
