import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/app_config.dart';
import 'home_provider.dart';
import 'pending_footer.dart';
import 'post_list_item.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(homeProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(homeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Your Podcast Feed'),
      ),
      body: _buildBody(state),
    );
  }

  Widget _buildBody(HomeState state) {
    if (state.error != null && state.posts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Failed to load posts',
              style: TextStyle(color: AppConfig.error, fontSize: 16),
            ),
            const SizedBox(height: AppConfig.spacingSm),
            ElevatedButton(
              onPressed: () => ref.read(homeProvider.notifier).refresh(),
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (state.isLoading && state.posts.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.posts.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.podcasts, size: 48, color: AppConfig.mutedText),
            SizedBox(height: AppConfig.spacingLg),
            Text(
              'No podcasts yet',
              style: TextStyle(color: AppConfig.mutedText, fontSize: 16),
            ),
            SizedBox(height: AppConfig.spacingSm),
            Text(
              'Generate podcasts from the Explore tab',
              style: TextStyle(color: AppConfig.placeholderText, fontSize: 14),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(homeProvider.notifier).refresh(),
      child: ListView.builder(
        controller: _scrollController,
        itemCount: state.posts.length + 1,
        itemBuilder: (context, index) {
          if (index == state.posts.length) {
            if (state.isLoading) {
              return const Padding(
                padding: EdgeInsets.all(AppConfig.spacingLg),
                child: Center(child: CircularProgressIndicator()),
              );
            }
            return PendingFooter(pendingCount: state.pendingCount);
          }
          return PostListItem(post: state.posts[index]);
        },
      ),
    );
  }
}
