import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:tech_blog_catchup/core/providers.dart';
import 'package:tech_blog_catchup/features/player/audio_player_state.dart';
import 'package:tech_blog_catchup/theme/theme.dart';

import 'mock_api_client.dart';
import 'test_audio_player.dart';

/// Provider that uses our test-safe audio player (no native plugins).
final testAudioPlayerProvider =
    StateNotifierProvider<TestAudioPlayerNotifier, AudioPlayerState>(
  (ref) => TestAudioPlayerNotifier(),
);

/// Build a fully-wired test app with mocked API + audio player.
///
/// Use [initialRoute] to control which screen loads first.
/// Pass additional [extraOverrides] if you need to override more providers.
Widget buildTestApp({
  required MockApiClient mockApi,
  String initialRoute = '/',
  List<Override> extraOverrides = const [],
  required List<RouteBase> routes,
}) {
  SharedPreferences.setMockInitialValues({});

  final router = GoRouter(
    initialLocation: initialRoute,
    routes: routes,
  );

  return ProviderScope(
    overrides: [
      apiClientProvider.overrideWithValue(mockApi),
      ...extraOverrides,
    ],
    child: MaterialApp.router(
      routerConfig: router,
      theme: buildAppTheme(),
      debugShowCheckedModeBanner: false,
    ),
  );
}

/// Simplified builder for single-screen tests (no shell/nav).
Widget buildSingleScreenTestApp({
  required MockApiClient mockApi,
  required Widget child,
  List<Override> extraOverrides = const [],
}) {
  SharedPreferences.setMockInitialValues({});

  return ProviderScope(
    overrides: [
      apiClientProvider.overrideWithValue(mockApi),
      ...extraOverrides,
    ],
    child: MaterialApp(
      theme: buildAppTheme(),
      debugShowCheckedModeBanner: false,
      home: child,
    ),
  );
}
