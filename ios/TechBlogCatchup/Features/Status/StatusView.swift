import SwiftUI

struct StatusView: View {
    @Environment(\.theme) private var theme
    @State private var viewModel = StatusViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: theme.spacingLg) {
                if let error = viewModel.error {
                    errorBanner(error)
                }
                summarySection
                actionSection
                crawlStatusSection
            }
            .padding(.horizontal, theme.spacingMd)
            .padding(.top, theme.spacingSm)
        }
        .background(theme.background)
        .navigationTitle("Status")
        .refreshable {
            await viewModel.refresh()
        }
        .task {
            await viewModel.loadStatus()
        }
    }

    // MARK: - Error Banner

    private func errorBanner(_ message: String) -> some View {
        HStack(spacing: theme.spacingSm) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(theme.error)
            Text(message)
                .font(theme.captionFont)
                .foregroundColor(theme.error)
                .lineLimit(2)
            Spacer()
        }
        .padding(theme.spacingSm)
        .background(theme.errorBg)
        .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
    }

    // MARK: - Summary Cards

    private var summarySection: some View {
        LazyVGrid(columns: [
            GridItem(.flexible(), spacing: theme.spacingSm),
            GridItem(.flexible(), spacing: theme.spacingSm)
        ], spacing: theme.spacingSm) {
            SummaryCardView(
                icon: "doc.text",
                value: viewModel.totalPosts,
                label: "Total Posts",
                accentColor: theme.primary
            )
            SummaryCardView(
                icon: "headphones",
                value: viewModel.audioReady,
                label: "Audio Ready",
                accentColor: theme.success
            )
            SummaryCardView(
                icon: "clock",
                value: viewModel.audioPending,
                label: "Pending",
                accentColor: theme.warning
            )
            SummaryCardView(
                icon: "building.2",
                value: viewModel.sourceCount,
                label: "Sources",
                accentColor: theme.accentText
            )
        }
    }

    // MARK: - Actions

    private var actionSection: some View {
        HStack(spacing: theme.spacingSm) {
            Button {
                Task { await viewModel.triggerCrawl() }
            } label: {
                HStack(spacing: theme.spacingSm) {
                    if viewModel.isCrawling {
                        ProgressView()
                            .tint(.white)
                            .scaleEffect(0.8)
                    } else {
                        Image(systemName: "arrow.triangle.2.circlepath")
                    }
                    Text("Crawl All")
                        .fontWeight(.medium)
                }
                .font(theme.bodyFont)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, theme.spacingSm)
                .background(theme.primary)
                .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
            }
            .buttonStyle(.plain)
            .disabled(viewModel.isCrawling)

            Button {
                Task { await viewModel.triggerGenerate() }
            } label: {
                HStack(spacing: theme.spacingSm) {
                    if viewModel.isGenerating {
                        ProgressView()
                            .tint(.white)
                            .scaleEffect(0.8)
                    } else {
                        Image(systemName: "waveform")
                    }
                    Text("Generate")
                        .fontWeight(.medium)
                }
                .font(theme.bodyFont)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, theme.spacingSm)
                .background(theme.success)
                .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
            }
            .buttonStyle(.plain)
            .disabled(viewModel.isGenerating)
        }
    }

    // MARK: - Crawl Status List

    private var crawlStatusSection: some View {
        VStack(alignment: .leading, spacing: theme.spacingSm) {
            Text("Sources")
                .font(theme.titleMediumFont)
                .foregroundColor(theme.textPrimary)

            if viewModel.isLoading && viewModel.crawlStatus.isEmpty {
                ForEach(0..<4, id: \.self) { _ in
                    ThemedCard {
                        HStack {
                            RoundedRectangle(cornerRadius: theme.radiusSm)
                                .fill(theme.surfaceHover)
                                .frame(height: 56)
                        }
                    }
                }
            } else {
                ForEach(viewModel.crawlStatus) { item in
                    CrawlStatusRow(item: item)
                }
            }
        }
    }
}
