import Foundation

@MainActor
@Observable
final class GenerationStatusService {
    static let shared = GenerationStatusService()

    private(set) var isGenerating = false
    private(set) var currentJobId: Int?

    private var pollingTask: Task<Void, Never>?
    private var consecutiveIdleChecks = 0
    private let maxIdleBeforeStop = 12 // Stop after ~60s of no active jobs

    private init() {}

    func startPolling() {
        guard pollingTask == nil else { return }
        consecutiveIdleChecks = 0
        pollingTask = Task { [weak self] in
            while !Task.isCancelled {
                await self?.checkStatus()
                try? await Task.sleep(nanoseconds: UInt64(AppConfig.generationPollInterval * 1_000_000_000))
            }
        }
    }

    func stopPolling() {
        pollingTask?.cancel()
        pollingTask = nil
    }

    /// Call after triggering a generate action to ensure polling is active
    func onGenerateTriggered() {
        consecutiveIdleChecks = 0
        if pollingTask == nil {
            startPolling()
        }
    }

    private func checkStatus() async {
        do {
            let jobs = try await APIClient.shared.fetchJobs(
                jobType: "generate",
                status: "running",
                limit: 1
            )
            if let job = jobs.first {
                isGenerating = true
                currentJobId = job.id
                consecutiveIdleChecks = 0
            } else {
                isGenerating = false
                currentJobId = nil
                consecutiveIdleChecks += 1

                // Auto-stop polling after extended idle period
                if consecutiveIdleChecks >= maxIdleBeforeStop {
                    stopPolling()
                }
            }
        } catch {
            // Network errors during polling are non-fatal
        }
    }
}
