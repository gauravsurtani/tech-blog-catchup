import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/post.dart';
import '../../theme/app_config.dart';
import '../player/audio_player_provider.dart';
import 'generation_provider.dart';

class GenerateButton extends ConsumerWidget {
  final Post post;

  const GenerateButton({super.key, required this.post});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final genState = ref.watch(generationProvider);

    switch (post.audioStatus) {
      case 'ready':
        return ElevatedButton.icon(
          onPressed: () =>
              ref.read(audioPlayerProvider.notifier).play(post),
          icon: const Icon(Icons.play_arrow, size: 18),
          label: const Text('Play'),
        );

      case 'processing':
        return ElevatedButton.icon(
          onPressed: null,
          icon: const SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: AppConfig.mutedText,
            ),
          ),
          label: const Text('Generating...'),
        );

      default: // pending, failed
        return ElevatedButton.icon(
          onPressed: genState.isGenerating
              ? null
              : () => ref.read(generationProvider.notifier).generate(post.id),
          icon: const Icon(Icons.podcasts, size: 18),
          label: const Text('Generate Podcast'),
        );
    }
  }
}
