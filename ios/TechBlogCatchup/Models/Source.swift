import Foundation

struct SourceInfo: Codable, Identifiable, Hashable {
    let key: String
    let name: String
    let postCount: Int

    var id: String { key }

    enum CodingKeys: String, CodingKey {
        case key, name
        case postCount = "post_count"
    }
}
