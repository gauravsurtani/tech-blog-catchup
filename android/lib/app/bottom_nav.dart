import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class BottomNav extends ConsumerWidget {
  const BottomNav({super.key});

  static const _tabs = [
    (path: '/', icon: Icons.home_rounded, label: 'Home'),
    (path: '/explore', icon: Icons.explore_rounded, label: 'Explore'),
    (path: '/playlist', icon: Icons.queue_music_rounded, label: 'Playlist'),
    (path: '/status', icon: Icons.dashboard_rounded, label: 'Status'),
  ];

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    for (var i = 0; i < _tabs.length; i++) {
      if (location == _tabs[i].path) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final index = _currentIndex(context);

    return BottomNavigationBar(
      currentIndex: index,
      onTap: (i) => context.go(_tabs[i].path),
      items: [
        for (final tab in _tabs)
          BottomNavigationBarItem(
            icon: Icon(tab.icon),
            label: tab.label,
          ),
      ],
    );
  }
}
