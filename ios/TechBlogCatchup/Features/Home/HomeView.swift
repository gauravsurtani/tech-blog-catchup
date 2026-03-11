import SwiftUI

struct HomeView: View {
    @State private var viewModel = HomeViewModel()
    @Environment(\.theme) private var theme
    @Binding var selectedTab: Int

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()

            if viewModel.isLoading && viewModel.posts.isEmpty {
                ScrollView {
                    LazyVStack(spacing: theme.spacingSm) {
                        ForEach(0..<6, id: \.self) { _ in
                            SkeletonView(height: 72)
                                .padding(.horizontal, theme.spacingMd)
                        }
                    }
                    .padding(.top, theme.spacingMd)
                }
            } else if let error = viewModel.error, viewModel.posts.isEmpty {
                EmptyStateView(
                    icon: "exclamationmark.triangle",
                    title: "Failed to Load",
                    message: error,
                    actionLabel: "Retry"
                ) {
                    Task { await viewModel.loadPosts() }
                }
            } else if viewModel.posts.isEmpty {
                EmptyStateView(
                    icon: "headphones",
                    title: "No Podcasts Yet",
                    message: "Generate podcasts from tech blog posts to see them here."
                )
            } else {
                ScrollView {
                    LazyVStack(spacing: 0) {
                        ForEach(viewModel.posts) { post in
                            NavigationLink(value: post.id) {
                                PostListItemView(post: post)
                            }
                            .buttonStyle(.plain)

                            if post.id != viewModel.posts.last?.id {
                                ThemedDivider()
                                    .padding(.horizontal, theme.spacingMd)
                            }
                        }

                        if viewModel.hasMore {
                            ProgressView()
                                .tint(theme.textSecondary)
                                .padding(theme.spacingMd)
                                .onAppear {
                                    Task { await viewModel.loadMore() }
                                }
                        }

                        if viewModel.pendingCount > 0 {
                            PendingFooterView(
                                pendingCount: viewModel.pendingCount,
                                selectedTab: $selectedTab
                            )
                            .padding(.top, theme.spacingMd)
                        }

                        Spacer()
                            .frame(height: ThemeConfig.miniPlayerHeight + ThemeConfig.bottomNavHeight + theme.spacingLg)
                    }
                    .padding(.top, theme.spacingSm)
                }
                .refreshable {
                    await viewModel.refresh()
                }
            }
        }
        .navigationTitle("Your Podcast Feed")
        .toolbarColorScheme(.dark, for: .navigationBar)
        .navigationDestination(for: Int.self) { postId in
            PostDetailView(postId: postId)
        }
        .task {
            if viewModel.posts.isEmpty {
                await viewModel.loadPosts()
            }
        }
    }
}
