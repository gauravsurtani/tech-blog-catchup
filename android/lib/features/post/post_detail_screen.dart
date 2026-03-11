import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/post.dart';
import '../../theme/app_config.dart';
import '../generate/generate_button.dart';
import 'markdown_content.dart';
import 'post_detail_provider.dart';
import 'post_metadata_header.dart';

class PostDetailScreen extends ConsumerWidget {
  final String postId;

  const PostDetailScreen({super.key, required this.postId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = int.tryParse(postId);
    if (id == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Post Detail')),
        body: const Center(
          child: Text('Invalid post ID', style: TextStyle(color: AppConfig.error)),
        ),
      );
    }

    final detailAsync = ref.watch(postDetailProvider(id));

    return detailAsync.when(
      data: (post) => _buildContent(context, post),
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('Post Detail')),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (err, _) => Scaffold(
        appBar: AppBar(title: const Text('Post Detail')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Failed to load post',
                style: TextStyle(color: AppConfig.error, fontSize: 16),
              ),
              const SizedBox(height: AppConfig.spacingSm),
              ElevatedButton(
                onPressed: () => ref.invalidate(postDetailProvider(id)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, PostDetail post) {
    final asPost = post.toPost();

    return Scaffold(
      appBar: AppBar(
        title: Text(
          post.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppConfig.spacingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            PostMetadataHeader(post: post),
            const Divider(height: AppConfig.spacingXl * 2),
            if (post.fullText != null && post.fullText!.isNotEmpty)
              MarkdownContent(content: post.fullText!)
            else
              const Text(
                'No content available',
                style: TextStyle(color: AppConfig.mutedText, fontSize: 14),
              ),
            const SizedBox(height: AppConfig.spacingXl),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(AppConfig.spacingLg),
        decoration: const BoxDecoration(
          color: AppConfig.surface,
          border: Border(
            top: BorderSide(color: AppConfig.outline),
          ),
        ),
        child: SafeArea(
          child: GenerateButton(post: asPost),
        ),
      ),
    );
  }
}
