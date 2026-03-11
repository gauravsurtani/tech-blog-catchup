import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/app_config.dart';
import 'audio_player_provider.dart';

class MiniPlayerWidget extends ConsumerWidget {
  const MiniPlayerWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playerState = ref.watch(audioPlayerProvider);
    final track = playerState.currentTrack;

    if (track == null) return const SizedBox.shrink();

    final progress = playerState.duration.inMilliseconds > 0
        ? playerState.position.inMilliseconds /
            playerState.duration.inMilliseconds
        : 0.0;

    return GestureDetector(
      onTap: () =>
          ref.read(audioPlayerProvider.notifier).toggleExpanded(),
      child: Container(
        height: AppConfig.miniPlayerHeight,
        color: AppConfig.surface,
        child: Column(
          children: [
            LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              backgroundColor: AppConfig.surfaceVariant,
              valueColor:
                  const AlwaysStoppedAnimation<Color>(AppConfig.primary),
              minHeight: 2,
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppConfig.spacingLg,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            track.title,
                            style: const TextStyle(
                              color: AppConfig.onSurface,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            track.sourceName,
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
                    IconButton(
                      icon: Icon(
                        playerState.isPlaying
                            ? Icons.pause
                            : Icons.play_arrow,
                        color: AppConfig.onSurface,
                      ),
                      onPressed: () => ref
                          .read(audioPlayerProvider.notifier)
                          .togglePlayPause(),
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.skip_next,
                        color: AppConfig.onSurface,
                      ),
                      onPressed: () =>
                          ref.read(audioPlayerProvider.notifier).playNext(),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
