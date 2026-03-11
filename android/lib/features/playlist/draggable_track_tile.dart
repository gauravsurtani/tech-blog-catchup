import 'package:flutter/material.dart';

import '../../core/utils.dart';
import '../../models/post.dart';
import '../../theme/app_config.dart';

class DraggableTrackTile extends StatelessWidget {
  final Post post;
  final int index;
  final VoidCallback onRemove;

  const DraggableTrackTile({
    super.key,
    required this.post,
    required this.index,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final duration = formatDurationFromSeconds(post.audioDurationSecs);
    final subtitle = [
      post.sourceName,
      if (duration.isNotEmpty) duration,
    ].join(' \u00b7 ');

    return ListTile(
      leading: ReorderableDragStartListener(
        index: index,
        child: const Icon(Icons.drag_handle_rounded, color: AppConfig.mutedText),
      ),
      title: Text(
        post.title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: Text(
        subtitle,
        style: Theme.of(context).textTheme.bodySmall,
      ),
      trailing: IconButton(
        icon: const Icon(Icons.close, size: 20),
        color: AppConfig.mutedText,
        onPressed: onRemove,
      ),
    );
  }
}
