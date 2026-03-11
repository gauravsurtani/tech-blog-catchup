import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/app_config.dart';
import 'generation_provider.dart';

class GenerationBanner extends ConsumerWidget {
  const GenerationBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final genState = ref.watch(generationProvider);

    if (!genState.hasActiveJobs) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      color: AppConfig.generationBanner,
      padding: const EdgeInsets.symmetric(
        horizontal: AppConfig.spacingLg,
        vertical: AppConfig.spacingSm,
      ),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: AppConfig.onSurface,
            ),
          ),
          SizedBox(width: AppConfig.spacingSm),
          Text(
            'Generating podcasts...',
            style: TextStyle(
              color: AppConfig.onSurface,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
