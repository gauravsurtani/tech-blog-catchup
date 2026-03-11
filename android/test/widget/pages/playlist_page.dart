import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class PlaylistPageObject {
  final WidgetTester tester;
  const PlaylistPageObject(this.tester);

  Finder get appBarTitle => find.text('Playlist');
  Finder get emptyStateText => find.text('No tracks in queue');
  Finder get emptyStateSubtext =>
      find.text('Add posts from Home or Explore to build your playlist');
  Finder get emptyStateIcon => find.byIcon(Icons.queue_music_rounded);
  Finder get playAllButton => find.byTooltip('Play All');
  Finder get clearButton => find.byTooltip('Clear');

  Finder trackTitle(String title) => find.text(title);
}
