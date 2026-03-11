import Foundation

struct CrawlResponse: Codable {
    let status: String
    let jobId: Int
    let source: String?

    enum CodingKeys: String, CodingKey {
        case status, source
        case jobId = "job_id"
    }
}

struct GenerateResponse: Codable {
    let status: String
    let jobId: Int
    let postId: Int?
    let limit: Int?

    enum CodingKeys: String, CodingKey {
        case status, limit
        case jobId = "job_id"
        case postId = "post_id"
    }
}

private struct ServerErrorBody: Codable {
    let detail: String?
}

@Observable
final class APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let decoder: JSONDecoder

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = AppConfig.requestTimeout
        self.session = URLSession(configuration: config)

        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)

            // Try ISO8601 with fractional seconds (microseconds from Python)
            let iso8601Fractional = ISO8601DateFormatter()
            iso8601Fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = iso8601Fractional.date(from: dateString) {
                return date
            }

            // Try ISO8601 without fractional seconds
            let iso8601 = ISO8601DateFormatter()
            iso8601.formatOptions = [.withInternetDateTime]
            if let date = iso8601.date(from: dateString) {
                return date
            }

            // Try "yyyy-MM-dd'T'HH:mm:ss" (no timezone)
            let formatter = DateFormatter()
            formatter.locale = Locale(identifier: "en_US_POSIX")
            formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
            if let date = formatter.date(from: dateString) {
                return date
            }

            // Try "yyyy-MM-dd'T'HH:mm:ss.SSSSSS" (microseconds, no timezone)
            formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS"
            if let date = formatter.date(from: dateString) {
                return date
            }

            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Cannot decode date: \(dateString)"
            )
        }
    }

    // MARK: - Core Request

    private func request<T: Decodable>(
        _ endpoint: String,
        method: String = "GET",
        body: (any Encodable)? = nil,
        queryItems: [URLQueryItem]? = nil
    ) async throws -> T {
        var attempt = 0
        var lastError: Error = APIError.unknown

        while attempt < AppConfig.maxRetries {
            do {
                return try await performRequest(endpoint, method: method, body: body, queryItems: queryItems)
            } catch let error as APIError {
                switch error {
                case .notFound, .conflict:
                    throw error
                default:
                    lastError = error
                }
            } catch {
                lastError = error
            }

            attempt += 1
            if attempt < AppConfig.maxRetries {
                let backoffMs = AppConfig.initialBackoffMs * (1 << (attempt - 1))
                try await Task.sleep(nanoseconds: UInt64(backoffMs) * 1_000_000)
            }
        }

        throw lastError
    }

    private func performRequest<T: Decodable>(
        _ endpoint: String,
        method: String,
        body: (any Encodable)? = nil,
        queryItems: [URLQueryItem]?
    ) async throws -> T {
        guard var components = URLComponents(string: AppConfig.baseURL + endpoint) else {
            throw APIError.unknown
        }

        if let queryItems, !queryItems.isEmpty {
            components.queryItems = queryItems
        }

        guard let url = components.url else {
            throw APIError.unknown
        }

        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = method
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let body {
            let encoder = JSONEncoder()
            urlRequest.httpBody = try encoder.encode(AnyEncodable(body))
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: urlRequest)
        } catch {
            throw APIError.networkError(error)
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown
        }

        switch httpResponse.statusCode {
        case 200..<300:
            do {
                return try decoder.decode(T.self, from: data)
            } catch {
                throw APIError.decodingError(error)
            }
        case 404:
            throw APIError.notFound
        case 409:
            let body = try? decoder.decode(ServerErrorBody.self, from: data)
            throw APIError.conflict(body?.detail ?? "Conflict")
        default:
            let body = try? decoder.decode(ServerErrorBody.self, from: data)
            throw APIError.serverError(
                statusCode: httpResponse.statusCode,
                message: body?.detail ?? "Unknown server error"
            )
        }
    }

    // MARK: - Posts

    func fetchPosts(
        source: String? = nil,
        tag: String? = nil,
        search: String? = nil,
        audioStatus: String? = nil,
        qualityMin: Int? = nil,
        offset: Int = 0,
        limit: Int = 20,
        sort: String = "-published_at"
    ) async throws -> PaginatedPosts {
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "offset", value: "\(offset)"),
            URLQueryItem(name: "limit", value: "\(limit)"),
            URLQueryItem(name: "sort", value: sort),
        ]
        if let source { queryItems.append(URLQueryItem(name: "source", value: source)) }
        if let tag { queryItems.append(URLQueryItem(name: "tag", value: tag)) }
        if let search { queryItems.append(URLQueryItem(name: "search", value: search)) }
        if let audioStatus { queryItems.append(URLQueryItem(name: "audio_status", value: audioStatus)) }
        if let qualityMin { queryItems.append(URLQueryItem(name: "quality_min", value: "\(qualityMin)")) }

        return try await request("/api/posts", queryItems: queryItems)
    }

    func fetchPost(id: Int) async throws -> PostDetail {
        return try await request("/api/posts/\(id)")
    }

    func fetchPlaylist(
        source: String? = nil,
        tag: String? = nil,
        search: String? = nil,
        offset: Int = 0,
        limit: Int = 50,
        sort: String = "-published_at"
    ) async throws -> PaginatedPosts {
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "offset", value: "\(offset)"),
            URLQueryItem(name: "limit", value: "\(limit)"),
            URLQueryItem(name: "sort", value: sort),
        ]
        if let source { queryItems.append(URLQueryItem(name: "source", value: source)) }
        if let tag { queryItems.append(URLQueryItem(name: "tag", value: tag)) }
        if let search { queryItems.append(URLQueryItem(name: "search", value: search)) }

        return try await request("/api/playlist", queryItems: queryItems)
    }

    // MARK: - Tags & Sources

    func fetchTags() async throws -> [TagInfo] {
        return try await request("/api/tags")
    }

    func fetchSources() async throws -> [SourceInfo] {
        return try await request("/api/sources")
    }

    // MARK: - Status & Crawl

    func fetchStatus() async throws -> StatusInfo {
        return try await request("/api/status")
    }

    func fetchCrawlStatus() async throws -> [CrawlStatusItem] {
        return try await request("/api/crawl-status")
    }

    // MARK: - Jobs

    func fetchJobs(
        jobType: String? = nil,
        status: String? = nil,
        limit: Int = 50
    ) async throws -> [JobInfo] {
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "limit", value: "\(limit)"),
        ]
        if let jobType { queryItems.append(URLQueryItem(name: "job_type", value: jobType)) }
        if let status { queryItems.append(URLQueryItem(name: "status", value: status)) }

        return try await request("/api/jobs", queryItems: queryItems)
    }

    func fetchJob(id: Int) async throws -> JobInfo {
        return try await request("/api/jobs/\(id)")
    }

    // MARK: - Actions

    func triggerCrawl(source: String? = nil) async throws -> CrawlResponse {
        struct CrawlBody: Encodable {
            let source: String?
        }
        return try await request("/api/crawl", method: "POST", body: CrawlBody(source: source))
    }

    func triggerGenerate(postId: Int? = nil, limit: Int = 10) async throws -> GenerateResponse {
        struct GenerateBody: Encodable {
            let postId: Int?
            let limit: Int

            enum CodingKeys: String, CodingKey {
                case postId = "post_id"
                case limit
            }
        }
        return try await request("/api/generate", method: "POST", body: GenerateBody(postId: postId, limit: limit))
    }
}

// MARK: - Type Erasure Helper

private struct AnyEncodable: Encodable {
    private let _encode: (Encoder) throws -> Void

    init(_ wrapped: any Encodable) {
        self._encode = wrapped.encode
    }

    func encode(to encoder: Encoder) throws {
        try _encode(encoder)
    }
}
