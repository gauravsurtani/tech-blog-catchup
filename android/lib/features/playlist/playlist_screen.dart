import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/post.dart';
import '../../theme/app_config.dart';
import 'playlist_provider.dart';
import 'draggable_track_tile.dart';

class PlaylistScreen extends ConsumerWidget {
  const PlaylistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final queue = ref.watch(playlistProvider);
    final notifier = ref.read(playlistProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Playlist'),
        actions: [
          if (queue.isNotEmpty) ...[
            IconButton(
              icon: const Icon(Icons.play_arrow_rounded),
              tooltip: 'Play All',
              onPressed: notifier.playAll,
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline_rounded),
              tooltip: 'Clear',
              onPressed: notifier.clear,
            ),
          ],
        ],
      ),
      body: queue.isEmpty ? _buildEmptyState(context) : _buildQueue(queue, notifier),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppConfig.spacingXl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.queue_music_rounded,
              size: 64,
              color: AppConfig.mutedText,
            ),
            const SizedBox(height: AppConfig.spacingLg),
            Text(
              'No tracks in queue',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: AppConfig.spacingSm),
            Text(
              'Add posts from Home or Explore to build your playlist',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQueue(List<Post> queue, PlaylistNotifier notifier) {
    return ReorderableListView.builder(
      padding: const EdgeInsets.symmetric(vertical: AppConfig.spacingSm),
      itemCount: queue.length,
      onReorder: notifier.reorder,
      itemBuilder: (context, index) {
        final post = queue[index];
        return DraggableTrackTile(
          key: ValueKey(post.id),
          post: post,
          index: index,
          onRemove: () => notifier.remove(index),
        );
      },
    );
  }
}
