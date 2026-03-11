import XCTest
@testable import TechBlogCatchup

final class TechBlogCatchupTests: XCTestCase {

    func testPostDecoding() throws {
        let json = """
        {
            "id": 1,
            "url": "https://example.com/post",
            "source_key": "meta",
            "source_name": "Meta Engineering",
            "title": "Test Post",
            "summary": "A test summary",
            "author": "John Doe",
            "published_at": "2024-01-15T10:30:00",
            "tags": ["Infrastructure", "AI/ML"],
            "audio_status": "ready",
            "audio_path": "/audio/test.mp3",
            "audio_duration_secs": 300,
            "word_count": 1500
        }
        """.data(using: .utf8)!

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            if let date = formatter.date(from: dateString) { return date }
            formatter.formatOptions = [.withInternetDateTime]
            if let date = formatter.date(from: dateString) { return date }
            let basic = DateFormatter()
            basic.dateFormat = "yyyy-MM-dd'T'HH:mm:ss"
            basic.locale = Locale(identifier: "en_US_POSIX")
            if let date = basic.date(from: dateString) { return date }
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode date: \(dateString)")
        }
        let post = try decoder.decode(Post.self, from: json)

        XCTAssertEqual(post.id, 1)
        XCTAssertEqual(post.sourceKey, "meta")
        XCTAssertEqual(post.title, "Test Post")
        XCTAssertEqual(post.audioStatus, .ready)
        XCTAssertEqual(post.tags, ["Infrastructure", "AI/ML"])
    }
}
