import Foundation

struct CrawlStatusItem: Codable, Identifiable, Hashable {
    let sourceKey: String
    let sourceName: String
    let enabled: Bool
    let feedUrl: String
    let blogUrl: String?
    let status: String
    let postCount: Int
    let totalDiscoverable: Int?
    let lastCrawlAt: Date?
    let lastCrawlType: String?
    let postsAddedLast: Int?
    let urlsFoundLast: Int?
    let errorMessage: String?

    var id: String { sourceKey }

    enum CodingKeys: String, CodingKey {
        case enabled, status
        case sourceKey = "source_key"
        case sourceName = "source_name"
        case feedUrl = "feed_url"
        case blogUrl = "blog_url"
        case postCount = "post_count"
        case totalDiscoverable = "total_discoverable"
        case lastCrawlAt = "last_crawl_at"
        case lastCrawlType = "last_crawl_type"
        case postsAddedLast = "posts_added_last"
        case urlsFoundLast = "urls_found_last"
        case errorMessage = "error_message"
    }
}
