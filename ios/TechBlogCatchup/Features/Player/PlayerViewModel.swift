import Foundation

@Observable
final class PlayerViewModel {
    var isExpanded = false

    private let audioService = AudioPlayerService.shared

    // MARK: - Track State

    var currentTrack: Post? { audioService.currentTrack }
    var isPlaying: Bool { audioService.isPlaying }
    var currentTime: TimeInterval { audioService.currentTime }
    var duration: TimeInterval { audioService.duration }
    var queue: [Post] { audioService.queue }
    var history: [Post] { audioService.history }

    var volume: Float {
        get { audioService.volume }
        set { audioService.volume = newValue }
    }

    var playbackRate: Float {
        get { audioService.playbackRate }
        set { audioService.playbackRate = newValue }
    }

    var hasTrack: Bool { currentTrack != nil }

    // MARK: - Computed

    var progress: Double {
        guard duration > 0 else { return 0 }
        return currentTime / duration
    }

    var timeString: String {
        formatTime(currentTime)
    }

    var durationString: String {
        formatTime(duration)
    }

    var remainingString: String {
        let remaining = max(duration - currentTime, 0)
        return "-\(formatTime(remaining))"
    }

    // MARK: - Actions

    func play(post: Post) {
        audioService.play(post: post)
    }

    func togglePlayPause() {
        audioService.togglePlayPause()
    }

    func next() {
        audioService.next()
    }

    func previous() {
        audioService.previous()
    }

    func seek(to time: TimeInterval) {
        audioService.seek(to: time)
    }

    func seekToProgress(_ progress: Double) {
        let time = progress * duration
        audioService.seek(to: time)
    }

    func skipForward() {
        audioService.skipForward()
    }

    func skipBackward() {
        audioService.skipBackward()
    }

    func addToQueue(post: Post) {
        audioService.addToQueue(post: post)
    }

    func removeFromQueue(at index: Int) {
        audioService.removeFromQueue(at: index)
    }

    func moveInQueue(from source: IndexSet, to destination: Int) {
        audioService.moveInQueue(from: source, to: destination)
    }

    func clearQueue() {
        audioService.clearQueue()
    }

    func playAll(posts: [Post]) {
        audioService.playAll(posts: posts)
    }

    // MARK: - Formatting

    private func formatTime(_ time: TimeInterval) -> String {
        guard time.isFinite, time >= 0 else { return "0:00" }
        let totalSeconds = Int(time)
        let minutes = totalSeconds / 60
        let seconds = totalSeconds % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}
