import 'package:flutter/material.dart';

/// Single source of truth for ALL visual configuration.
/// Change colors, spacing, typography here — widgets read from this file only.
/// Never hardcode Color/TextStyle values in widget files.
class AppConfig {
  AppConfig._();

  // ──────────────────────────────────────────────
  // Colors
  // ──────────────────────────────────────────────

  static const background = Color(0xFF030712); // gray-950
  static const surface = Color(0xFF111827); // gray-900
  static const surfaceVariant = Color(0xFF1F2937); // gray-800
  static const cardBorder = Color(0xFF1F2937); // gray-800
  static const outline = Color(0xFF374151); // gray-700

  static const primary = Color(0xFF2563EB); // blue-600
  static const primaryHover = Color(0xFF3B82F6); // blue-500
  static const primaryMuted = Color(0x4D2563EB); // blue-600 @ 30%

  static const onSurface = Color(0xFFF3F4F6); // gray-100
  static const textSecondary = Color(0xFFD1D5DB); // gray-200
  static const mutedText = Color(0xFF9CA3AF); // gray-400
  static const placeholderText = Color(0xFF6B7280); // gray-500

  static const error = Color(0xFFEF4444); // red-500
  static const errorMuted = Color(0x33EF4444); // red-500 @ 20%
  static const success = Color(0xFF22C55E); // green-500
  static const successMuted = Color(0x3322C55E); // green-500 @ 20%
  static const warning = Color(0xFFEAB308); // yellow-500
  static const warningMuted = Color(0x33EAB308); // yellow-500 @ 20%

  static const generationBanner = Color(0xFF4F46E5); // indigo-600

  // ──────────────────────────────────────────────
  // Audio status colors
  // ──────────────────────────────────────────────

  static Color audioStatusColor(String status) {
    switch (status) {
      case 'ready':
        return success;
      case 'pending':
        return primary;
      case 'processing':
        return warning;
      case 'failed':
        return error;
      default:
        return mutedText;
    }
  }

  // ──────────────────────────────────────────────
  // Crawl status colors
  // ──────────────────────────────────────────────

  static Color crawlStatusColor(String status) {
    switch (status) {
      case 'success':
        return success;
      case 'error':
        return error;
      case 'running':
        return warning;
      case 'never':
        return mutedText;
      default:
        return mutedText;
    }
  }

  // ──────────────────────────────────────────────
  // Quality badge colors
  // ──────────────────────────────────────────────

  static Color qualityColor(int? score) {
    if (score == null) return mutedText;
    if (score >= 80) return success;
    if (score >= 60) return primary;
    if (score >= 40) return warning;
    return error;
  }

  static String qualityGrade(int? score) {
    if (score == null) return '?';
    if (score >= 80) return 'A';
    if (score >= 60) return 'B';
    if (score >= 40) return 'C';
    if (score >= 20) return 'D';
    return 'F';
  }

  // ──────────────────────────────────────────────
  // Spacing
  // ──────────────────────────────────────────────

  static const double spacingXs = 4.0;
  static const double spacingSm = 8.0;
  static const double spacingMd = 12.0;
  static const double spacingLg = 16.0;
  static const double spacingXl = 24.0;
  static const double spacingXxl = 32.0;

  // ──────────────────────────────────────────────
  // Border Radius
  // ──────────────────────────────────────────────

  static const double radiusSm = 6.0;
  static const double radiusMd = 8.0;
  static const double radiusLg = 12.0;
  static const double radiusXl = 16.0;
  static const double radiusFull = 999.0;

  // ──────────────────────────────────────────────
  // Elevation
  // ──────────────────────────────────────────────

  static const double elevationNone = 0;
  static const double elevationSm = 1;
  static const double elevationMd = 2;
  static const double elevationLg = 4;

  // ──────────────────────────────────────────────
  // Player
  // ──────────────────────────────────────────────

  static const double miniPlayerHeight = 64.0;
  static const List<double> playbackSpeeds = [
    0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0,
  ];
  static const double defaultVolume = 1.0;
  static const double defaultPlaybackRate = 1.0;
  static const int seekStepSeconds = 10;
  static const int previousRestartThresholdSeconds = 3;

  // ──────────────────────────────────────────────
  // Pagination
  // ──────────────────────────────────────────────

  static const int homePageSize = 12;
  static const int explorePageSize = 20;
  static const int debounceMs = 300;

  // ──────────────────────────────────────────────
  // Polling
  // ──────────────────────────────────────────────

  static const int jobPollIntervalSeconds = 5;

  // ──────────────────────────────────────────────
  // API
  // ──────────────────────────────────────────────

  static const int apiTimeoutSeconds = 10;
  static const int maxRetries = 3;
  static const int initialBackoffMs = 500;
}
