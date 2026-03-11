import SwiftUI

struct TagBadgeView: View {
    let tag: String
    var isSelected = false
    var onTap: (() -> Void)?

    @Environment(\.theme) private var theme

    var body: some View {
        Button {
            onTap?()
        } label: {
            Text(tag)
                .font(theme.captionSmallFont)
                .fontWeight(.medium)
                .padding(.horizontal, theme.spacingSm)
                .padding(.vertical, 4)
                .foregroundColor(isSelected ? .white : theme.accentText)
                .background(isSelected ? theme.primary : theme.accentText.opacity(0.15))
                .clipShape(RoundedRectangle(cornerRadius: theme.radiusFull))
        }
        .buttonStyle(.plain)
    }
}
