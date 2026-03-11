import 'package:flutter/material.dart';
import 'app_config.dart';

ThemeData buildAppTheme() {
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,

    // Core colors
    colorScheme: const ColorScheme.dark(
      surface: AppConfig.background,
      primary: AppConfig.primary,
      onPrimary: AppConfig.onSurface,
      onSurface: AppConfig.onSurface,
      error: AppConfig.error,
      onError: AppConfig.onSurface,
      outline: AppConfig.outline,
      surfaceContainerHighest: AppConfig.surfaceVariant,
    ),

    scaffoldBackgroundColor: AppConfig.background,
    canvasColor: AppConfig.surface,

    // AppBar
    appBarTheme: const AppBarTheme(
      backgroundColor: AppConfig.surface,
      foregroundColor: AppConfig.onSurface,
      elevation: AppConfig.elevationNone,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: TextStyle(
        color: AppConfig.onSurface,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
    ),

    // Bottom Nav
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppConfig.surface,
      selectedItemColor: AppConfig.primary,
      unselectedItemColor: AppConfig.mutedText,
      type: BottomNavigationBarType.fixed,
      elevation: AppConfig.elevationNone,
    ),

    // Cards
    cardTheme: CardThemeData(
      color: AppConfig.surface,
      elevation: AppConfig.elevationNone,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConfig.radiusLg),
        side: const BorderSide(color: AppConfig.cardBorder),
      ),
    ),

    // Chips
    chipTheme: ChipThemeData(
      backgroundColor: AppConfig.surfaceVariant,
      labelStyle: const TextStyle(color: AppConfig.textSecondary, fontSize: 12),
      side: const BorderSide(color: AppConfig.outline),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConfig.radiusFull),
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: AppConfig.spacingSm,
        vertical: AppConfig.spacingXs,
      ),
    ),

    // Buttons
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppConfig.primary,
        foregroundColor: AppConfig.onSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConfig.radiusMd),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppConfig.spacingLg,
          vertical: AppConfig.spacingMd,
        ),
      ),
    ),

    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppConfig.primary,
      ),
    ),

    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppConfig.onSurface,
        side: const BorderSide(color: AppConfig.outline),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConfig.radiusMd),
        ),
      ),
    ),

    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(foregroundColor: AppConfig.onSurface),
    ),

    // Input
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppConfig.surface,
      hintStyle: const TextStyle(color: AppConfig.placeholderText),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConfig.radiusMd),
        borderSide: const BorderSide(color: AppConfig.outline),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConfig.radiusMd),
        borderSide: const BorderSide(color: AppConfig.outline),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConfig.radiusMd),
        borderSide: const BorderSide(color: AppConfig.primary, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppConfig.spacingLg,
        vertical: AppConfig.spacingMd,
      ),
    ),

    // Divider
    dividerTheme: const DividerThemeData(
      color: AppConfig.outline,
      thickness: 1,
    ),

    // Progress indicator
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: AppConfig.primary,
      linearTrackColor: AppConfig.surfaceVariant,
    ),

    // Slider
    sliderTheme: const SliderThemeData(
      activeTrackColor: AppConfig.primary,
      inactiveTrackColor: AppConfig.surfaceVariant,
      thumbColor: AppConfig.primary,
      overlayColor: AppConfig.primaryMuted,
      trackHeight: 4,
      thumbShape: RoundSliderThumbShape(enabledThumbRadius: 6),
    ),

    // Snackbar
    snackBarTheme: SnackBarThemeData(
      backgroundColor: AppConfig.surfaceVariant,
      contentTextStyle: const TextStyle(color: AppConfig.onSurface),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConfig.radiusMd),
      ),
      behavior: SnackBarBehavior.floating,
    ),

    // Bottom sheet
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: AppConfig.surface,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppConfig.radiusXl),
        ),
      ),
    ),

    // Dialog
    dialogTheme: DialogThemeData(
      backgroundColor: AppConfig.surface,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConfig.radiusLg),
      ),
    ),

    // Text
    textTheme: const TextTheme(
      headlineLarge: TextStyle(
        color: AppConfig.onSurface,
        fontSize: 28,
        fontWeight: FontWeight.bold,
      ),
      headlineMedium: TextStyle(
        color: AppConfig.onSurface,
        fontSize: 22,
        fontWeight: FontWeight.w600,
      ),
      titleLarge: TextStyle(
        color: AppConfig.onSurface,
        fontSize: 18,
        fontWeight: FontWeight.w600,
      ),
      titleMedium: TextStyle(
        color: AppConfig.onSurface,
        fontSize: 16,
        fontWeight: FontWeight.w500,
      ),
      bodyLarge: TextStyle(
        color: AppConfig.onSurface,
        fontSize: 16,
      ),
      bodyMedium: TextStyle(
        color: AppConfig.textSecondary,
        fontSize: 14,
      ),
      bodySmall: TextStyle(
        color: AppConfig.mutedText,
        fontSize: 12,
      ),
      labelLarge: TextStyle(
        color: AppConfig.onSurface,
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
      labelSmall: TextStyle(
        color: AppConfig.mutedText,
        fontSize: 11,
      ),
    ),
  );
}
