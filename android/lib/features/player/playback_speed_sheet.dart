import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/app_config.dart';
import 'audio_player_provider.dart';

void showPlaybackSpeedSheet(BuildContext context) {
  showModalBottomSheet<void>(
    context: context,
    backgroundColor: AppConfig.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(
        top: Radius.circular(AppConfig.radiusLg),
      ),
    ),
    builder: (context) => const PlaybackSpeedSheet(),
  );
}

class PlaybackSpeedSheet extends ConsumerWidget {
  const PlaybackSpeedSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentRate = ref.watch(
      audioPlayerProvider.select((s) => s.playbackRate),
    );

    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.all(AppConfig.spacingLg),
            child: Text(
              'Playback Speed',
              style: TextStyle(
                color: AppConfig.onSurface,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          ...AppConfig.playbackSpeeds.map((speed) {
            final isSelected = (speed - currentRate).abs() < 0.01;
            return ListTile(
              title: Text(
                '${speed}x',
                style: TextStyle(
                  color:
                      isSelected ? AppConfig.primary : AppConfig.onSurface,
                  fontWeight:
                      isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
              trailing: isSelected
                  ? const Icon(Icons.check, color: AppConfig.primary)
                  : null,
              onTap: () {
                ref
                    .read(audioPlayerProvider.notifier)
                    .setPlaybackRate(speed);
                Navigator.pop(context);
              },
            );
          }),
          const SizedBox(height: AppConfig.spacingMd),
        ],
      ),
    );
  }
}
