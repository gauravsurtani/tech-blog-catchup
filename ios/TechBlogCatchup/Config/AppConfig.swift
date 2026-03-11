import Foundation

enum AppConfig {
    #if DEBUG
    static let baseURL = "http://localhost:8000"
    #else
    static let baseURL = "https://techblog-api.up.railway.app"
    #endif
    static let requestTimeout: TimeInterval = 10
    static let maxRetries = 3
    static let initialBackoffMs = 500

    static let homePageSize = 12
    static let explorePageSize = 20
    static let playlistPageSize = 200

    static let searchDebounceMs = 300
    static let generationPollInterval: TimeInterval = 5
    static let statusPollInterval: TimeInterval = 10

    static let playbackSpeeds: [Float] = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0]
    static let seekStepSeconds: TimeInterval = 10
    static let restartThresholdSeconds: TimeInterval = 3
}
