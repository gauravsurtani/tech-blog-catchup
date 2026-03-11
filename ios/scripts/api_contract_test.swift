// API Contract Test
// Compiles with actual iOS model files, fetches live backend, validates decoding.
//
// Usage (from ios/):
//   bash scripts/run_contract_test.sh
//
// Or manually:
//   swiftc -o /tmp/api_contract_test \
//     TechBlogCatchup/Config/AppConfig.swift \
//     TechBlogCatchup/Extensions/Date+Formatting.swift \
//     TechBlogCatchup/Models/Post.swift \
//     TechBlogCatchup/Models/Tag.swift \
//     TechBlogCatchup/Models/Source.swift \
//     TechBlogCatchup/Models/Job.swift \
//     TechBlogCatchup/Models/PaginatedPosts.swift \
//     TechBlogCatchup/Models/CrawlStatusItem.swift \
//     TechBlogCatchup/Models/StatusInfo.swift \
//     TechBlogCatchup/Services/APIError.swift \
//     scripts/api_contract_test.swift
//   /tmp/api_contract_test

import Foundation

// MARK: - Decoder (mirrors APIClient's date handling)

func makeDecoder() -> JSONDecoder {
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .custom { decoder in
        let container = try decoder.singleValueContainer()
        let dateString = try container.decode(String.self)

        let iso8601Fractional = ISO8601DateFormatter()
        iso8601Fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = iso8601Fractional.date(from: dateString) { return date }

        let iso8601 = ISO8601DateFormatter()
        iso8601.formatOptions = [.withInternetDateTime]
        if let date = iso8601.date(from: dateString) { return date }

        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
        if let date = formatter.date(from: dateString) { return date }

        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS"
        if let date = formatter.date(from: dateString) { return date }

        throw DecodingError.dataCorruptedError(
            in: container,
            debugDescription: "Cannot decode date: \(dateString)"
        )
    }
    return decoder
}

// MARK: - Test Runner

struct TestResult {
    let endpoint: String
    let typeName: String
    let passed: Bool
    let detail: String
}

func fetch(_ path: String) async throws -> Data {
    let url = URL(string: AppConfig.baseURL + path)!
    let (data, response) = try await URLSession.shared.data(from: url)
    guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
        let http = response as? HTTPURLResponse
        throw NSError(domain: "HTTP", code: http?.statusCode ?? 0,
                      userInfo: [NSLocalizedDescriptionKey: "HTTP \(http?.statusCode ?? 0)"])
    }
    return data
}

func testEndpoint<T: Decodable>(
    path: String,
    as type: T.Type,
    decoder: JSONDecoder,
    validate: ((T) -> String?)? = nil
) async -> TestResult {
    let typeName = String(describing: T.self)
    do {
        let data = try await fetch(path)
        let decoded = try decoder.decode(T.self, from: data)
        if let validate, let issue = validate(decoded) {
            return TestResult(endpoint: path, typeName: typeName, passed: false,
                              detail: "Validation: \(issue)")
        }
        return TestResult(endpoint: path, typeName: typeName, passed: true,
                          detail: "Decoded \(typeName) OK")
    } catch let error as DecodingError {
        let detail: String
        switch error {
        case .keyNotFound(let key, let ctx):
            detail = "Missing key '\(key.stringValue)' at \(ctx.codingPath.map(\.stringValue).joined(separator: "."))"
        case .typeMismatch(let type, let ctx):
            detail = "Type mismatch: expected \(type) at \(ctx.codingPath.map(\.stringValue).joined(separator: "."))"
        case .valueNotFound(let type, let ctx):
            detail = "Null value for \(type) at \(ctx.codingPath.map(\.stringValue).joined(separator: "."))"
        case .dataCorrupted(let ctx):
            detail = "Data corrupted at \(ctx.codingPath.map(\.stringValue).joined(separator: ".")): \(ctx.debugDescription)"
        @unknown default:
            detail = "Decoding error: \(error)"
        }
        return TestResult(endpoint: path, typeName: typeName, passed: false, detail: detail)
    } catch {
        return TestResult(endpoint: path, typeName: typeName, passed: false,
                          detail: "Error: \(error.localizedDescription)")
    }
}

// MARK: - Main

@main
struct ContractTest {
    static func main() async {
        let decoder = makeDecoder()
        var results: [TestResult] = []

        print()
        print("==========================================")
        print("  iOS API Contract Test")
        print("  Backend: \(AppConfig.baseURL)")
        print("==========================================")
        print()

        // 1. Posts (paginated)
        let r1 = await testEndpoint(
            path: "/api/posts?limit=2",
            as: PaginatedPosts.self,
            decoder: decoder
        ) { paginated in
            if paginated.limit != 2 { return "limit should be 2, got \(paginated.limit)" }
            return nil
        }
        results.append(r1)

        // 2. Tags
        let r2 = await testEndpoint(
            path: "/api/tags",
            as: [TagInfo].self,
            decoder: decoder
        )
        results.append(r2)

        // 3. Sources
        let r3 = await testEndpoint(
            path: "/api/sources",
            as: [SourceInfo].self,
            decoder: decoder
        )
        results.append(r3)

        // 4. Status
        let r4 = await testEndpoint(
            path: "/api/status",
            as: StatusInfo.self,
            decoder: decoder
        )
        results.append(r4)

        // 5. Crawl Status
        let r5 = await testEndpoint(
            path: "/api/crawl-status",
            as: [CrawlStatusItem].self,
            decoder: decoder
        )
        results.append(r5)

        // 6. Jobs
        let r6 = await testEndpoint(
            path: "/api/jobs?limit=5",
            as: [JobInfo].self,
            decoder: decoder
        )
        results.append(r6)

        // 7. Playlist
        let r7 = await testEndpoint(
            path: "/api/playlist?limit=2",
            as: PaginatedPosts.self,
            decoder: decoder
        )
        results.append(r7)

        // 8. Health (decode as raw dict to verify structure)
        let r8 = await testEndpoint(
            path: "/api/health",
            as: [String: AnyCodable].self,
            decoder: decoder
        ) { health in
            if health["status"] == nil { return "Missing 'status' key" }
            return nil
        }
        results.append(r8)

        // Print results
        print("Results:")
        print(String(repeating: "-", count: 60))

        let passed = results.filter(\.passed).count
        let failed = results.filter { !$0.passed }.count

        for r in results {
            let icon = r.passed ? "PASS" : "FAIL"
            let color = r.passed ? "\u{001B}[32m" : "\u{001B}[31m"
            print("\(color)  \(icon)\u{001B}[0m  \(r.endpoint)")
            print("        -> \(r.typeName): \(r.detail)")
        }

        print()
        print(String(repeating: "-", count: 60))
        print("\u{001B}[32m  Passed: \(passed)\u{001B}[0m")
        if failed > 0 {
            print("\u{001B}[31m  Failed: \(failed)\u{001B}[0m")
        }
        print()

        if failed > 0 {
            Darwin.exit(1)
        }
    }
}

// MARK: - AnyCodable (for health endpoint raw JSON)

struct AnyCodable: Codable {
    let value: Any

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let str = try? container.decode(String.self) {
            value = str
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            value = dict
        } else if let arr = try? container.decode([AnyCodable].self) {
            value = arr
        } else if container.decodeNil() {
            value = NSNull()
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported type")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case let str as String: try container.encode(str)
        case let int as Int: try container.encode(int)
        case let double as Double: try container.encode(double)
        case let bool as Bool: try container.encode(bool)
        case let dict as [String: AnyCodable]: try container.encode(dict)
        case let arr as [AnyCodable]: try container.encode(arr)
        case is NSNull: try container.encodeNil()
        default: break
        }
    }
}
