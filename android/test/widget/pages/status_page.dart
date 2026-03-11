import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class StatusPageObject {
  final WidgetTester tester;
  const StatusPageObject(this.tester);

  Finder get appBarTitle => find.text('Dashboard');
  Finder get totalPostsText => find.textContaining('Total Posts');
  Finder get crawlButton => find.text('Crawl All Sources');
  Finder get generateButton => find.text('Generate Podcasts');
  Finder get loadingIndicator => find.byType(CircularProgressIndicator);
  Finder get errorText => find.text('Failed to load status');
  Finder get retryButton => find.text('Retry');
  Finder get crawlStatusHeader => find.text('Crawl Status');

  Finder sourceRow(String name) => find.text(name);
}
