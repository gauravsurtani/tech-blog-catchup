import 'package:flutter_test/flutter_test.dart';
import 'package:tech_blog_catchup/features/explore/explore_filters_provider.dart';

void main() {
  late ExploreFiltersNotifier notifier;

  setUp(() {
    notifier = ExploreFiltersNotifier();
  });

  tearDown(() {
    notifier.dispose();
  });

  group('ExploreFiltersNotifier', () {
    test('default state has empty sources, tags, blank search, -published_at sort, page 0', () {
      final s = notifier.state;
      expect(s.selectedSources, isEmpty);
      expect(s.selectedTags, isEmpty);
      expect(s.searchQuery, '');
      expect(s.sortBy, '-published_at');
      expect(s.currentPage, 0);
    });

    test('toggleSource adds source and resets page to 0', () {
      notifier.setPage(3);
      notifier.toggleSource('uber');
      expect(notifier.state.selectedSources, {'uber'});
      expect(notifier.state.currentPage, 0);
    });

    test('toggleSource removes existing source', () {
      notifier.toggleSource('uber');
      notifier.toggleSource('meta');
      notifier.toggleSource('uber');
      expect(notifier.state.selectedSources, {'meta'});
    });

    test('toggleTag adds tag and resets page to 0', () {
      notifier.setPage(5);
      notifier.toggleTag('ml');
      expect(notifier.state.selectedTags, {'ml'});
      expect(notifier.state.currentPage, 0);
    });

    test('toggleTag removes existing tag', () {
      notifier.toggleTag('ml');
      notifier.toggleTag('frontend');
      notifier.toggleTag('ml');
      expect(notifier.state.selectedTags, {'frontend'});
    });

    test('setSearch updates query and resets page to 0', () {
      notifier.setPage(2);
      notifier.setSearch('kubernetes');
      expect(notifier.state.searchQuery, 'kubernetes');
      expect(notifier.state.currentPage, 0);
    });

    test('setSort updates sort and resets page to 0', () {
      notifier.setPage(4);
      notifier.setSort('published_at');
      expect(notifier.state.sortBy, 'published_at');
      expect(notifier.state.currentPage, 0);
    });

    test('setPage updates currentPage', () {
      notifier.setPage(7);
      expect(notifier.state.currentPage, 7);
    });

    test('clearAll resets to default state', () {
      notifier.toggleSource('uber');
      notifier.toggleTag('ml');
      notifier.setSearch('test');
      notifier.setSort('title');
      notifier.setPage(3);

      notifier.clearAll();

      final s = notifier.state;
      expect(s.selectedSources, isEmpty);
      expect(s.selectedTags, isEmpty);
      expect(s.searchQuery, '');
      expect(s.sortBy, '-published_at');
      expect(s.currentPage, 0);
    });
  });
}
