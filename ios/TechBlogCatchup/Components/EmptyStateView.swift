import SwiftUI

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String
    var actionLabel: String?
    var action: (() -> Void)?

    @Environment(\.theme) private var theme

    var body: some View {
        VStack(spacing: theme.spacingMd) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundColor(theme.textMuted)

            Text(title)
                .font(theme.titleMediumFont)
                .foregroundColor(theme.textPrimary)

            Text(message)
                .font(theme.captionFont)
                .foregroundColor(theme.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, theme.spacingLg)

            if let actionLabel, let action {
                ThemedButton(label: actionLabel, action: action)
            }
        }
        .padding(.top, theme.spacingXl)
        .frame(maxWidth: .infinity)
    }
}
