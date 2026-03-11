import Foundation

struct JobInfo: Codable, Identifiable, Hashable {
    let id: Int
    let jobType: String
    let status: String
    let params: String?
    let result: String?
    let errorMessage: String?
    let createdAt: Date
    let startedAt: Date?
    let completedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, status, params, result
        case jobType = "job_type"
        case errorMessage = "error_message"
        case createdAt = "created_at"
        case startedAt = "started_at"
        case completedAt = "completed_at"
    }
}
