import SwiftUI

struct PendingFooterView: View {
    let pendingCount: Int
    @Binding var selectedTab: Int

    @Environment(\.theme) private var theme

    var body: some View {
        Button {
            selectedTab = 1
        } label: {
            HStack(spacing: theme.spacingSm) {
                Image(systemName: "clock")
                    .font(.system(size: 14))
                    .foregroundColor(theme.accentText)

                Text("\(pendingCount) posts pending.")
                    .font(theme.captionFont)
                    .foregroundColor(theme.textSecondary)

                Text("View in Explore")
                    .font(theme.captionFont)
                    .fontWeight(.medium)
                    .foregroundColor(theme.accentText)

                Image(systemName: "arrow.right")
                    .font(.system(size: 12))
                    .foregroundColor(theme.accentText)
            }
            .padding(theme.spacingMd)
            .frame(maxWidth: .infinity)
            .background(theme.accentBg)
            .clipShape(RoundedRectangle(cornerRadius: theme.radiusMd))
            .overlay(
                RoundedRectangle(cornerRadius: theme.radiusMd)
                    .stroke(theme.accentBorder, lineWidth: 1)
            )
            .padding(.horizontal, theme.spacingMd)
        }
        .buttonStyle(.plain)
    }
}
