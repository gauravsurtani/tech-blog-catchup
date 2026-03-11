import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tech_blog_catchup/theme/theme.dart';

import 'pages/nav_page.dart';

void main() {
  late NavPageObject page;

  /// Build a minimal app with GoRouter that renders a BottomNavigationBar
  /// matching the real app's structure, without needing native audio or API.
  Widget buildNavApp({String initialRoute = '/'}) {
    SharedPreferences.setMockInitialValues({});

    final routes = [
      ShellRoute(
        builder: (context, state, child) {
          return _TestShell(child: child);
        },
        routes: [
          GoRoute(
            path: '/',
            builder: (context, state) =>
                const Center(child: Text('Home Content')),
          ),
          GoRoute(
            path: '/explore',
            builder: (context, state) =>
                const Center(child: Text('Explore Content')),
          ),
          GoRoute(
            path: '/playlist',
            builder: (context, state) =>
                const Center(child: Text('Playlist Content')),
          ),
          GoRoute(
            path: '/status',
            builder: (context, state) =>
                const Center(child: Text('Status Content')),
          ),
        ],
      ),
    ];

    final router = GoRouter(
      initialLocation: initialRoute,
      routes: routes,
    );

    return ProviderScope(
      child: MaterialApp.router(
        routerConfig: router,
        theme: buildAppTheme(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }

  group('Navigation', () {
    testWidgets('bottom nav shows 4 tabs', (tester) async {
      await tester.pumpWidget(buildNavApp());
      await tester.pumpAndSettle();

      page = NavPageObject(tester);
      expect(page.bottomNav, findsOneWidget);
      expect(page.homeTab, findsOneWidget);
      expect(page.exploreTab, findsOneWidget);
      expect(page.playlistTab, findsOneWidget);
      expect(page.statusTab, findsOneWidget);
    });

    testWidgets('bottom nav has 4 items', (tester) async {
      await tester.pumpWidget(buildNavApp());
      await tester.pumpAndSettle();

      page = NavPageObject(tester);
      final navBar = tester.widget<BottomNavigationBar>(page.bottomNav);
      expect(navBar.items.length, 4);
    });

    testWidgets('home tab is selected by default', (tester) async {
      await tester.pumpWidget(buildNavApp());
      await tester.pumpAndSettle();

      page = NavPageObject(tester);
      final navBar = tester.widget<BottomNavigationBar>(page.bottomNav);
      expect(navBar.currentIndex, 0);
    });

    testWidgets('tapping explore tab navigates to explore', (tester) async {
      await tester.pumpWidget(buildNavApp());
      await tester.pumpAndSettle();

      page = NavPageObject(tester);
      await tester.tap(page.exploreTab);
      await tester.pumpAndSettle();

      expect(find.text('Explore Content'), findsOneWidget);
    });

    testWidgets('tapping playlist tab navigates to playlist', (tester) async {
      await tester.pumpWidget(buildNavApp());
      await tester.pumpAndSettle();

      page = NavPageObject(tester);
      await tester.tap(page.playlistTab);
      await tester.pumpAndSettle();

      expect(find.text('Playlist Content'), findsOneWidget);
    });
  });
}

/// Minimal shell that mirrors the real app's bottom nav without audio player.
class _TestShell extends StatelessWidget {
  final Widget child;
  const _TestShell({required this.child});

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
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex(context),
        onTap: (i) => context.go(_tabs[i].path),
        items: [
          for (final tab in _tabs)
            BottomNavigationBarItem(
              icon: Icon(tab.icon),
              label: tab.label,
            ),
        ],
      ),
    );
  }
}
