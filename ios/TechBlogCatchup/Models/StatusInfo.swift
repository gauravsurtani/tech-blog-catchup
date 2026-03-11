import Foundation

struct StatusInfo: Codable {
    let totalPosts: Int
    let postsBySource: [SourceInfo]
    let audioCounts: [String: Int]
    let tagCounts: [TagInfo]

    enum CodingKeys: String, CodingKey {
        case totalPosts = "total_posts"
        case postsBySource = "posts_by_source"
        case audioCounts = "audio_counts"
        case tagCounts = "tag_counts"
    }
}
