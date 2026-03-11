import 'package:flutter_test/flutter_test.dart';
import 'package:tech_blog_catchup/services/api_error.dart';

void main() {
  group('ApiError', () {
    group('isRetryable', () {
      test('returns true for 500 Internal Server Error', () {
        const error = ApiError(statusCode: 500, message: 'Internal Server Error');
        expect(error.isRetryable, isTrue);
      });

      test('returns true for 502 Bad Gateway', () {
        const error = ApiError(statusCode: 502, message: 'Bad Gateway');
        expect(error.isRetryable, isTrue);
      });

      test('returns true for 503 Service Unavailable', () {
        const error = ApiError(statusCode: 503, message: 'Service Unavailable');
        expect(error.isRetryable, isTrue);
      });

      test('returns true for 429 Too Many Requests', () {
        const error = ApiError(statusCode: 429, message: 'Too Many Requests');
        expect(error.isRetryable, isTrue);
      });

      test('returns false for 400 Bad Request', () {
        const error = ApiError(statusCode: 400, message: 'Bad Request');
        expect(error.isRetryable, isFalse);
      });

      test('returns false for 401 Unauthorized', () {
        const error = ApiError(statusCode: 401, message: 'Unauthorized');
        expect(error.isRetryable, isFalse);
      });

      test('returns false for 404 Not Found', () {
        const error = ApiError(statusCode: 404, message: 'Not Found');
        expect(error.isRetryable, isFalse);
      });

      test('returns false for 409 Conflict', () {
        const error = ApiError(statusCode: 409, message: 'Conflict');
        expect(error.isRetryable, isFalse);
      });
    });

    group('isRateLimited', () {
      test('returns true for 429', () {
        const error = ApiError(statusCode: 429, message: 'Too Many Requests');
        expect(error.isRateLimited, isTrue);
      });

      test('returns false for non-429 codes', () {
        const error = ApiError(statusCode: 500, message: 'Server Error');
        expect(error.isRateLimited, isFalse);
      });
    });

    group('isConflict', () {
      test('returns true for 409', () {
        const error = ApiError(statusCode: 409, message: 'Conflict');
        expect(error.isConflict, isTrue);
      });

      test('returns false for non-409 codes', () {
        const error = ApiError(statusCode: 400, message: 'Bad Request');
        expect(error.isConflict, isFalse);
      });
    });

    group('isNotFound', () {
      test('returns true for 404', () {
        const error = ApiError(statusCode: 404, message: 'Not Found');
        expect(error.isNotFound, isTrue);
      });

      test('returns false for non-404 codes', () {
        const error = ApiError(statusCode: 200, message: 'OK');
        expect(error.isNotFound, isFalse);
      });
    });

    group('isNetworkError', () {
      test('returns true for statusCode 0', () {
        const error = ApiError(statusCode: 0, message: 'Network error');
        expect(error.isNetworkError, isTrue);
      });

      test('returns false for non-zero statusCode', () {
        const error = ApiError(statusCode: 500, message: 'Server Error');
        expect(error.isNetworkError, isFalse);
      });
    });

    group('toString', () {
      test('formats correctly with status code and message', () {
        const error = ApiError(statusCode: 404, message: 'Not Found');
        expect(error.toString(), 'ApiError(404): Not Found');
      });

      test('formats correctly with different values', () {
        const error = ApiError(statusCode: 500, message: 'Internal Server Error');
        expect(error.toString(), 'ApiError(500): Internal Server Error');
      });
    });

    group('details', () {
      test('details field is optional and nullable', () {
        const error = ApiError(statusCode: 400, message: 'Bad Request');
        expect(error.details, isNull);
      });

      test('details field stores value when provided', () {
        const error = ApiError(
          statusCode: 400,
          message: 'Validation Error',
          details: 'Field "title" is required',
        );
        expect(error.details, 'Field "title" is required');
      });
    });

    test('implements Exception', () {
      const error = ApiError(statusCode: 500, message: 'Error');
      expect(error, isA<Exception>());
    });
  });
}
