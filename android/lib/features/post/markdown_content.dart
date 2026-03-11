import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

import '../../theme/app_config.dart';

class MarkdownContent extends StatelessWidget {
  final String content;

  const MarkdownContent({super.key, required this.content});

  @override
  Widget build(BuildContext context) {
    return MarkdownBody(
      data: content,
      selectable: true,
      styleSheet: MarkdownStyleSheet(
        p: const TextStyle(
          color: AppConfig.onSurface,
          fontSize: 15,
          height: 1.6,
        ),
        h1: const TextStyle(
          color: AppConfig.onSurface,
          fontSize: 24,
          fontWeight: FontWeight.bold,
        ),
        h2: const TextStyle(
          color: AppConfig.onSurface,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
        h3: const TextStyle(
          color: AppConfig.onSurface,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        a: const TextStyle(
          color: AppConfig.primary,
          decoration: TextDecoration.underline,
        ),
        code: const TextStyle(
          color: AppConfig.onSurface,
          backgroundColor: AppConfig.surfaceVariant,
          fontSize: 13,
          fontFamily: 'monospace',
        ),
        codeblockDecoration: BoxDecoration(
          color: AppConfig.surfaceVariant,
          borderRadius: BorderRadius.circular(AppConfig.radiusMd),
        ),
        blockquoteDecoration: const BoxDecoration(
          border: Border(
            left: BorderSide(color: AppConfig.primary, width: 3),
          ),
        ),
        blockquotePadding: const EdgeInsets.only(left: AppConfig.spacingMd),
        listBullet: const TextStyle(color: AppConfig.mutedText),
      ),
    );
  }
}
