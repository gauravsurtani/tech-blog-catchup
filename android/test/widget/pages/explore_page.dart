import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tech_blog_catchup/features/explore/post_card.dart';

class ExplorePageObject {
  final WidgetTester tester;
  const ExplorePageObject(this.tester);

  Finder get appBarTitle => find.text('Explore');
  Finder get searchField => find.byType(TextField);
  Finder get postCards => find.byType(PostCard);
  Finder get loadingIndicator => find.byType(CircularProgressIndicator);
  Finder get emptyStateText => find.text('No posts found');
  Finder get errorText => find.text('Failed to load posts');
  Finder get retryButton => find.text('Retry');
  Finder get filtersButton => find.textContaining('Filters');
  Finder get sortDropdown => find.byType(DropdownButton<String>);

  Finder postTitle(String title) => find.text(title);
}
