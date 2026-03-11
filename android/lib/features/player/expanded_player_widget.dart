import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/utils.dart';
import '../../theme/app_config.dart';
import 'audio_player_provider.dart';
import 'audio_player_state.dart';
import 'playback_speed_sheet.dart';
import 'player_controls.dart';

class ExpandedPlayerWidget extends ConsumerWidget {
  const ExpandedPlayerWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playerState = ref.watch(audioPlayerProvider);
    final track = playerState.currentTrack;

    if (track == null) return const SizedBox.shrink();

    final notifier = ref.read(audioPlayerProvider.notifier);

    return Scaffold(
      backgroundColor: AppConfig.background,
      appBar: AppBar(
        backgroundColor: AppConfig.background,
        leading: IconButton(
          icon: const Icon(Icons.keyboard_arrow_down,
              color: AppConfig.onSurface),
          onPressed: notifier.toggleExpanded,
        ),
        title: const Text(
          'Now Playing',
          style: TextStyle(color: AppConfig.onSurface, fontSize: 16),
        ),
        centerTitle: true,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppConfig.spacingXl,
        ),
        child: Column(
          children: [
            const Spacer(),

            // Source icon placeholder
            Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                color: AppConfig.surfaceVariant,
                borderRadius: BorderRadius.circular(AppConfig.radiusLg),
              ),
              child: Center(
                child: Text(
                  track.sourceName.isNotEmpty
                      ? track.sourceName[0].toUpperCase()
                      : '?',
                  style: const TextStyle(
                    color: AppConfig.primary,
                    fontSize: 72,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),

            const SizedBox(height: AppConfig.spacingXl),

            // Title + source
            Text(
              track.title,
              style: const TextStyle(
                color: AppConfig.onSurface,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: AppConfig.spacingXs),
            Text(
              track.sourceName,
              style: const TextStyle(
                color: AppConfig.mutedText,
                fontSize: 14,
              ),
            ),

            const SizedBox(height: AppConfig.spacingXl),

            _buildSeekSlider(playerState, notifier),

            const SizedBox(height: AppConfig.spacingLg),

            // Player controls
            const PlayerControls(),

            const SizedBox(height: AppConfig.spacingLg),

            _buildVolumeControl(playerState, notifier),

            const SizedBox(height: AppConfig.spacingSm),

            _buildSpeedControl(context, playerState),

            const SizedBox(height: AppConfig.spacingLg),

            _buildQueuePreview(playerState),

            const Spacer(),
          ],
        ),
      ),
    );
  }

  Widget _buildSeekSlider(AudioPlayerState playerState, AudioPlayerNotifier notifier) {
    return Column(
      children: [
        SliderTheme(
          data: const SliderThemeData(
            activeTrackColor: AppConfig.primary,
            inactiveTrackColor: AppConfig.surfaceVariant,
            thumbColor: AppConfig.primary,
            overlayColor: AppConfig.primaryMuted,
            trackHeight: 4,
            thumbShape: RoundSliderThumbShape(enabledThumbRadius: 6),
          ),
          child: Slider(
            value: playerState.position.inMilliseconds
                .toDouble()
                .clamp(0, playerState.duration.inMilliseconds.toDouble()),
            max: playerState.duration.inMilliseconds > 0
                ? playerState.duration.inMilliseconds.toDouble()
                : 1.0,
            onChanged: (value) =>
                notifier.seekTo(Duration(milliseconds: value.toInt())),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppConfig.spacingLg,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                formatDuration(playerState.position),
                style: const TextStyle(
                  color: AppConfig.mutedText,
                  fontSize: 12,
                ),
              ),
              Text(
                formatDuration(playerState.duration),
                style: const TextStyle(
                  color: AppConfig.mutedText,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildVolumeControl(AudioPlayerState playerState, AudioPlayerNotifier notifier) {
    return Row(
      children: [
        const Icon(Icons.volume_down, color: AppConfig.mutedText, size: 20),
        Expanded(
          child: SliderTheme(
            data: const SliderThemeData(
              activeTrackColor: AppConfig.onSurface,
              inactiveTrackColor: AppConfig.surfaceVariant,
              thumbColor: AppConfig.onSurface,
              overlayColor: AppConfig.primaryMuted,
              trackHeight: 3,
              thumbShape:
                  RoundSliderThumbShape(enabledThumbRadius: 5),
            ),
            child: Slider(
              value: playerState.volume,
              onChanged: notifier.setVolume,
            ),
          ),
        ),
        const Icon(Icons.volume_up, color: AppConfig.mutedText, size: 20),
      ],
    );
  }

  Widget _buildSpeedControl(BuildContext context, AudioPlayerState playerState) {
    return TextButton(
      onPressed: () => showPlaybackSpeedSheet(context),
      child: Text(
        '${playerState.playbackRate}x',
        style: const TextStyle(
          color: AppConfig.primary,
          fontSize: 16,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildQueuePreview(AudioPlayerState playerState) {
    if (playerState.queue.isEmpty) return const SizedBox.shrink();

    return Column(
      children: [
        const Align(
          alignment: Alignment.centerLeft,
          child: Text(
            'Up Next',
            style: TextStyle(
              color: AppConfig.onSurface,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(height: AppConfig.spacingSm),
        ...playerState.queue.take(3).map<Widget>(
              (post) => Padding(
                padding:
                    const EdgeInsets.only(bottom: AppConfig.spacingXs),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        post.title,
                        style: const TextStyle(
                          color: AppConfig.textSecondary,
                          fontSize: 13,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      post.sourceName,
                      style: const TextStyle(
                        color: AppConfig.mutedText,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
      ],
    );
  }
}
