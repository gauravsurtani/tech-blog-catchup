import SwiftUI

struct FilterSheetView: View {
    @Binding var selectedSources: Set<String>
    @Binding var selectedTags: Set<String>

    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss

    @State private var sources: [SourceInfo] = []
    @State private var tags: [TagInfo] = []
    @State private var isLoading = true

    var body: some View {
        NavigationStack {
            ZStack {
                theme.background.ignoresSafeArea()

                if isLoading {
                    ProgressView()
                        .tint(theme.textSecondary)
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: theme.spacingLg) {
                            // Sources section
                            VStack(alignment: .leading, spacing: theme.spacingSm) {
                                Text("Sources")
                                    .font(theme.titleMediumFont)
                                    .foregroundColor(theme.textPrimary)

                                ForEach(sources) { source in
                                    filterRow(
                                        label: source.name,
                                        count: source.postCount,
                                        isSelected: selectedSources.contains(source.key)
                                    ) {
                                        if selectedSources.contains(source.key) {
                                            selectedSources = selectedSources.subtracting([source.key])
                                        } else {
                                            selectedSources = selectedSources.union([source.key])
                                        }
                                    }
                                }
                            }

                            ThemedDivider()

                            // Tags section
                            VStack(alignment: .leading, spacing: theme.spacingSm) {
                                Text("Tags")
                                    .font(theme.titleMediumFont)
                                    .foregroundColor(theme.textPrimary)

                                FlowLayout(spacing: theme.spacingSm) {
                                    ForEach(tags) { tag in
                                        Button {
                                            if selectedTags.contains(tag.slug) {
                                                selectedTags = selectedTags.subtracting([tag.slug])
                                            } else {
                                                selectedTags = selectedTags.union([tag.slug])
                                            }
                                        } label: {
                                            HStack(spacing: 4) {
                                                Text(tag.name)
                                                    .font(theme.captionFont)
                                                Text("(\(tag.postCount))")
                                                    .font(theme.captionSmallFont)
                                            }
                                            .foregroundColor(
                                                selectedTags.contains(tag.slug) ? .white : theme.textSecondary
                                            )
                                            .padding(.horizontal, theme.spacingSm)
                                            .padding(.vertical, 6)
                                            .background(
                                                selectedTags.contains(tag.slug) ? theme.primary : theme.surface
                                            )
                                            .clipShape(RoundedRectangle(cornerRadius: theme.radiusFull))
                                            .overlay(
                                                RoundedRectangle(cornerRadius: theme.radiusFull)
                                                    .stroke(
                                                        selectedTags.contains(tag.slug) ? theme.primary : theme.cardBorder,
                                                        lineWidth: 1
                                                    )
                                            )
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                            }
                        }
                        .padding(theme.spacingMd)
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Clear All") {
                        selectedSources = []
                        selectedTags = []
                    }
                    .foregroundColor(theme.error)
                    .disabled(selectedSources.isEmpty && selectedTags.isEmpty)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Apply") {
                        dismiss()
                    }
                    .foregroundColor(theme.primary)
                    .fontWeight(.semibold)
                }
            }
        }
        .presentationDetents([.medium, .large])
        .task {
            await loadFilters()
        }
    }

    private func filterRow(label: String, count: Int, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isSelected ? theme.primary : theme.textTertiary)
                    .font(.system(size: 20))

                Text(label)
                    .font(theme.bodyFont)
                    .foregroundColor(theme.textPrimary)

                Spacer()

                Text("\(count)")
                    .font(theme.captionFont)
                    .foregroundColor(theme.textTertiary)
            }
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
    }

    private func loadFilters() async {
        do {
            async let sourcesReq = APIClient.shared.fetchSources()
            async let tagsReq = APIClient.shared.fetchTags()
            sources = try await sourcesReq
            tags = try await tagsReq
        } catch {
            // Silently fail - filters just won't show
        }
        isLoading = false
    }
}

// MARK: - Flow Layout

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = layoutSubviews(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = layoutSubviews(proposal: proposal, subviews: subviews)
        for (index, position) in result.positions.enumerated() {
            subviews[index].place(
                at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y),
                proposal: .unspecified
            )
        }
    }

    private func layoutSubviews(proposal: ProposedViewSize, subviews: Subviews) -> LayoutResult {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var currentX: CGFloat = 0
        var currentY: CGFloat = 0
        var lineHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)

            if currentX + size.width > maxWidth, currentX > 0 {
                currentX = 0
                currentY += lineHeight + spacing
                lineHeight = 0
            }

            positions.append(CGPoint(x: currentX, y: currentY))
            lineHeight = max(lineHeight, size.height)
            currentX += size.width + spacing
        }

        return LayoutResult(
            positions: positions,
            size: CGSize(width: maxWidth, height: currentY + lineHeight)
        )
    }

    private struct LayoutResult {
        let positions: [CGPoint]
        let size: CGSize
    }
}
