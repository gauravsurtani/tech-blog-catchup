import SwiftUI

struct SkeletonView: View {
    var width: CGFloat? = nil
    var height: CGFloat = 16
    var cornerRadius: CGFloat? = nil

    @Environment(\.theme) private var theme
    @State private var isAnimating = false

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius ?? theme.radiusSm)
            .fill(theme.surfaceHover)
            .frame(width: width, height: height)
            .opacity(isAnimating ? 0.4 : 0.8)
            .animation(
                .easeInOut(duration: theme.skeletonPulseSpeed)
                .repeatForever(autoreverses: true),
                value: isAnimating
            )
            .onAppear {
                isAnimating = true
            }
    }
}

struct SkeletonCardView: View {
    var lineCount: Int = 3

    @Environment(\.theme) private var theme

    var body: some View {
        ThemedCard {
            VStack(alignment: .leading, spacing: theme.spacingSm) {
                SkeletonView(height: 20)
                ForEach(0..<lineCount, id: \.self) { index in
                    SkeletonView(
                        width: index == lineCount - 1 ? 120 : nil,
                        height: 14
                    )
                }
            }
        }
    }
}
