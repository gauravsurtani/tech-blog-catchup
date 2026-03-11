import Foundation

enum APIError: LocalizedError {
    case networkError(Error)
    case decodingError(Error)
    case serverError(statusCode: Int, message: String)
    case notFound
    case conflict(String)
    case unknown

    var errorDescription: String? {
        switch self {
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .decodingError(let error):
            return "Failed to parse response: \(error.localizedDescription)"
        case .serverError(let statusCode, let message):
            return "Server error (\(statusCode)): \(message)"
        case .notFound:
            return "Resource not found"
        case .conflict(let message):
            return message
        case .unknown:
            return "An unknown error occurred"
        }
    }
}
