import SwiftUI

@Observable
final class AppTheme {
    static let shared = AppTheme()

    private init() {}

    // MARK: - Background & Surface
    var background: Color { Color(hex: ThemeConfig.background) }
    var surface: Color { Color(hex: ThemeConfig.surface) }
    var surfaceHover: Color { Color(hex: ThemeConfig.surfaceHover) }
    var cardBorder: Color { Color(hex: ThemeConfig.cardBorder) }
    var cardBorderHover: Color { Color(hex: ThemeConfig.cardBorderHover) }

    // MARK: - Primary
    var primary: Color { Color(hex: ThemeConfig.primary) }
    var primaryHover: Color { Color(hex: ThemeConfig.primaryHover) }

    // MARK: - Accent
    var accentBg: Color { Color(hex: ThemeConfig.accentBg) }
    var accentBorder: Color { Color(hex: ThemeConfig.accentBorder) }
    var accentText: Color { Color(hex: ThemeConfig.accentText) }

    // MARK: - Semantic
    var success: Color { Color(hex: ThemeConfig.success) }
    var successLight: Color { Color(hex: ThemeConfig.successLight) }
    var warning: Color { Color(hex: ThemeConfig.warning) }
    var warningBg: Color { Color(hex: ThemeConfig.warningBg) }
    var error: Color { Color(hex: ThemeConfig.error) }
    var errorBg: Color { Color(hex: ThemeConfig.errorBg) }

    // MARK: - Text
    var textPrimary: Color { Color(hex: ThemeConfig.textPrimary) }
    var textSecondary: Color { Color(hex: ThemeConfig.textSecondary) }
    var textTertiary: Color { Color(hex: ThemeConfig.textTertiary) }
    var textMuted: Color { Color(hex: ThemeConfig.textMuted) }

    // MARK: - Typography
    var titleLargeFont: Font { .system(size: ThemeConfig.titleLarge, weight: .bold) }
    var titleMediumFont: Font { .system(size: ThemeConfig.titleMedium, weight: .semibold) }
    var bodyFont: Font { .system(size: ThemeConfig.body) }
    var captionFont: Font { .system(size: ThemeConfig.caption) }
    var captionSmallFont: Font { .system(size: ThemeConfig.captionSmall) }

    var titleLargeSize: CGFloat { ThemeConfig.titleLarge }
    var titleMediumSize: CGFloat { ThemeConfig.titleMedium }
    var bodySize: CGFloat { ThemeConfig.body }
    var captionSize: CGFloat { ThemeConfig.caption }
    var captionSmallSize: CGFloat { ThemeConfig.captionSmall }

    // MARK: - Spacing
    var spacingXs: CGFloat { ThemeConfig.spacingXs }
    var spacingSm: CGFloat { ThemeConfig.spacingSm }
    var spacingMd: CGFloat { ThemeConfig.spacingMd }
    var spacingLg: CGFloat { ThemeConfig.spacingLg }
    var spacingXl: CGFloat { ThemeConfig.spacingXl }

    // MARK: - Radii
    var radiusSm: CGFloat { ThemeConfig.radiusSm }
    var radiusMd: CGFloat { ThemeConfig.radiusMd }
    var radiusLg: CGFloat { ThemeConfig.radiusLg }
    var radiusFull: CGFloat { ThemeConfig.radiusFull }

    // MARK: - Layout
    var miniPlayerHeight: CGFloat { ThemeConfig.miniPlayerHeight }
    var bottomNavHeight: CGFloat { ThemeConfig.bottomNavHeight }
    var bannerHeight: CGFloat { ThemeConfig.bannerHeight }

    // MARK: - Animation & Effects
    var cardShadowRadius: CGFloat { ThemeConfig.cardShadowRadius }
    var animationDuration: Double { ThemeConfig.animationDuration }
    var skeletonPulseSpeed: Double { ThemeConfig.skeletonPulseSpeed }
}
