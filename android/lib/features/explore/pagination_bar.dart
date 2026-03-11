import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme/app_config.dart';
import 'explore_filters_provider.dart';

class PaginationBar extends ConsumerWidget {
  final int total;
  final int pageSize;

  const PaginationBar({
    super.key,
    required this.total,
    required this.pageSize,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filters = ref.watch(exploreFiltersProvider);
    final totalPages = (total / pageSize).ceil();

    if (totalPages <= 1) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppConfig.spacingSm),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: filters.currentPage > 0
                ? () => ref
                    .read(exploreFiltersProvider.notifier)
                    .setPage(filters.currentPage - 1)
                : null,
          ),
          ...List.generate(
            totalPages > 7 ? 7 : totalPages,
            (i) {
              final page = _getPageNumber(i, filters.currentPage, totalPages);
              if (page < 0) {
                return const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 4),
                  child: Text('...', style: TextStyle(color: AppConfig.mutedText)),
                );
              }
              final isCurrent = page == filters.currentPage;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 2),
                child: TextButton(
                  onPressed: isCurrent
                      ? null
                      : () => ref
                          .read(exploreFiltersProvider.notifier)
                          .setPage(page),
                  style: TextButton.styleFrom(
                    backgroundColor:
                        isCurrent ? AppConfig.primary : Colors.transparent,
                    foregroundColor:
                        isCurrent ? AppConfig.onSurface : AppConfig.mutedText,
                    minimumSize: const Size(36, 36),
                    padding: EdgeInsets.zero,
                  ),
                  child: Text('${page + 1}'),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: filters.currentPage < totalPages - 1
                ? () => ref
                    .read(exploreFiltersProvider.notifier)
                    .setPage(filters.currentPage + 1)
                : null,
          ),
        ],
      ),
    );
  }

  int _getPageNumber(int index, int current, int total) {
    if (total <= 7) return index;
    if (index == 0) return 0;
    if (index == 6) return total - 1;
    if (current < 3) return index;
    if (current > total - 4) return total - 7 + index;
    if (index == 1 && current > 3) return -1; // ellipsis
    if (index == 5 && current < total - 4) return -1; // ellipsis
    return current - 3 + index;
  }
}
