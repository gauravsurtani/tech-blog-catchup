import SwiftUI

struct PostCardView: View {
    let post: Post

    @Environment(\.theme) private var theme
    @State private var isGenerating = false
    @State private var generateError: String?

    var body: some View {
        ThemedCard {
            VStack(alignment: .leading, spacing: theme.spacingSm) {
                ThemedBadge(text: post.sourceName, color: theme.primary)

                Text(post.title)
                    .font(theme.titleMediumFont)
                    .foregroundColor(theme.textPrimary)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)

                if let summary = post.summary {
                    Text(summary)
                        .font(theme.captionFont)
                        .foregroundColor(theme.textSecondary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                }

                if !post.tags.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: theme.spacingXs) {
                            ForEach(post.tags, id: \.self) { tag in
                                TagBadgeView(tag: tag)
                            }
                        }
                    }
                }

                HStack {
                    if let published = post.publishedAt {
                        Text(published.formatTimeAgo())
                            .font(theme.captionSmallFont)
                            .foregroundColor(theme.textMuted)
                    }

                    if !post.formattedDuration.isEmpty {
                        Text(post.formattedDuration)
                            .font(theme.captionSmallFont)
                            .foregroundColor(theme.textMuted)
                    }

                    Spacer()
                    actionButton
                }
            }
        }
        .alert("Generation Failed", isPresented: .init(
            get: { generateError != nil },
            set: { if !$0 { generateError = nil } }
        )) {
            Button("OK") { generateError = nil }
        } message: {
            if let error = generateError {
                Text(error)
            }
        }
    }

    @ViewBuilder
    private var actionButton: some View {
        switch post.audioStatus {
        case .ready:
            Button {
                AudioPlayerService.shared.play(post: post)
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "play.fill")
                        .font(.system(size: 12))
                    Text("Play")
                        .font(theme.captionFont)
                        .fontWeight(.medium)
                }
                .foregroundColor(.white)
                .padding(.horizontal, theme.spacingSm)
                .padding(.vertical, 6)
                .background(theme.success)
                .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
            }
            .buttonStyle(.plain)

        case .pending, .failed:
            Button {
                Task { await triggerGenerate() }
            } label: {
                HStack(spacing: 4) {
                    Image(systemName: "waveform")
                        .font(.system(size: 12))
                    Text("Generate Podcast")
                        .font(theme.captionFont)
                        .fontWeight(.medium)
                }
                .foregroundColor(.white)
                .padding(.horizontal, theme.spacingSm)
                .padding(.vertical, 6)
                .background(theme.primary)
                .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
            }
            .buttonStyle(.plain)
            .disabled(isGenerating)

        case .processing:
            HStack(spacing: 4) {
                ProgressView()
                    .scaleEffect(0.7)
                    .tint(theme.textTertiary)
                Text("Generating...")
                    .font(theme.captionFont)
                    .foregroundColor(theme.textTertiary)
            }
            .padding(.horizontal, theme.spacingSm)
            .padding(.vertical, 6)
        }
    }

    private func triggerGenerate() async {
        isGenerating = true
        do {
            _ = try await APIClient.shared.triggerGenerate(postId: post.id)
        } catch let error as APIError {
            generateError = error.errorDescription
        } catch {
            generateError = error.localizedDescription
        }
        isGenerating = false
    }
}
