import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/providers.dart';
import '../../models/post.dart';

final postDetailProvider =
    FutureProvider.family<PostDetail, int>((ref, id) async {
  final api = ref.read(apiClientProvider);
  return api.getPost(id);
});
