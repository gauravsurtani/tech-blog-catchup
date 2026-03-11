import Foundation

struct PaginatedPosts: Codable {
    let posts: [Post]
    let total: Int
    let offset: Int
    let limit: Int
}
