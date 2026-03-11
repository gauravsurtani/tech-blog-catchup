import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tech_blog_catchup/features/home/post_list_item.dart';

class HomePageObject {
  final WidgetTester tester;
  const HomePageObject(this.tester);

  Finder get appBarTitle => find.text('Your Podcast Feed');
  Finder get postItems => find.byType(PostListItem);
  Finder get loadingIndicator => find.byType(CircularProgressIndicator);
  Finder get emptyStateText => find.text('No podcasts yet');
  Finder get errorText => find.text('Failed to load posts');
  Finder get retryButton => find.text('Retry');

  Finder postTitle(String title) => find.text(title);

  Finder get pendingFooter => find.textContaining('pending');
}
