import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/app_config.dart';
import 'audio_player_provider.dart';

class PlayerControls extends ConsumerWidget {
  const PlayerControls({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isPlaying = ref.watch(
      audioPlayerProvider.select((s) => s.isPlaying),
    );
    final notifier = ref.read(audioPlayerProvider.notifier);

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          icon: const Icon(Icons.skip_previous, color: AppConfig.onSurface),
          iconSize: 32,
          onPressed: notifier.playPrevious,
        ),
        IconButton(
          icon: const Icon(Icons.replay_10, color: AppConfig.onSurface),
          iconSize: 32,
          onPressed: notifier.seekBackward,
        ),
        const SizedBox(width: AppConfig.spacingSm),
        Container(
          decoration: const BoxDecoration(
            color: AppConfig.primary,
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: Icon(
              isPlaying ? Icons.pause : Icons.play_arrow,
              color: AppConfig.onSurface,
            ),
            iconSize: 40,
            onPressed: notifier.togglePlayPause,
          ),
        ),
        const SizedBox(width: AppConfig.spacingSm),
        IconButton(
          icon: const Icon(Icons.forward_10, color: AppConfig.onSurface),
          iconSize: 32,
          onPressed: notifier.seekForward,
        ),
        IconButton(
          icon: const Icon(Icons.skip_next, color: AppConfig.onSurface),
          iconSize: 32,
          onPressed: notifier.playNext,
        ),
      ],
    );
  }
}
