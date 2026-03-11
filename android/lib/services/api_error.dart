class ApiError implements Exception {
  final int statusCode;
  final String message;
  final String? details;

  const ApiError({
    required this.statusCode,
    required this.message,
    this.details,
  });

  bool get isRetryable => statusCode >= 500 || statusCode == 429;
  bool get isRateLimited => statusCode == 429;
  bool get isConflict => statusCode == 409;
  bool get isNotFound => statusCode == 404;
  bool get isNetworkError => statusCode == 0;

  @override
  String toString() => 'ApiError($statusCode): $message';
}
