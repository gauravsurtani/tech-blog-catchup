import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'bottom_nav.dart';
import '../features/generate/generation_banner.dart';
import '../features/player/audio_player_provider.dart';
import '../features/player/expanded_player_widget.dart';
import '../features/player/mini_player_widget.dart';

class ShellScaffold extends ConsumerWidget {
  final Widget child;

  const ShellScaffold({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isExpanded = ref.watch(
      audioPlayerProvider.select((s) => s.isExpanded),
    );

    if (isExpanded) {
      return const ExpandedPlayerWidget();
    }

    return Scaffold(
      body: Column(
        children: [
          const GenerationBanner(),
          Expanded(child: child),
        ],
      ),
      bottomNavigationBar: const Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          MiniPlayerWidget(),
          BottomNav(),
        ],
      ),
    );
  }
}
