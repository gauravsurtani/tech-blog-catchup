import Foundation

@MainActor
@Observable
final class StatusViewModel {
    private(set) var status: StatusInfo?
    private(set) var crawlStatus: [CrawlStatusItem] = []
    private(set) var isLoading = false
    private(set) var isCrawling = false
    private(set) var isGenerating = false
    private(set) var error: String?

    var totalPosts: Int {
        status?.totalPosts ?? 0
    }

    var audioReady: Int {
        status?.audioCounts["ready"] ?? 0
    }

    var audioPending: Int {
        status?.audioCounts["pending"] ?? 0
    }

    var sourceCount: Int {
        status?.postsBySource.count ?? 0
    }

    func loadStatus() async {
        isLoading = true
        error = nil
        do {
            async let fetchedStatus = APIClient.shared.fetchStatus()
            async let fetchedCrawl = APIClient.shared.fetchCrawlStatus()
            status = try await fetchedStatus
            crawlStatus = try await fetchedCrawl
        } catch {
            self.error = error.localizedDescription
        }
        isLoading = false
    }

    func triggerCrawl(source: String? = nil) async {
        isCrawling = true
        do {
            _ = try await APIClient.shared.triggerCrawl(source: source)
        } catch {
            self.error = error.localizedDescription
        }
        isCrawling = false
    }

    func triggerGenerate() async {
        isGenerating = true
        do {
            _ = try await APIClient.shared.triggerGenerate()
            GenerationStatusService.shared.onGenerateTriggered()
        } catch {
            self.error = error.localizedDescription
        }
        isGenerating = false
    }

    func refresh() async {
        await loadStatus()
    }
}
