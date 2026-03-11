import SwiftUI

struct PlaybackSpeedPicker: View {
    @Environment(\.theme) private var theme
    let viewModel: PlayerViewModel

    var body: some View {
        Menu {
            ForEach(AppConfig.playbackSpeeds, id: \.self) { speed in
                Button {
                    viewModel.playbackRate = speed
                } label: {
                    HStack {
                        Text(formatSpeed(speed))
                        if viewModel.playbackRate == speed {
                            Image(systemName: "checkmark")
                        }
                    }
                }
            }
        } label: {
            Text(formatSpeed(viewModel.playbackRate))
                .font(theme.captionFont)
                .fontWeight(.semibold)
                .foregroundColor(viewModel.playbackRate == 1.0 ? theme.textSecondary : theme.accentText)
                .padding(.horizontal, theme.spacingSm)
                .padding(.vertical, theme.spacingXs)
                .background(
                    viewModel.playbackRate == 1.0
                        ? theme.surfaceHover
                        : theme.accentBg
                )
                .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
        }
    }

    private func formatSpeed(_ rate: Float) -> String {
        if rate == Float(Int(rate)) {
            return "\(Int(rate))x"
        }
        return String(format: "%.2gx", rate)
    }
}
