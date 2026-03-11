import SwiftUI

struct CrawlStatusRow: View {
    let item: CrawlStatusItem
    @Environment(\.theme) private var theme
    @State private var showError = false

    private var statusColor: Color {
        switch item.status {
        case "success":
            return theme.success
        case "error", "failed":
            return theme.error
        case "running":
            return theme.warning
        default:
            return theme.textMuted
        }
    }

    private var progress: Double {
        guard let total = item.totalDiscoverable, total > 0 else { return 0 }
        return Double(item.postCount) / Double(total)
    }

    var body: some View {
        ThemedCard {
            VStack(alignment: .leading, spacing: theme.spacingSm) {
                HStack(spacing: theme.spacingSm) {
                    Circle()
                        .fill(statusColor)
                        .frame(width: 8, height: 8)

                    Text(item.sourceName)
                        .font(theme.bodyFont)
                        .fontWeight(.medium)
                        .foregroundColor(theme.textPrimary)

                    Spacer()

                    if let lastCrawl = item.lastCrawlAt {
                        Text(lastCrawl.formatTimeAgo())
                            .font(theme.captionSmallFont)
                            .foregroundColor(theme.textMuted)
                    } else {
                        Text("Never")
                            .font(theme.captionSmallFont)
                            .foregroundColor(theme.textMuted)
                    }
                }

                HStack(spacing: theme.spacingSm) {
                    Text("\(item.postCount)")
                        .font(theme.captionFont)
                        .fontWeight(.semibold)
                        .foregroundColor(theme.textPrimary)

                    if let total = item.totalDiscoverable, total > 0 {
                        Text("/ \(total)")
                            .font(theme.captionFont)
                            .foregroundColor(theme.textSecondary)
                        Text("posts")
                            .font(theme.captionSmallFont)
                            .foregroundColor(theme.textMuted)
                    } else {
                        Text("posts")
                            .font(theme.captionSmallFont)
                            .foregroundColor(theme.textMuted)
                    }

                    Spacer()

                    if let type = item.lastCrawlType {
                        ThemedBadge(text: type)
                    }
                }

                if let total = item.totalDiscoverable, total > 0 {
                    ProgressBarView(
                        progress: progress,
                        height: 4,
                        fillColor: statusColor
                    )
                }

                if let errorMessage = item.errorMessage {
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            showError.toggle()
                        }
                    } label: {
                        HStack(spacing: theme.spacingXs) {
                            Image(systemName: "exclamationmark.circle")
                            Text(showError ? "Hide error" : "Show error")
                            Spacer()
                            Image(systemName: showError ? "chevron.up" : "chevron.down")
                                .font(.system(size: 10))
                        }
                        .font(theme.captionSmallFont)
                        .foregroundColor(theme.error)
                    }
                    .buttonStyle(.plain)

                    if showError {
                        Text(errorMessage)
                            .font(theme.captionSmallFont)
                            .foregroundColor(theme.error.opacity(0.8))
                            .lineLimit(3)
                    }
                }
            }
        }
    }
}
