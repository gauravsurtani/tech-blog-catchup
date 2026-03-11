import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/post.dart';
import '../../theme/app_config.dart';
import '../generate/generate_button.dart';

class PostCard extends ConsumerWidget {
  final Post post;

  const PostCard({super.key, required this.post});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      child: InkWell(
        onTap: () => context.push('/post/${post.id}'),
        borderRadius: BorderRadius.circular(AppConfig.radiusLg),
        child: Padding(
          padding: const EdgeInsets.all(AppConfig.spacingLg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Source chip
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppConfig.spacingSm,
                  vertical: AppConfig.spacingXs,
                ),
                decoration: BoxDecoration(
                  color: AppConfig.primaryMuted,
                  borderRadius: BorderRadius.circular(AppConfig.radiusFull),
                ),
                child: Text(
                  post.sourceName,
                  style: const TextStyle(
                    color: AppConfig.primary,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const SizedBox(height: AppConfig.spacingSm),
              // Title
              Text(
                post.title,
                style: const TextStyle(
                  color: AppConfig.onSurface,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (post.summary != null) ...[
                const SizedBox(height: AppConfig.spacingSm),
                Text(
                  post.summary!,
                  style: const TextStyle(
                    color: AppConfig.mutedText,
                    fontSize: 13,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
              if (post.tags.isNotEmpty) ...[
                const SizedBox(height: AppConfig.spacingSm),
                Wrap(
                  spacing: AppConfig.spacingXs,
                  runSpacing: AppConfig.spacingXs,
                  children: post.tags
                      .take(4)
                      .map((tag) => Chip(
                            label: Text(tag),
                            materialTapTargetSize:
                                MaterialTapTargetSize.shrinkWrap,
                            visualDensity: VisualDensity.compact,
                          ))
                      .toList(),
                ),
              ],
              const SizedBox(height: AppConfig.spacingMd),
              // Action row
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  GenerateButton(post: post),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
