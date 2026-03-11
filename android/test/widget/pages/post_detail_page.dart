import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

class PostDetailPageObject {
  final WidgetTester tester;
  const PostDetailPageObject(this.tester);

  Finder get loadingIndicator => find.byType(CircularProgressIndicator);
  Finder get errorText => find.text('Failed to load post');
  Finder get retryButton => find.text('Retry');
  Finder get noContentText => find.text('No content available');
  Finder get markdownBody => find.byType(MarkdownBody);
  Finder get playButton => find.text('Play');
  Finder get generateButton => find.text('Generate Podcast');

  /// Find title text anywhere on screen (may appear in both AppBar and body).
  Finder titleInAppBar(String title) => find.text(title);

  /// Find the AppBar widget specifically.
  Finder get appBar => find.byType(AppBar);
}
