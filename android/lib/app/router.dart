import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_config.dart';
import 'shell_scaffold.dart';
import '../features/home/home_screen.dart';
import '../features/explore/explore_screen.dart';
import '../features/playlist/playlist_screen.dart';
import '../features/status/status_screen.dart';
import '../features/post/post_detail_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    errorBuilder: (context, state) => Scaffold(
      backgroundColor: AppConfig.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline,
                color: AppConfig.mutedText, size: 64),
            const SizedBox(height: AppConfig.spacingLg),
            const Text(
              'Page not found',
              style: TextStyle(
                color: AppConfig.onSurface,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppConfig.spacingLg),
            ElevatedButton(
              onPressed: () => context.go('/'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
    routes: [
      ShellRoute(
        builder: (context, state, child) => ShellScaffold(child: child),
        routes: [
          GoRoute(
            path: '/',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: HomeScreen(),
            ),
          ),
          GoRoute(
            path: '/explore',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ExploreScreen(),
            ),
          ),
          GoRoute(
            path: '/playlist',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: PlaylistScreen(),
            ),
          ),
          GoRoute(
            path: '/status',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: StatusScreen(),
            ),
          ),
        ],
      ),
      GoRoute(
        path: '/post/:id',
        builder: (context, state) => PostDetailScreen(
          postId: state.pathParameters['id']!,
        ),
      ),
    ],
  );
});
