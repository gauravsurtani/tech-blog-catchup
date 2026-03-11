import SwiftUI

struct MiniPlayerView: View {
    @Environment(\.theme) private var theme
    let viewModel: PlayerViewModel

    var body: some View {
        if let track = viewModel.currentTrack {
            VStack(spacing: 0) {
                progressBar

                HStack(spacing: theme.spacingMd) {
                    trackInfo(track)

                    Spacer()

                    controlButtons

                    speedBadge
                }
                .padding(.horizontal, theme.spacingMd)
                .frame(height: theme.miniPlayerHeight - 2)
            }
            .frame(height: theme.miniPlayerHeight)
            .background(theme.surface)
            .overlay(alignment: .top) {
                Rectangle()
                    .fill(theme.cardBorder)
                    .frame(height: 1)
            }
            .contentShape(Rectangle())
            .onTapGesture {
                viewModel.isExpanded = true
            }
        }
    }

    // MARK: - Progress Bar

    private var progressBar: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                Rectangle()
                    .fill(theme.cardBorder)

                Rectangle()
                    .fill(theme.primary)
                    .frame(width: geometry.size.width * viewModel.progress)
            }
        }
        .frame(height: 2)
    }

    // MARK: - Track Info

    private func trackInfo(_ track: Post) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(track.title)
                .font(theme.captionFont)
                .fontWeight(.medium)
                .foregroundColor(theme.textPrimary)
                .lineLimit(1)

            Text(track.sourceName)
                .font(theme.captionSmallFont)
                .foregroundColor(theme.textSecondary)
                .lineLimit(1)
        }
        .allowsHitTesting(false)
    }

    // MARK: - Controls

    private var controlButtons: some View {
        HStack(spacing: theme.spacingSm) {
            Button(action: {
                viewModel.togglePlayPause()
                HapticService.playPause()
            }) {
                Image(systemName: viewModel.isPlaying ? "pause.fill" : "play.fill")
                    .font(.system(size: 20))
                    .foregroundColor(theme.textPrimary)
                    .frame(width: 36, height: 36)
            }
            .buttonStyle(.plain)

            Button(action: viewModel.next) {
                Image(systemName: "forward.fill")
                    .font(.system(size: 14))
                    .foregroundColor(theme.textSecondary)
                    .frame(width: 32, height: 32)
            }
            .buttonStyle(.plain)
            .opacity(viewModel.queue.isEmpty ? 0.4 : 1.0)
            .disabled(viewModel.queue.isEmpty)
        }
    }

    // MARK: - Speed Badge

    private var speedBadge: some View {
        Group {
            if viewModel.playbackRate != 1.0 {
                Text(formatSpeed(viewModel.playbackRate))
                    .font(theme.captionSmallFont)
                    .fontWeight(.semibold)
                    .foregroundColor(theme.accentText)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(theme.accentBg)
                    .clipShape(RoundedRectangle(cornerRadius: theme.radiusFull))
            }
        }
    }

    private func formatSpeed(_ rate: Float) -> String {
        if rate == Float(Int(rate)) {
            return "\(Int(rate))x"
        }
        return String(format: "%.1fx", rate)
    }
}
