import SwiftUI

struct PostListItemView: View {
    let post: Post

    @Environment(\.theme) private var theme

    var body: some View {
        HStack(spacing: theme.spacingMd) {
            Button {
                AudioPlayerService.shared.play(post: post)
                HapticService.playPause()
            } label: {
                ZStack {
                    Circle()
                        .fill(theme.success)
                        .frame(width: 40, height: 40)
                    Image(systemName: "play.fill")
                        .font(.system(size: 14))
                        .foregroundColor(.white)
                }
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: theme.spacingXs) {
                Text(post.title)
                    .font(theme.bodyFont)
                    .fontWeight(.semibold)
                    .foregroundColor(theme.textPrimary)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)

                HStack(spacing: theme.spacingSm) {
                    Text(post.sourceName)
                        .font(theme.captionFont)
                        .foregroundColor(theme.textSecondary)

                    if !post.formattedDuration.isEmpty {
                        Text(post.formattedDuration)
                            .font(theme.captionSmallFont)
                            .foregroundColor(theme.textTertiary)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(theme.surface)
                            .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
                    }
                }
            }

            Spacer()

            Button {
                AudioPlayerService.shared.addToQueue(post: post)
                HapticService.queueAction()
            } label: {
                Image(systemName: "text.badge.plus")
                    .font(.system(size: 16))
                    .foregroundColor(theme.textTertiary)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, theme.spacingMd)
        .padding(.vertical, theme.spacingSm)
        .contentShape(Rectangle())
    }
}
