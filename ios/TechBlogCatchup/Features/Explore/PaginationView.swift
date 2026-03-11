import SwiftUI

struct PaginationView: View {
    let currentPage: Int
    let totalPages: Int
    let onPageChange: (Int) -> Void

    @Environment(\.theme) private var theme

    var body: some View {
        HStack(spacing: theme.spacingSm) {
            // Previous button
            Button {
                onPageChange(currentPage - 1)
            } label: {
                Image(systemName: "chevron.left")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(currentPage > 1 ? theme.textSecondary : theme.textMuted)
                    .frame(width: 32, height: 32)
            }
            .buttonStyle(.plain)
            .disabled(currentPage <= 1)

            // Page numbers
            ForEach(visiblePages, id: \.self) { page in
                if page == -1 {
                    Text("...")
                        .font(theme.captionFont)
                        .foregroundColor(theme.textTertiary)
                        .frame(width: 32, height: 32)
                } else {
                    Button {
                        onPageChange(page)
                    } label: {
                        Text("\(page)")
                            .font(theme.captionFont)
                            .fontWeight(page == currentPage ? .bold : .regular)
                            .foregroundColor(page == currentPage ? .white : theme.textSecondary)
                            .frame(width: 32, height: 32)
                            .background(page == currentPage ? theme.primary : .clear)
                            .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
                    }
                    .buttonStyle(.plain)
                }
            }

            // Next button
            Button {
                onPageChange(currentPage + 1)
            } label: {
                Image(systemName: "chevron.right")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(currentPage < totalPages ? theme.textSecondary : theme.textMuted)
                    .frame(width: 32, height: 32)
            }
            .buttonStyle(.plain)
            .disabled(currentPage >= totalPages)
        }
        .padding(.vertical, theme.spacingSm)
    }

    private var visiblePages: [Int] {
        guard totalPages > 1 else { return [1] }

        var pages: [Int] = []

        // Always show first page
        pages.append(1)

        // Show ellipsis if needed
        if currentPage > 3 {
            pages.append(-1)
        }

        // Show pages around current
        let rangeStart = max(2, currentPage - 1)
        let rangeEnd = min(totalPages - 1, currentPage + 1)
        for page in rangeStart...max(rangeStart, rangeEnd) {
            pages.append(page)
        }

        // Show ellipsis if needed
        if currentPage < totalPages - 2 {
            pages.append(-1)
        }

        // Always show last page
        if totalPages > 1 {
            pages.append(totalPages)
        }

        return pages
    }
}
