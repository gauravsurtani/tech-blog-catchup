import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_client.dart';
import '../core/env.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(baseUrl: AppEnv.baseUrl);
});
