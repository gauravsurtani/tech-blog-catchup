import 'package:flutter/foundation.dart';

class AppEnv {
  static const baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'https://techblog-api.up.railway.app',
  );

  static String get audioBaseUrl => baseUrl;

  static void checkHttps() {
    if (kReleaseMode && !baseUrl.startsWith('https')) {
      debugPrint(
        'WARNING: BASE_URL ($baseUrl) is not using HTTPS in a release build. '
        'This is insecure. Set BASE_URL to an https:// URL.',
      );
    }
  }
}
