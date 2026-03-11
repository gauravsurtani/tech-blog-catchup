import Foundation

@MainActor
@Observable
final class PlaylistViewModel {
    private(set) var posts: [Post] = []
    private(set) var isLoading = false
    private(set) var error: String?
    private(set) var sources: [SourceInfo] = []
    private(set) var tags: [TagInfo] = []
    var selectedSource: String?
    var selectedTag: String?
    var searchText: String = "" {
        didSet { scheduleSearch() }
    }

    private var searchTask: Task<Void, Never>?

    func loadPlaylist() async {
        isLoading = true
        error = nil
        do {
            let searchParam = searchText.trimmingCharacters(in: .whitespaces)
            let result = try await APIClient.shared.fetchPlaylist(
                source: selectedSource,
                tag: selectedTag,
                search: searchParam.isEmpty ? nil : searchParam,
                limit: AppConfig.playlistPageSize
            )
            posts = result.posts
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func loadFilters() async {
        do {
            async let fetchedSources = APIClient.shared.fetchSources()
            async let fetchedTags = APIClient.shared.fetchTags()
            sources = try await fetchedSources
            tags = try await fetchedTags
        } catch {
            // Filters are non-critical
        }
    }

    func refresh() async {
        await loadPlaylist()
    }

    func applySourceFilter(_ source: String?) async {
        selectedSource = source
        await loadPlaylist()
    }

    func applyTagFilter(_ tag: String?) async {
        selectedTag = tag
        await loadPlaylist()
    }

    private func scheduleSearch() {
        searchTask?.cancel()
        searchTask = Task {
            try? await Task.sleep(nanoseconds: UInt64(AppConfig.searchDebounceMs) * 1_000_000)
            guard !Task.isCancelled else { return }
            await loadPlaylist()
        }
    }
}
