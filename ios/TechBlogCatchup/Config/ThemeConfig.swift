import Foundation

enum ThemeConfig {
    // MARK: - Background & Surface
    static let background = "#030712"
    static let surface = "#111827"
    static let surfaceHover = "#1F293780"
    static let cardBorder = "#1F2937"
    static let cardBorderHover = "#374151"

    // MARK: - Primary
    static let primary = "#2563EB"
    static let primaryHover = "#3B82F6"

    // MARK: - Accent
    static let accentBg = "#312E8199"
    static let accentBorder = "#4338CA80"
    static let accentText = "#A5B4FC"

    // MARK: - Semantic
    static let success = "#16A34A"
    static let successLight = "#4ADE80"
    static let warning = "#FACC15"
    static let warningBg = "#71370066"
    static let error = "#F87171"
    static let errorBg = "#7F1D1D4D"

    // MARK: - Text
    static let textPrimary = "#F3F4F6"
    static let textSecondary = "#9CA3AF"
    static let textTertiary = "#6B7280"
    static let textMuted = "#4B5563"

    // MARK: - Typography Sizes
    static let titleLarge: CGFloat = 24
    static let titleMedium: CGFloat = 18
    static let body: CGFloat = 16
    static let caption: CGFloat = 13
    static let captionSmall: CGFloat = 11

    // MARK: - Spacing
    static let spacingXs: CGFloat = 4
    static let spacingSm: CGFloat = 8
    static let spacingMd: CGFloat = 16
    static let spacingLg: CGFloat = 24
    static let spacingXl: CGFloat = 32

    // MARK: - Radii
    static let radiusSm: CGFloat = 8
    static let radiusMd: CGFloat = 12
    static let radiusLg: CGFloat = 16
    static let radiusFull: CGFloat = 999

    // MARK: - Layout
    static let miniPlayerHeight: CGFloat = 64
    static let bottomNavHeight: CGFloat = 49
    static let bannerHeight: CGFloat = 44

    // MARK: - Animation & Effects
    static let cardShadowRadius: CGFloat = 0
    static let animationDuration: Double = 0.25
    static let skeletonPulseSpeed: Double = 1.5
}
