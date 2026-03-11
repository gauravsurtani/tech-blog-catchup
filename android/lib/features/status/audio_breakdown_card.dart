import 'package:flutter/material.dart';

import '../../theme/app_config.dart';

class AudioBreakdownCard extends StatelessWidget {
  final Map<String, int> audioCounts;

  const AudioBreakdownCard({super.key, required this.audioCounts});

  @override
  Widget build(BuildContext context) {
    final stats = [
      _Stat('Ready', audioCounts['ready'] ?? 0, AppConfig.success),
      _Stat('Pending', audioCounts['pending'] ?? 0, AppConfig.primary),
      _Stat('Processing', audioCounts['processing'] ?? 0, AppConfig.warning),
      _Stat('Failed', audioCounts['failed'] ?? 0, AppConfig.error),
    ];

    return Card(
      color: AppConfig.surface,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppConfig.spacingLg,
          vertical: AppConfig.spacingMd,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: stats.map((s) => _buildColumn(context, s)).toList(),
        ),
      ),
    );
  }

  Widget _buildColumn(BuildContext context, _Stat stat) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: stat.color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(height: AppConfig.spacingXs),
        Text(
          stat.count.toString(),
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 2),
        Text(
          stat.label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}

class _Stat {
  final String label;
  final int count;
  final Color color;

  const _Stat(this.label, this.count, this.color);
}
