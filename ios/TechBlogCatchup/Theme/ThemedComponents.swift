import SwiftUI

// MARK: - Button Style

enum ThemedButtonStyle {
    case primary
    case secondary
    case ghost
}

struct ThemedButton: View {
    let label: String
    var icon: String?
    let action: () -> Void
    var style: ThemedButtonStyle = .primary

    @Environment(\.theme) private var theme

    var body: some View {
        Button(action: action) {
            HStack(spacing: theme.spacingSm) {
                if let icon {
                    Image(systemName: icon)
                        .font(.system(size: theme.captionSize))
                }
                Text(label)
                    .font(theme.bodyFont)
                    .fontWeight(.medium)
            }
            .padding(.horizontal, theme.spacingMd)
            .padding(.vertical, theme.spacingSm)
            .foregroundColor(foregroundColor)
            .background(backgroundColor)
            .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
            .overlay(
                RoundedRectangle(cornerRadius: theme.radiusSm)
                    .stroke(borderColor, lineWidth: style == .secondary ? 1 : 0)
            )
        }
        .buttonStyle(.plain)
    }

    private var foregroundColor: Color {
        switch style {
        case .primary:
            return .white
        case .secondary:
            return theme.textSecondary
        case .ghost:
            return theme.textSecondary
        }
    }

    private var backgroundColor: Color {
        switch style {
        case .primary:
            return theme.primary
        case .secondary:
            return .clear
        case .ghost:
            return .clear
        }
    }

    private var borderColor: Color {
        switch style {
        case .primary:
            return .clear
        case .secondary:
            return theme.cardBorder
        case .ghost:
            return .clear
        }
    }
}

// MARK: - Card

struct ThemedCard<Content: View>: View {
    @ViewBuilder let content: () -> Content

    @Environment(\.theme) private var theme

    var body: some View {
        content()
            .padding(theme.spacingMd)
            .background(theme.surface)
            .clipShape(RoundedRectangle(cornerRadius: theme.radiusMd))
            .overlay(
                RoundedRectangle(cornerRadius: theme.radiusMd)
                    .stroke(theme.cardBorder, lineWidth: 1)
            )
    }
}

// MARK: - Badge

struct ThemedBadge: View {
    let text: String
    var color: Color?

    @Environment(\.theme) private var theme

    var body: some View {
        Text(text)
            .font(theme.captionSmallFont)
            .fontWeight(.medium)
            .padding(.horizontal, theme.spacingSm)
            .padding(.vertical, 2)
            .foregroundColor(color ?? theme.accentText)
            .background((color ?? theme.accentText).opacity(0.15))
            .clipShape(RoundedRectangle(cornerRadius: theme.radiusFull))
    }
}

// MARK: - Divider

struct ThemedDivider: View {
    @Environment(\.theme) private var theme

    var body: some View {
        Rectangle()
            .fill(theme.cardBorder)
            .frame(height: 1)
    }
}
