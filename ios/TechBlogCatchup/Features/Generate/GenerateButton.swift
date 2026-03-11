import SwiftUI

struct GenerateButton: View {
    let audioStatus: Post.AudioStatus
    let post: Post
    var onGenerate: (() -> Void)?

    @Environment(\.theme) private var theme

    var body: some View {
        switch audioStatus {
        case .ready:
            Button {
                AudioPlayerService.shared.play(post: post)
                HapticService.playPause()
            } label: {
                HStack(spacing: theme.spacingSm) {
                    Image(systemName: "play.fill")
                        .font(.system(size: 14))
                    Text("Play Podcast")
                        .font(theme.bodyFont)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, theme.spacingSm)
                .background(theme.success)
                .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
            }
            .buttonStyle(.plain)

        case .pending, .failed:
            Button {
                onGenerate?()
                HapticService.generate()
            } label: {
                HStack(spacing: theme.spacingSm) {
                    Image(systemName: "waveform")
                        .font(.system(size: 14))
                    Text("Generate Podcast")
                        .font(theme.bodyFont)
                        .fontWeight(.semibold)
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, theme.spacingSm)
                .background(theme.primary)
                .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
            }
            .buttonStyle(.plain)

        case .processing:
            HStack(spacing: theme.spacingSm) {
                ProgressView()
                    .scaleEffect(0.8)
                    .tint(theme.textTertiary)
                Text("Generating...")
                    .font(theme.bodyFont)
                    .foregroundColor(theme.textTertiary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, theme.spacingSm)
            .background(theme.surface)
            .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
            .overlay(
                RoundedRectangle(cornerRadius: theme.radiusSm)
                    .stroke(theme.cardBorder, lineWidth: 1)
            )
        }
    }
}
