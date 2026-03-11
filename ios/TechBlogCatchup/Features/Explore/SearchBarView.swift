import SwiftUI

struct SearchBarView: View {
    @Binding var text: String

    @Environment(\.theme) private var theme

    var body: some View {
        HStack(spacing: theme.spacingSm) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 16))
                .foregroundColor(theme.textTertiary)

            TextField("Search posts...", text: $text)
                .font(theme.bodyFont)
                .foregroundColor(theme.textPrimary)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)

            if !text.isEmpty {
                Button {
                    text = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 16))
                        .foregroundColor(theme.textTertiary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, theme.spacingMd)
        .padding(.vertical, theme.spacingSm)
        .background(theme.surface)
        .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
        .overlay(
            RoundedRectangle(cornerRadius: theme.radiusSm)
                .stroke(theme.cardBorder, lineWidth: 1)
        )
    }
}
