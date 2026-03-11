import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/utils.dart';
import '../../models/post.dart';
import '../../theme/app_config.dart';
import '../player/audio_player_provider.dart';

class PostListItem extends ConsumerWidget {
  final Post post;

  const PostListItem({super.key, required this.post});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return InkWell(
      onTap: () => context.push('/post/${post.id}'),
      borderRadius: BorderRadius.circular(AppConfig.radiusMd),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppConfig.spacingLg,
          vertical: AppConfig.spacingMd,
        ),
        child: Row(
          children: [
            // Play button
            GestureDetector(
              onTap: () =>
                  ref.read(audioPlayerProvider.notifier).play(post),
              child: Container(
                width: 44,
                height: 44,
                decoration: const BoxDecoration(
                  color: AppConfig.primary,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.play_arrow,
                  color: AppConfig.onSurface,
                  size: 24,
                ),
              ),
            ),
            const SizedBox(width: AppConfig.spacingMd),
            // Title + metadata
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
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
                  const SizedBox(height: AppConfig.spacingXs),
                  Text(
                    [
                      post.sourceName,
                      if (post.audioDurationSecs != null)
                        formatDurationFromSeconds(post.audioDurationSecs),
                    ].join(' · '),
                    style: const TextStyle(
                      color: AppConfig.mutedText,
                      fontSize: 12,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            // Add to queue
            IconButton(
              icon: const Icon(
                Icons.playlist_add,
                color: AppConfig.mutedText,
              ),
              onPressed: () {
                ref.read(audioPlayerProvider.notifier).addToQueue(post);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Added to queue'),
                    duration: Duration(seconds: 1),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
