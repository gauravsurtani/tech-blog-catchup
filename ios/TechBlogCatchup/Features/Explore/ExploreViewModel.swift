import Foundation

enum SortOption: String, CaseIterable {
    case newest = "-published_at"
    case oldest = "published_at"
    case titleAsc = "title"
    case titleDesc = "-title"

    var label: String {
        switch self {
        case .newest: return "Newest First"
        case .oldest: return "Oldest First"
        case .titleAsc: return "Title A-Z"
        case .titleDesc: return "Title Z-A"
        }
    }
}

@MainActor
@Observable
final class ExploreViewModel {
    private(set) var posts: [Post] = []
    private(set) var isLoading = false
    private(set) var isLoadingMore = false
    private(set) var error: String?
    private(set) var total = 0
    private(set) var hasMore = true
    private var offset = 0

    var searchText = "" {
        didSet {
            searchTask?.cancel()
            searchTask = Task {
                try await Task.sleep(nanoseconds: UInt64(AppConfig.searchDebounceMs) * 1_000_000)
                await fetchPosts()
            }
        }
    }

    var selectedSources: Set<String> = [] {
        didSet { Task { await fetchPosts() } }
    }

    var selectedTags: Set<String> = [] {
        didSet { Task { await fetchPosts() } }
    }

    var sortOption: SortOption = .newest {
        didSet { Task { await fetchPosts() } }
    }

    private var searchTask: Task<Void, any Error>?
    private let pageSize = AppConfig.explorePageSize

    var currentPage: Int {
        (offset / pageSize) + 1
    }

    var totalPages: Int {
        max(1, Int(ceil(Double(total) / Double(pageSize))))
    }

    var activeFilterCount: Int {
        selectedSources.count + selectedTags.count
    }

    // Backend accepts comma-separated values for source/tag filters
    private var sourceParam: String? {
        selectedSources.isEmpty ? nil : selectedSources.sorted().joined(separator: ",")
    }

    private var tagParam: String? {
        selectedTags.isEmpty ? nil : selectedTags.sorted().joined(separator: ",")
    }

    func fetchPosts() async {
        guard !isLoading else { return }
        isLoading = true
        error = nil
        offset = 0

        do {
            let result = try await APIClient.shared.fetchPosts(
                source: sourceParam,
                tag: tagParam,
                search: searchText.isEmpty ? nil : searchText,
                offset: 0,
                limit: pageSize,
                sort: sortOption.rawValue
            )
            posts = result.posts
            total = result.total
            hasMore = result.posts.count < result.total
            offset = result.posts.count
        } catch is CancellationError {
            // Debounced search was cancelled
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func loadMore() async {
        guard !isLoadingMore, hasMore else { return }
        isLoadingMore = true

        do {
            let result = try await APIClient.shared.fetchPosts(
                source: sourceParam,
                tag: tagParam,
                search: searchText.isEmpty ? nil : searchText,
                offset: offset,
                limit: pageSize,
                sort: sortOption.rawValue
            )
            posts = posts + result.posts
            total = result.total
            hasMore = offset + result.posts.count < result.total
            offset = offset + result.posts.count
        } catch {
            self.error = error.localizedDescription
        }

        isLoadingMore = false
    }

    func goToPage(_ page: Int) async {
        let newOffset = (page - 1) * pageSize
        guard newOffset >= 0, newOffset < total || page == 1 else { return }
        isLoading = true
        error = nil

        do {
            let result = try await APIClient.shared.fetchPosts(
                source: sourceParam,
                tag: tagParam,
                search: searchText.isEmpty ? nil : searchText,
                offset: newOffset,
                limit: pageSize,
                sort: sortOption.rawValue
            )
            posts = result.posts
            total = result.total
            offset = newOffset + result.posts.count
            hasMore = offset < result.total
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func refresh() async {
        offset = 0
        hasMore = true
        await fetchPosts()
    }
}
