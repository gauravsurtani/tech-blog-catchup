import SwiftUI

struct PostDetailView: View {
    let postId: Int

    @State private var viewModel = PostDetailViewModel()
    @Environment(\.theme) private var theme
    @Environment(\.openURL) private var openURL

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()

            if viewModel.isLoading && viewModel.post == nil {
                VStack(spacing: theme.spacingMd) {
                    SkeletonView(height: 120)
                    SkeletonView(height: 300)
                }
                .padding(theme.spacingMd)
            } else if let error = viewModel.error, viewModel.post == nil {
                EmptyStateView(
                    icon: "exclamationmark.triangle",
                    title: "Failed to Load Post",
                    message: error,
                    actionLabel: "Retry"
                ) {
                    Task { await viewModel.loadPost(id: postId) }
                }
            } else if let post = viewModel.post {
                ScrollView {
                    VStack(alignment: .leading, spacing: theme.spacingMd) {
                        // Action button at top
                        GenerateButton(
                            audioStatus: post.audioStatus,
                            post: post.asPost,
                            onGenerate: {
                                Task { await viewModel.generatePodcast() }
                            }
                        )

                        // Metadata header
                        PostMetadataHeader(post: post)

                        ThemedDivider()

                        // Content
                        if let fullText = post.fullText, !fullText.isEmpty {
                            MarkdownContentView(text: fullText)
                        } else {
                            EmptyStateView(
                                icon: "doc.text",
                                title: "No Content",
                                message: "Full text not available for this post."
                            )
                        }

                        ThemedDivider()

                        // External link
                        Button {
                            if let url = URL(string: post.url) {
                                openURL(url)
                            }
                        } label: {
                            HStack(spacing: theme.spacingSm) {
                                Image(systemName: "safari")
                                    .font(.system(size: 16))
                                Text("Read Original Article")
                                    .font(theme.bodyFont)
                                    .fontWeight(.medium)
                                Spacer()
                                Image(systemName: "arrow.up.right")
                                    .font(.system(size: 14))
                            }
                            .foregroundColor(theme.accentText)
                            .padding(theme.spacingMd)
                            .background(theme.accentBg)
                            .clipShape(RoundedRectangle(cornerRadius: theme.radiusMd))
                            .overlay(
                                RoundedRectangle(cornerRadius: theme.radiusMd)
                                    .stroke(theme.accentBorder, lineWidth: 1)
                            )
                        }
                        .buttonStyle(.plain)

                        // Bottom action button
                        GenerateButton(
                            audioStatus: post.audioStatus,
                            post: post.asPost,
                            onGenerate: {
                                Task { await viewModel.generatePodcast() }
                            }
                        )

                        Spacer()
                            .frame(height: ThemeConfig.miniPlayerHeight + ThemeConfig.bottomNavHeight + theme.spacingLg)
                    }
                    .padding(theme.spacingMd)
                }
                .refreshable {
                    await viewModel.refresh(id: postId)
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .alert("Generation Error", isPresented: .init(
            get: { viewModel.generateError != nil },
            set: { if !$0 { viewModel.clearGenerateError() } }
        )) {
            Button("OK") { viewModel.clearGenerateError() }
        } message: {
            if let error = viewModel.generateError {
                Text(error)
            }
        }
        .task {
            await viewModel.loadPost(id: postId)
        }
    }
}
