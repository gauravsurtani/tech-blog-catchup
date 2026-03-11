import 'dart:async';

import 'package:flutter/material.dart';

import '../../theme/app_config.dart';

class ExploreSearchBar extends StatefulWidget {
  final ValueChanged<String> onSearch;

  const ExploreSearchBar({super.key, required this.onSearch});

  @override
  State<ExploreSearchBar> createState() => _ExploreSearchBarState();
}

class _ExploreSearchBarState extends State<ExploreSearchBar> {
  final _controller = TextEditingController();
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    setState(() {});
    _debounce?.cancel();
    _debounce = Timer(
      const Duration(milliseconds: AppConfig.debounceMs),
      () => widget.onSearch(value),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppConfig.spacingLg,
        vertical: AppConfig.spacingSm,
      ),
      child: TextField(
        controller: _controller,
        onChanged: _onChanged,
        decoration: InputDecoration(
          hintText: 'Search posts...',
          prefixIcon: const Icon(Icons.search, color: AppConfig.mutedText),
          suffixIcon: _controller.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear, color: AppConfig.mutedText),
                  onPressed: () {
                    _controller.clear();
                    setState(() {});
                    widget.onSearch('');
                  },
                )
              : null,
        ),
      ),
    );
  }
}
