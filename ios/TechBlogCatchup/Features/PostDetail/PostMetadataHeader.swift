import SwiftUI

struct PostMetadataHeader: View {
    let post: PostDetail

    @Environment(\.theme) private var theme

    var body: some View {
        VStack(alignment: .leading, spacing: theme.spacingSm) {
            // Title
            Text(post.title)
                .font(theme.titleLargeFont)
                .foregroundColor(theme.textPrimary)
                .fixedSize(horizontal: false, vertical: true)

            // Source badge + author
            HStack(spacing: theme.spacingSm) {
                ThemedBadge(text: post.sourceName, color: theme.primary)

                if let author = post.author, !author.isEmpty {
                    Text("by \(author)")
                        .font(theme.captionFont)
                        .foregroundColor(theme.textSecondary)
                }
            }

            // Metadata row
            HStack(spacing: theme.spacingMd) {
                if let publishedAt = post.publishedAt {
                    metadataItem(icon: "calendar", text: publishedAt.formatTimeAgo())
                }

                if let wordCount = post.wordCount {
                    metadataItem(icon: "doc.text", text: "\(wordCount) words")
                }

                if let secs = post.audioDurationSecs {
                    metadataItem(icon: "clock", text: Date.formatDuration(seconds: secs))
                }
            }

            // Quality badge
            if let score = post.qualityScore {
                HStack(spacing: theme.spacingSm) {
                    Text("Quality:")
                        .font(theme.captionFont)
                        .foregroundColor(theme.textTertiary)

                    ThemedBadge(
                        text: qualityGrade(score: score),
                        color: qualityColor(score: score)
                    )
                }
            }

            // Tags
            if !post.tags.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: theme.spacingXs) {
                        ForEach(post.tags, id: \.self) { tag in
                            TagBadgeView(tag: tag)
                        }
                    }
                }
            }
        }
    }

    private func metadataItem(icon: String, text: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.system(size: 12))
            Text(text)
                .font(theme.captionFont)
        }
        .foregroundColor(theme.textTertiary)
    }

    private func qualityGrade(score: Int) -> String {
        switch score {
        case 80...100: return "A"
        case 60..<80: return "B"
        case 40..<60: return "C"
        case 20..<40: return "D"
        default: return "F"
        }
    }

    private func qualityColor(score: Int) -> Color {
        switch score {
        case 80...100: return theme.success
        case 60..<80: return theme.successLight
        case 40..<60: return theme.warning
        default: return theme.error
        }
    }
}
