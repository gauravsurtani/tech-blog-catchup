import Foundation

struct TagInfo: Codable, Identifiable, Hashable {
    let name: String
    let slug: String
    let postCount: Int

    var id: String { slug }

    enum CodingKeys: String, CodingKey {
        case name, slug
        case postCount = "post_count"
    }
}
