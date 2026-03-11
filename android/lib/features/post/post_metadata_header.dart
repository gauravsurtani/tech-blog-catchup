import 'package:flutter/material.dart';

import '../../core/utils.dart';
import '../../models/post.dart';
import '../../theme/app_config.dart';

class PostMetadataHeader extends StatelessWidget {
  final PostDetail post;

  const PostMetadataHeader({super.key, required this.post});

  static const _months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  String _formatDate(DateTime? dt) {
    if (dt == null) return '';
    return '${_months[dt.month - 1]} ${dt.day}, ${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Source chip + quality badge row
        Row(
          children: [
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
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(width: AppConfig.spacingSm),
            // Quality badge
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppConfig.spacingSm,
                vertical: AppConfig.spacingXs,
              ),
              decoration: BoxDecoration(
                color: AppConfig.qualityColor(post.qualityScore)
                    .withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(AppConfig.radiusFull),
              ),
              child: Text(
                AppConfig.qualityGrade(post.qualityScore),
                style: TextStyle(
                  color: AppConfig.qualityColor(post.qualityScore),
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppConfig.spacingMd),
        // Metadata line
        Wrap(
          spacing: AppConfig.spacingMd,
          runSpacing: AppConfig.spacingXs,
          children: [
            if (post.author != null)
              _metaItem(Icons.person_outline, post.author!),
            if (post.publishedAt != null)
              _metaItem(Icons.calendar_today, _formatDate(post.publishedAt)),
            if (post.wordCount != null)
              _metaItem(Icons.article_outlined, '${post.wordCount} words'),
            if (post.audioDurationSecs != null && post.audioStatus == 'ready')
              _metaItem(Icons.headphones,
                  formatDurationFromSeconds(post.audioDurationSecs)),
          ],
        ),
        // Tags
        if (post.tags.isNotEmpty) ...[
          const SizedBox(height: AppConfig.spacingMd),
          Wrap(
            spacing: AppConfig.spacingSm,
            runSpacing: AppConfig.spacingSm,
            children: post.tags
                .map((tag) => Chip(
                      label: Text(tag),
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      visualDensity: VisualDensity.compact,
                    ))
                .toList(),
          ),
        ],
      ],
    );
  }

  Widget _metaItem(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppConfig.mutedText),
        const SizedBox(width: AppConfig.spacingXs),
        Text(
          text,
          style: const TextStyle(color: AppConfig.mutedText, fontSize: 13),
        ),
      ],
    );
  }
}
