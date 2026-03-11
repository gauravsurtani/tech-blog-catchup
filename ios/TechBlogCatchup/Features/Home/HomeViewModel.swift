import Foundation

@MainActor
@Observable
final class HomeViewModel {
    private(set) var posts: [Post] = []
    private(set) var isLoading = false
    private(set) var isLoadingMore = false
    private(set) var error: String?
    private(set) var pendingCount = 0
    private(set) var hasMore = true
    private var offset = 0

    private let pageSize = AppConfig.homePageSize

    func loadPosts() async {
        guard !isLoading else { return }
        isLoading = true
        error = nil
        offset = 0

        do {
            let result = try await APIClient.shared.fetchPosts(
                audioStatus: "ready",
                offset: 0,
                limit: pageSize,
                sort: "-published_at"
            )
            posts = result.posts
            hasMore = result.posts.count < result.total
            offset = result.posts.count

            // Count posts without audio (pending + failed + processing)
            let pendingResult = try await APIClient.shared.fetchPosts(
                audioStatus: "pending",
                offset: 0,
                limit: 1
            )
            let failedResult = try await APIClient.shared.fetchPosts(
                audioStatus: "failed",
                offset: 0,
                limit: 1
            )
            pendingCount = pendingResult.total + failedResult.total
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
                audioStatus: "ready",
                offset: offset,
                limit: pageSize,
                sort: "-published_at"
            )
            posts = posts + result.posts
            hasMore = offset + result.posts.count < result.total
            offset = offset + result.posts.count
        } catch {
            self.error = error.localizedDescription
        }

        isLoadingMore = false
    }

    func refresh() async {
        offset = 0
        hasMore = true
        await loadPosts()
    }
}
