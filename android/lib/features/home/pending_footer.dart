import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../theme/app_config.dart';

class PendingFooter extends StatelessWidget {
  final int pendingCount;

  const PendingFooter({super.key, required this.pendingCount});

  @override
  Widget build(BuildContext context) {
    if (pendingCount <= 0) return const SizedBox.shrink();

    return InkWell(
      onTap: () => context.go('/explore'),
      child: Padding(
        padding: const EdgeInsets.all(AppConfig.spacingLg),
        child: Text(
          '$pendingCount posts pending. View in Explore',
          style: const TextStyle(
            color: AppConfig.mutedText,
            fontSize: 14,
          ),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
