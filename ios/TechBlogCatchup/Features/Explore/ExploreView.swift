import SwiftUI

struct ExploreView: View {
    @State private var viewModel = ExploreViewModel()
    @State private var showFilters = false
    @Environment(\.theme) private var theme

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()

            VStack(spacing: 0) {
                VStack(spacing: theme.spacingSm) {
                    SearchBarView(text: $viewModel.searchText)

                    HStack(spacing: theme.spacingSm) {
                        SortPickerView(selection: $viewModel.sortOption)

                        Button {
                            showFilters = true
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: "line.3.horizontal.decrease")
                                    .font(.system(size: 14))
                                Text("Filters")
                                    .font(theme.captionFont)
                                if viewModel.activeFilterCount > 0 {
                                    Text("\(viewModel.activeFilterCount)")
                                        .font(theme.captionSmallFont)
                                        .fontWeight(.bold)
                                        .foregroundColor(.white)
                                        .frame(width: 18, height: 18)
                                        .background(theme.primary)
                                        .clipShape(Circle())
                                }
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
                        .buttonStyle(.plain)

                        Spacer()

                        Text("\(viewModel.total) posts")
                            .font(theme.captionFont)
                            .foregroundColor(theme.textTertiary)
                    }
                }
                .padding(.horizontal, theme.spacingMd)
                .padding(.vertical, theme.spacingSm)

                ThemedDivider()

                if viewModel.isLoading && viewModel.posts.isEmpty {
                    ScrollView {
                        LazyVGrid(
                            columns: [GridItem(.flexible())],
                            spacing: theme.spacingMd
                        ) {
                            ForEach(0..<6, id: \.self) { _ in
                                SkeletonView(height: 180)
                            }
                        }
                        .padding(theme.spacingMd)
                    }
                } else if let error = viewModel.error, viewModel.posts.isEmpty {
                    Spacer()
                    EmptyStateView(
                        icon: "exclamationmark.triangle",
                        title: "Failed to Load",
                        message: error,
                        actionLabel: "Retry"
                    ) {
                        Task { await viewModel.fetchPosts() }
                    }
                    Spacer()
                } else if viewModel.posts.isEmpty {
                    Spacer()
                    EmptyStateView(
                        icon: "magnifyingglass",
                        title: "No Posts Found",
                        message: "Try adjusting your search or filters."
                    )
                    Spacer()
                } else {
                    ScrollView {
                        LazyVGrid(
                            columns: [GridItem(.flexible())],
                            spacing: theme.spacingMd
                        ) {
                            ForEach(viewModel.posts) { post in
                                NavigationLink(value: post.id) {
                                    PostCardView(post: post)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(theme.spacingMd)

                        if viewModel.totalPages > 1 {
                            PaginationView(
                                currentPage: viewModel.currentPage,
                                totalPages: viewModel.totalPages
                            ) { page in
                                Task { await viewModel.goToPage(page) }
                            }
                            .padding(.bottom, theme.spacingMd)
                        }

                        Spacer()
                            .frame(height: ThemeConfig.miniPlayerHeight + ThemeConfig.bottomNavHeight + theme.spacingLg)
                    }
                    .refreshable {
                        await viewModel.refresh()
                    }
                }
            }
        }
        .navigationTitle("Explore")
        .toolbarColorScheme(.dark, for: .navigationBar)
        .navigationDestination(for: Int.self) { postId in
            PostDetailView(postId: postId)
        }
        .sheet(isPresented: $showFilters) {
            FilterSheetView(
                selectedSources: $viewModel.selectedSources,
                selectedTags: $viewModel.selectedTags
            )
        }
        .task {
            if viewModel.posts.isEmpty {
                await viewModel.fetchPosts()
            }
        }
    }
}
