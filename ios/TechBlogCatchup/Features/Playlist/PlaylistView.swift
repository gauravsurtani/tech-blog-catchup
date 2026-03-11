import SwiftUI

struct PlaylistView: View {
    @Environment(\.theme) private var theme
    @State private var viewModel = PlaylistViewModel()
    private let audioPlayer = AudioPlayerService.shared

    var body: some View {
        ScrollView {
            VStack(spacing: theme.spacingMd) {
                SearchBarView(text: $viewModel.searchText)
                headerSection
                filterSection
                contentSection
            }
            .padding(.horizontal, theme.spacingMd)
            .padding(.top, theme.spacingSm)
        }
        .background(theme.background)
        .navigationTitle("Playlist")
        .navigationDestination(for: Int.self) { postId in
            PostDetailView(postId: postId)
        }
        .refreshable {
            await viewModel.refresh()
        }
        .task {
            async let playlist: () = viewModel.loadPlaylist()
            async let filters: () = viewModel.loadFilters()
            _ = await (playlist, filters)
        }
    }

    // MARK: - Header

    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: theme.spacingXs) {
                Text("\(viewModel.posts.count) episodes")
                    .font(theme.captionFont)
                    .foregroundColor(theme.textSecondary)
            }
            Spacer()
            if !viewModel.posts.isEmpty {
                ThemedButton(label: "Play All", icon: "play.fill", action: {
                    audioPlayer.playAll(posts: viewModel.posts)
                })
            }
        }
    }

    // MARK: - Filters

    private var filterSection: some View {
        HStack(spacing: theme.spacingSm) {
            sourceFilterMenu
            tagFilterMenu
            Spacer()
        }
    }

    private var sourceFilterMenu: some View {
        Menu {
            Button("All Sources") {
                Task { await viewModel.applySourceFilter(nil) }
            }
            ForEach(viewModel.sources) { source in
                Button(source.name) {
                    Task { await viewModel.applySourceFilter(source.key) }
                }
            }
        } label: {
            HStack(spacing: theme.spacingXs) {
                Image(systemName: "building.2")
                Text(viewModel.selectedSource ?? "Source")
                    .lineLimit(1)
                Image(systemName: "chevron.down")
                    .font(.system(size: 10))
            }
            .font(theme.captionFont)
            .foregroundColor(viewModel.selectedSource != nil ? theme.primary : theme.textSecondary)
            .padding(.horizontal, theme.spacingSm)
            .padding(.vertical, theme.spacingXs)
            .background(theme.surface)
            .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
            .overlay(
                RoundedRectangle(cornerRadius: theme.radiusSm)
                    .stroke(viewModel.selectedSource != nil ? theme.primary : theme.cardBorder, lineWidth: 1)
            )
        }
    }

    private var tagFilterMenu: some View {
        Menu {
            Button("All Tags") {
                Task { await viewModel.applyTagFilter(nil) }
            }
            ForEach(viewModel.tags) { tag in
                Button(tag.name) {
                    Task { await viewModel.applyTagFilter(tag.slug) }
                }
            }
        } label: {
            HStack(spacing: theme.spacingXs) {
                Image(systemName: "tag")
                Text(viewModel.selectedTag ?? "Tag")
                    .lineLimit(1)
                Image(systemName: "chevron.down")
                    .font(.system(size: 10))
            }
            .font(theme.captionFont)
            .foregroundColor(viewModel.selectedTag != nil ? theme.primary : theme.textSecondary)
            .padding(.horizontal, theme.spacingSm)
            .padding(.vertical, theme.spacingXs)
            .background(theme.surface)
            .clipShape(RoundedRectangle(cornerRadius: theme.radiusSm))
            .overlay(
                RoundedRectangle(cornerRadius: theme.radiusSm)
                    .stroke(viewModel.selectedTag != nil ? theme.primary : theme.cardBorder, lineWidth: 1)
            )
        }
    }

    // MARK: - Content

    @ViewBuilder
    private var contentSection: some View {
        if viewModel.isLoading && viewModel.posts.isEmpty {
            loadingView
        } else if let error = viewModel.error, viewModel.posts.isEmpty {
            errorView(error)
        } else if viewModel.posts.isEmpty {
            emptyStateView
        } else {
            postListView
        }
    }

    private var loadingView: some View {
        VStack(spacing: theme.spacingMd) {
            ForEach(0..<5, id: \.self) { _ in
                ThemedCard {
                    HStack {
                        RoundedRectangle(cornerRadius: theme.radiusSm)
                            .fill(theme.surfaceHover)
                            .frame(height: 48)
                    }
                }
            }
        }
    }

    private func errorView(_ message: String) -> some View {
        VStack(spacing: theme.spacingMd) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 40))
                .foregroundColor(theme.error)
            Text("Failed to load playlist")
                .font(theme.titleMediumFont)
                .foregroundColor(theme.textPrimary)
            Text(message)
                .font(theme.captionFont)
                .foregroundColor(theme.textSecondary)
                .multilineTextAlignment(.center)
            ThemedButton(label: "Retry", icon: "arrow.clockwise", action: {
                Task { await viewModel.loadPlaylist() }
            })
        }
        .padding(.top, theme.spacingXl)
    }

    private var emptyStateView: some View {
        VStack(spacing: theme.spacingMd) {
            Image(systemName: "music.note.list")
                .font(.system(size: 48))
                .foregroundColor(theme.textMuted)
            Text("No podcasts yet")
                .font(theme.titleMediumFont)
                .foregroundColor(theme.textPrimary)
            Text("Generate podcasts from blog posts to see them here.")
                .font(theme.captionFont)
                .foregroundColor(theme.textSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, theme.spacingXl)
    }

    private var postListView: some View {
        LazyVStack(spacing: theme.spacingSm) {
            ForEach(viewModel.posts) { post in
                NavigationLink(value: post.id) {
                    PlaylistRowView(post: post)
                }
                .buttonStyle(.plain)
            }
        }
    }
}

// MARK: - Playlist Row

private struct PlaylistRowView: View {
    let post: Post
    @Environment(\.theme) private var theme
    private let audioPlayer = AudioPlayerService.shared

    private var isCurrentTrack: Bool {
        audioPlayer.currentTrack?.id == post.id
    }

    var body: some View {
        ThemedCard {
            HStack(spacing: theme.spacingSm) {
                playButton
                VStack(alignment: .leading, spacing: theme.spacingXs) {
                    Text(post.title)
                        .font(theme.bodyFont)
                        .fontWeight(.medium)
                        .foregroundColor(isCurrentTrack ? theme.primary : theme.textPrimary)
                        .lineLimit(2)
                    HStack(spacing: theme.spacingSm) {
                        Text(post.sourceName)
                            .font(theme.captionSmallFont)
                            .foregroundColor(theme.textSecondary)
                        if !post.formattedDuration.isEmpty {
                            Text(post.formattedDuration)
                                .font(theme.captionSmallFont)
                                .foregroundColor(theme.textMuted)
                        }
                    }
                }
                Spacer()
                queueButton
            }
        }
    }

    private var playButton: some View {
        Button {
            if isCurrentTrack {
                audioPlayer.togglePlayPause()
            } else {
                audioPlayer.play(post: post)
            }
            HapticService.playPause()
        } label: {
            Image(systemName: isCurrentTrack && audioPlayer.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                .font(.system(size: 36))
                .foregroundColor(isCurrentTrack ? theme.primary : theme.textSecondary)
        }
        .buttonStyle(.plain)
    }

    private var queueButton: some View {
        Button {
            audioPlayer.addToQueue(post: post)
            HapticService.queueAction()
        } label: {
            Image(systemName: "text.append")
                .font(.system(size: 16))
                .foregroundColor(theme.textMuted)
        }
        .buttonStyle(.plain)
    }
}
