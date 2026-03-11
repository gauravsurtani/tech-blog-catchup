import Foundation

@MainActor
@Observable
final class PostDetailViewModel {
    private(set) var post: PostDetail?
    private(set) var isLoading = false
    private(set) var error: String?
    private(set) var isGenerating = false
    private(set) var generateError: String?

    func loadPost(id: Int) async {
        guard !isLoading else { return }
        isLoading = true
        error = nil

        do {
            post = try await APIClient.shared.fetchPost(id: id)
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func generatePodcast() async {
        guard let post else { return }
        isGenerating = true
        generateError = nil

        do {
            _ = try await APIClient.shared.triggerGenerate(postId: post.id)
        } catch let error as APIError {
            switch error {
            case .conflict(let message):
                generateError = message
            default:
                generateError = error.errorDescription
            }
        } catch {
            generateError = error.localizedDescription
        }

        isGenerating = false
    }

    func clearGenerateError() {
        generateError = nil
    }

    func refresh(id: Int) async {
        do {
            post = try await APIClient.shared.fetchPost(id: id)
        } catch {
            // Keep existing post on refresh failure
        }
    }
}
