import 'package:dio/dio.dart';
import '../models/post.dart';
import '../models/tag.dart';
import '../models/source.dart';
import '../models/job.dart';
import '../models/paginated_posts.dart';
import '../models/crawl_status.dart';
import '../models/status_info.dart';
import 'api_error.dart';

class ApiClient {
  final Dio _dio;
  final String baseUrl;

  ApiClient({required this.baseUrl})
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
          headers: {'Content-Type': 'application/json'},
        )) {
    _dio.interceptors.add(_RetryInterceptor(_dio));
  }

  String getAudioUrl(String audioPath) => '$baseUrl/$audioPath';

  // -- Posts --

  Future<PaginatedPosts> getPosts({
    String? source,
    String? tag,
    String? search,
    String? audioStatus,
    int? qualityMin,
    int offset = 0,
    int limit = 20,
    String? sort,
  }) async {
    final params = <String, dynamic>{
      'offset': offset,
      'limit': limit,
    };
    if (source != null) params['source'] = source;
    if (tag != null) params['tag'] = tag;
    if (search != null && search.isNotEmpty) params['search'] = search;
    if (audioStatus != null) params['audio_status'] = audioStatus;
    if (qualityMin != null) params['quality_min'] = qualityMin;
    if (sort != null) params['sort'] = sort;

    final data = await _get('/api/posts', params: params);
    return PaginatedPosts.fromJson(data as Map<String, dynamic>);
  }

  Future<PostDetail> getPost(int id) async {
    final data = await _get('/api/posts/$id');
    return PostDetail.fromJson(data as Map<String, dynamic>);
  }

  Future<PaginatedPosts> getPlaylist({
    int offset = 0,
    int limit = 20,
    String? sort,
  }) async {
    final params = <String, dynamic>{
      'offset': offset,
      'limit': limit,
    };
    if (sort != null) params['sort'] = sort;

    final data = await _get('/api/playlist', params: params);
    return PaginatedPosts.fromJson(data as Map<String, dynamic>);
  }

  // -- Tags & Sources --

  Future<List<Tag>> getTags() async {
    final data = await _get('/api/tags');
    return (data as List).map((e) => Tag.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<Source>> getSources() async {
    final data = await _get('/api/sources');
    return (data as List).map((e) => Source.fromJson(e as Map<String, dynamic>)).toList();
  }

  // -- Status --

  Future<StatusInfo> getStatus() async {
    final data = await _get('/api/status');
    return StatusInfo.fromJson(data as Map<String, dynamic>);
  }

  Future<List<CrawlStatusItem>> getCrawlStatus() async {
    final data = await _get('/api/crawl-status');
    return (data as List)
        .map((e) => CrawlStatusItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> getHealth() async {
    final data = await _get('/api/health');
    return data as Map<String, dynamic>;
  }

  // -- Jobs --

  Future<List<Job>> getJobs({String? jobType, String? status}) async {
    final params = <String, dynamic>{};
    if (jobType != null) params['job_type'] = jobType;
    if (status != null) params['status'] = status;

    final data = await _get('/api/jobs', params: params);
    return (data as List).map((e) => Job.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Job> getJob(int id) async {
    final data = await _get('/api/jobs/$id');
    return Job.fromJson(data as Map<String, dynamic>);
  }

  // -- Actions --

  Future<Map<String, dynamic>> triggerCrawl({String? source}) async {
    final body = <String, dynamic>{};
    if (source != null) body['source'] = source;
    final data = await _post('/api/crawl', body: body);
    return data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> triggerGenerate({int? postId, int limit = 10}) async {
    final body = <String, dynamic>{'limit': limit};
    if (postId != null) body['post_id'] = postId;
    final data = await _post('/api/generate', body: body);
    return data as Map<String, dynamic>;
  }

  // -- Internal --

  Future<dynamic> _get(String path, {Map<String, dynamic>? params}) async {
    try {
      final response = await _dio.get(path, queryParameters: params);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<dynamic> _post(String path, {Map<String, dynamic>? body}) async {
    try {
      final response = await _dio.post(path, data: body);
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  ApiError _handleError(DioException e) {
    if (e.response != null) {
      final data = e.response!.data;
      String message = '${e.response!.statusCode} ${e.response!.statusMessage}';
      String? details;

      if (data is Map<String, dynamic>) {
        if (data['detail'] is String) {
          details = data['detail'] as String;
          message = details;
        } else if (data['message'] is String) {
          details = data['message'] as String;
          message = details;
        }
      }

      return ApiError(
        statusCode: e.response!.statusCode ?? 0,
        message: message,
        details: details,
      );
    }

    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return const ApiError(statusCode: 0, message: 'Request timed out');
    }

    return const ApiError(statusCode: 0, message: 'Network error');
  }
}

class _RetryInterceptor extends Interceptor {
  final Dio _dio;
  static const _maxRetries = 3;
  static const _initialBackoffMs = 500;

  _RetryInterceptor(this._dio);

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    try {
      final statusCode = err.response?.statusCode ?? 0;
      final isRetryable = statusCode >= 500 || statusCode == 429;

      if (!isRetryable) {
        handler.next(err);
        return;
      }

      final extra = err.requestOptions.extra;
      final attempt = (extra['_retryAttempt'] as int?) ?? 0;

      if (attempt >= _maxRetries - 1) {
        handler.next(err);
        return;
      }

      final delay = _initialBackoffMs * (1 << attempt);
      await Future.delayed(Duration(milliseconds: delay));

      final options = err.requestOptions;
      options.extra['_retryAttempt'] = attempt + 1;

      final response = await _dio.fetch(options);
      handler.resolve(response);
    } on DioException catch (e) {
      handler.next(e);
    } catch (_) {
      handler.next(err);
    }
  }
}
