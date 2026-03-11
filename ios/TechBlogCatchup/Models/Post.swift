import Foundation

struct Post: Codable, Identifiable, Hashable {
    let id: Int
    let url: String
    let sourceKey: String
    let sourceName: String
    let title: String
    let summary: String?
    let author: String?
    let publishedAt: Date?
    let tags: [String]
    let audioStatus: AudioStatus
    let audioPath: String?
    let audioDurationSecs: Int?
    let wordCount: Int?

    enum AudioStatus: String, Codable {
        case pending
        case processing
        case ready
        case failed
    }

    enum CodingKeys: String, CodingKey {
        case id, url, title, summary, author, tags
        case sourceKey = "source_key"
        case sourceName = "source_name"
        case publishedAt = "published_at"
        case audioStatus = "audio_status"
        case audioPath = "audio_path"
        case audioDurationSecs = "audio_duration_secs"
        case wordCount = "word_count"
    }

    var audioURL: URL? {
        guard let path = audioPath else { return nil }
        return URL(string: AppConfig.baseURL + "/" + path)
    }

    var formattedDuration: String {
        guard let secs = audioDurationSecs else { return "" }
        let minutes = secs / 60
        let seconds = secs % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}

struct PostDetail: Codable, Identifiable, Hashable {
    let id: Int
    let url: String
    let sourceKey: String
    let sourceName: String
    let title: String
    let summary: String?
    let author: String?
    let publishedAt: Date?
    let tags: [String]
    let audioStatus: Post.AudioStatus
    let audioPath: String?
    let audioDurationSecs: Int?
    let wordCount: Int?
    let fullText: String?
    let crawledAt: Date
    let contentQuality: String?
    let qualityScore: Int?
    let extractionMethod: String?

    enum CodingKeys: String, CodingKey {
        case id, url, title, summary, author, tags
        case sourceKey = "source_key"
        case sourceName = "source_name"
        case publishedAt = "published_at"
        case audioStatus = "audio_status"
        case audioPath = "audio_path"
        case audioDurationSecs = "audio_duration_secs"
        case wordCount = "word_count"
        case fullText = "full_text"
        case crawledAt = "crawled_at"
        case contentQuality = "content_quality"
        case qualityScore = "quality_score"
        case extractionMethod = "extraction_method"
    }

    var audioURL: URL? {
        guard let path = audioPath else { return nil }
        return URL(string: AppConfig.baseURL + "/" + path)
    }

    var formattedDuration: String {
        guard let secs = audioDurationSecs else { return "" }
        let minutes = secs / 60
        let seconds = secs % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    var asPost: Post {
        Post(
            id: id,
            url: url,
            sourceKey: sourceKey,
            sourceName: sourceName,
            title: title,
            summary: summary,
            author: author,
            publishedAt: publishedAt,
            tags: tags,
            audioStatus: audioStatus,
            audioPath: audioPath,
            audioDurationSecs: audioDurationSecs,
            wordCount: wordCount
        )
    }
}
