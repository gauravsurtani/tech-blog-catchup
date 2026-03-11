import SwiftUI

struct GenerationBannerView: View {
    @Environment(\.theme) private var theme

    var body: some View {
        HStack(spacing: theme.spacingSm) {
            Image(systemName: "waveform")
                .font(.system(size: 14))
                .foregroundColor(theme.accentText)
                .symbolEffect(.variableColor.iterative)

            Text("Generating podcasts...")
                .font(theme.captionFont)
                .fontWeight(.medium)
                .foregroundColor(theme.accentText)

            Spacer()

            ProgressView()
                .scaleEffect(0.7)
                .tint(theme.accentText)
        }
        .padding(.horizontal, theme.spacingMd)
        .frame(height: theme.bannerHeight)
        .background(theme.accentBg)
        .overlay(
            Rectangle()
                .fill(theme.accentBorder)
                .frame(height: 1),
            alignment: .bottom
        )
        .transition(.move(edge: .top).combined(with: .opacity))
    }
}
