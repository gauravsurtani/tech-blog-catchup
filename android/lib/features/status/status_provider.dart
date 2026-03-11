import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../models/status_info.dart';
import '../../models/crawl_status.dart';

final statusProvider = FutureProvider<StatusInfo>((ref) async {
  final client = ref.read(apiClientProvider);
  return client.getStatus();
});

final crawlStatusProvider = FutureProvider<List<CrawlStatusItem>>((ref) async {
  final client = ref.read(apiClientProvider);
  return client.getCrawlStatus();
});
