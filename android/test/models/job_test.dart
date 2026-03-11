import 'package:flutter_test/flutter_test.dart';
import 'package:tech_blog_catchup/models/job.dart';

void main() {
  group('Job', () {
    test('fromJson parses full JSON with all fields', () {
      final json = <String, dynamic>{
        'id': 1,
        'job_type': 'generate',
        'status': 'completed',
        'params': '{"post_id": 42}',
        'result': '{"audio_path": "/audio/post_42.mp3"}',
        'error_message': null,
        'created_at': '2025-02-10T08:00:00.000Z',
        'started_at': '2025-02-10T08:00:05.000Z',
        'completed_at': '2025-02-10T08:02:30.000Z',
      };

      final job = Job.fromJson(json);

      expect(job.id, 1);
      expect(job.jobType, 'generate');
      expect(job.status, 'completed');
      expect(job.params, '{"post_id": 42}');
      expect(job.result, '{"audio_path": "/audio/post_42.mp3"}');
      expect(job.errorMessage, isNull);
      expect(job.createdAt, DateTime.parse('2025-02-10T08:00:00.000Z'));
      expect(job.startedAt, DateTime.parse('2025-02-10T08:00:05.000Z'));
      expect(job.completedAt, DateTime.parse('2025-02-10T08:02:30.000Z'));
    });

    test('fromJson with nullable fields omitted', () {
      final json = <String, dynamic>{
        'id': 2,
        'job_type': 'crawl',
        'status': 'queued',
        'created_at': '2025-02-10T09:00:00.000Z',
      };

      final job = Job.fromJson(json);

      expect(job.id, 2);
      expect(job.jobType, 'crawl');
      expect(job.status, 'queued');
      expect(job.params, isNull);
      expect(job.result, isNull);
      expect(job.errorMessage, isNull);
      expect(job.startedAt, isNull);
      expect(job.completedAt, isNull);
    });

    test('fromJson with error_message on failed job', () {
      final json = <String, dynamic>{
        'id': 3,
        'job_type': 'generate',
        'status': 'failed',
        'error_message': 'OpenAI API rate limit exceeded',
        'created_at': '2025-02-10T10:00:00.000Z',
        'started_at': '2025-02-10T10:00:01.000Z',
      };

      final job = Job.fromJson(json);

      expect(job.status, 'failed');
      expect(job.errorMessage, 'OpenAI API rate limit exceeded');
      expect(job.completedAt, isNull);
    });

    test('toJson produces correct snake_case keys', () {
      final job = Job(
        id: 4,
        jobType: 'crawl',
        status: 'running',
        createdAt: DateTime.utc(2025, 2, 15),
        startedAt: DateTime.utc(2025, 2, 15, 0, 0, 5),
      );

      final json = job.toJson();

      expect(json['id'], 4);
      expect(json['job_type'], 'crawl');
      expect(json['status'], 'running');
      expect(json['created_at'], '2025-02-15T00:00:00.000Z');
      expect(json['started_at'], '2025-02-15T00:00:05.000Z');
      expect(json['completed_at'], isNull);
    });

    test('toJson/fromJson round-trip preserves all fields', () {
      final original = Job(
        id: 5,
        jobType: 'generate',
        status: 'completed',
        params: '{"limit": 10}',
        result: '{"processed": 10}',
        createdAt: DateTime.utc(2025, 1, 1),
        startedAt: DateTime.utc(2025, 1, 1, 0, 1),
        completedAt: DateTime.utc(2025, 1, 1, 0, 5),
      );

      final json = original.toJson();
      final restored = Job.fromJson(json);

      expect(restored, original);
    });
  });
}
