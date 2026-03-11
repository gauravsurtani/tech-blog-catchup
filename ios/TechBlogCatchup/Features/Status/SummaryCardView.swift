import SwiftUI

struct SummaryCardView: View {
    let icon: String
    let value: Int
    let label: String
    var accentColor: Color?

    @Environment(\.theme) private var theme

    var body: some View {
        ThemedCard {
            VStack(spacing: theme.spacingSm) {
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundColor(accentColor ?? theme.primary)

                Text("\(value)")
                    .font(theme.titleLargeFont)
                    .foregroundColor(theme.textPrimary)

                Text(label)
                    .font(theme.captionFont)
                    .foregroundColor(theme.textSecondary)
            }
            .frame(maxWidth: .infinity)
        }
    }
}
