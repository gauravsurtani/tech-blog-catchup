import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class NavPageObject {
  final WidgetTester tester;
  const NavPageObject(this.tester);

  Finder get bottomNav => find.byType(BottomNavigationBar);

  Finder tabByLabel(String label) => find.text(label);

  Finder get homeTab => tabByLabel('Home');
  Finder get exploreTab => tabByLabel('Explore');
  Finder get playlistTab => tabByLabel('Playlist');
  Finder get statusTab => tabByLabel('Status');
}
