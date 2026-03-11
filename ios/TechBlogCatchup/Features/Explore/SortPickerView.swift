import SwiftUI

struct SortPickerView: View {
    @Binding var selection: SortOption

    @Environment(\.theme) private var theme

    var body: some View {
        Menu {
            ForEach(SortOption.allCases, id: \.self) { option in
                Button {
                    selection = option
                } label: {
                    HStack {
                        Text(option.label)
                        if selection == option {
                            Image(systemName: "checkmark")
                        }
                    }
                }
            }
        } label: {
            HStack(spacing: 4) {
                Image(systemName: "arrow.up.arrow.down")
                    .font(.system(size: 12))
                Text(selection.label)
                    .font(theme.captionFont)
            }
            .foregroundColor(theme.textSecondary)
            .padding(.horizontal, theme.spacingSm)
            .padding(.vertical, 6)
            .background(theme.surface)
            .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
            .overlay(
                RoundedRectangle(cornerRadius: theme.radiusSm)
                    .stroke(theme.cardBorder, lineWidth: 1)
            )
        }
    }
}
