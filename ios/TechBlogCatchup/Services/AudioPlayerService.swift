import Foundation
import AVFoundation
import MediaPlayer

@Observable
final class AudioPlayerService {
    static let shared = AudioPlayerService()

    // MARK: - Public State

    private(set) var currentTrack: Post?
    private(set) var queue: [Post] = []
    private(set) var history: [Post] = []
    private(set) var isPlaying = false
    private(set) var currentTime: TimeInterval = 0
    private(set) var duration: TimeInterval = 0

    var volume: Float = 1.0 {
        didSet {
            player?.volume = volume
            saveState()
        }
    }

    var playbackRate: Float = 1.0 {
        didSet {
            if isPlaying {
                player?.rate = playbackRate
            }
            updateNowPlaying()
            saveState()
        }
    }

    // MARK: - Private

    private var player: AVPlayer?
    private var timeObserver: Any?
    private var itemEndObserver: Any?
    private var statusObservation: NSKeyValueObservation?

    // MARK: - Keys

    private enum StorageKey {
        static let queue = "audioPlayer.queue"
        static let volume = "audioPlayer.volume"
        static let playbackRate = "audioPlayer.playbackRate"
    }

    // MARK: - Init

    private init() {
        setupAudioSession()
        setupRemoteCommands()
        loadState()
    }

    // MARK: - Playback Controls

    func play(post: Post) {
        guard let url = post.audioURL else { return }

        if let current = currentTrack {
            history.insert(current, at: 0)
        }

        currentTrack = post
        isPlaying = false
        currentTime = 0
        duration = 0

        removeTimeObserver()
        removeItemEndObserver()
        removeStatusObservation()

        let item = AVPlayerItem(url: url)

        if let existing = player {
            existing.replaceCurrentItem(with: item)
        } else {
            player = AVPlayer(playerItem: item)
            player?.volume = volume
        }

        observeItemStatus(item)
        addTimeObserver()
        addItemEndObserver()
        saveState()
    }

    func pause() {
        player?.pause()
        isPlaying = false
        updateNowPlaying()
    }

    func resume() {
        player?.rate = playbackRate
        isPlaying = true
        updateNowPlaying()
    }

    func togglePlayPause() {
        if isPlaying {
            pause()
        } else {
            resume()
        }
    }

    func stop() {
        pause()
        removeTimeObserver()
        removeItemEndObserver()
        removeStatusObservation()
        player?.replaceCurrentItem(with: nil)
        currentTrack = nil
        currentTime = 0
        duration = 0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    }

    func next() {
        guard !queue.isEmpty else {
            stop()
            return
        }
        let nextPost = queue.removeFirst()
        play(post: nextPost)
    }

    func previous() {
        if currentTime > AppConfig.restartThresholdSeconds {
            seek(to: 0)
            return
        }
        guard !history.isEmpty else {
            seek(to: 0)
            return
        }
        if let current = currentTrack {
            queue.insert(current, at: 0)
        }
        let previousPost = history.removeFirst()
        play(post: previousPost)
    }

    func seek(to time: TimeInterval) {
        let cmTime = CMTime(seconds: time, preferredTimescale: 600)
        player?.seek(to: cmTime, toleranceBefore: .zero, toleranceAfter: .zero)
        currentTime = time
        updateNowPlaying()
    }

    func skipForward() {
        let target = min(currentTime + AppConfig.seekStepSeconds, duration)
        seek(to: target)
    }

    func skipBackward() {
        let target = max(currentTime - AppConfig.seekStepSeconds, 0)
        seek(to: target)
    }

    // MARK: - Queue Management

    func addToQueue(post: Post) {
        queue.append(post)
        saveState()
    }

    func removeFromQueue(at index: Int) {
        guard queue.indices.contains(index) else { return }
        queue.remove(at: index)
        saveState()
    }

    func moveInQueue(from source: IndexSet, to destination: Int) {
        queue.move(fromOffsets: source, toOffset: destination)
        saveState()
    }

    func clearQueue() {
        queue.removeAll()
        saveState()
    }

    func playAll(posts: [Post]) {
        guard let first = posts.first else { return }
        queue = Array(posts.dropFirst())
        play(post: first)
    }

    // MARK: - Audio Session

    private func setupAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .spokenAudio)
            try session.setActive(true)
        } catch {
            // Audio session setup failed; playback may not work in background
        }
    }

    // MARK: - Remote Commands

    private func setupRemoteCommands() {
        let center = MPRemoteCommandCenter.shared()

        center.playCommand.addTarget { [weak self] _ in
            self?.resume()
            return .success
        }

        center.pauseCommand.addTarget { [weak self] _ in
            self?.pause()
            return .success
        }

        center.togglePlayPauseCommand.addTarget { [weak self] _ in
            self?.togglePlayPause()
            return .success
        }

        center.nextTrackCommand.addTarget { [weak self] _ in
            self?.next()
            return .success
        }

        center.previousTrackCommand.addTarget { [weak self] _ in
            self?.previous()
            return .success
        }

        center.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let positionEvent = event as? MPChangePlaybackPositionCommandEvent else {
                return .commandFailed
            }
            self?.seek(to: positionEvent.positionTime)
            return .success
        }

        center.skipForwardCommand.preferredIntervals = [NSNumber(value: AppConfig.seekStepSeconds)]
        center.skipForwardCommand.addTarget { [weak self] _ in
            self?.skipForward()
            return .success
        }

        center.skipBackwardCommand.preferredIntervals = [NSNumber(value: AppConfig.seekStepSeconds)]
        center.skipBackwardCommand.addTarget { [weak self] _ in
            self?.skipBackward()
            return .success
        }
    }

    // MARK: - Now Playing

    private func updateNowPlaying() {
        guard let track = currentTrack else {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
            return
        }

        var info: [String: Any] = [
            MPMediaItemPropertyTitle: track.title,
            MPMediaItemPropertyArtist: track.sourceName,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: currentTime,
            MPMediaItemPropertyPlaybackDuration: duration,
            MPNowPlayingInfoPropertyPlaybackRate: isPlaying ? playbackRate : 0.0,
            MPNowPlayingInfoPropertyDefaultPlaybackRate: 1.0
        ]

        if let durationSecs = track.audioDurationSecs {
            info[MPMediaItemPropertyPlaybackDuration] = Double(durationSecs)
        }

        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }

    // MARK: - Observers

    private func observeItemStatus(_ item: AVPlayerItem) {
        removeStatusObservation()
        statusObservation = item.observe(\.status, options: [.new]) { [weak self] item, _ in
            Task { @MainActor in
                guard let self else { return }
                switch item.status {
                case .readyToPlay:
                    let durationSeconds = CMTimeGetSeconds(item.duration)
                    if durationSeconds.isFinite {
                        self.duration = durationSeconds
                    }
                    self.player?.rate = self.playbackRate
                    self.isPlaying = true
                    self.updateNowPlaying()
                case .failed:
                    self.isPlaying = false
                default:
                    break
                }
            }
        }
    }

    private func addTimeObserver() {
        guard let player else { return }
        let interval = CMTime(seconds: 0.5, preferredTimescale: 600)
        timeObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            guard let self else { return }
            let seconds = CMTimeGetSeconds(time)
            if seconds.isFinite {
                self.currentTime = seconds
            }
            self.updateNowPlaying()
        }
    }

    private func removeTimeObserver() {
        if let observer = timeObserver, let player {
            player.removeTimeObserver(observer)
            timeObserver = nil
        }
    }

    private func addItemEndObserver() {
        removeItemEndObserver()
        itemEndObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            self?.next()
        }
    }

    private func removeItemEndObserver() {
        if let observer = itemEndObserver {
            NotificationCenter.default.removeObserver(observer)
            itemEndObserver = nil
        }
    }

    private func removeStatusObservation() {
        statusObservation?.invalidate()
        statusObservation = nil
    }

    // MARK: - Persistence

    private func saveState() {
        let defaults = UserDefaults.standard
        if let data = try? JSONEncoder().encode(queue) {
            defaults.set(data, forKey: StorageKey.queue)
        }
        defaults.set(volume, forKey: StorageKey.volume)
        defaults.set(playbackRate, forKey: StorageKey.playbackRate)
    }

    private func loadState() {
        let defaults = UserDefaults.standard
        if let data = defaults.data(forKey: StorageKey.queue),
           let savedQueue = try? JSONDecoder().decode([Post].self, from: data) {
            queue = savedQueue
        }
        if defaults.object(forKey: StorageKey.volume) != nil {
            volume = defaults.float(forKey: StorageKey.volume)
        }
        if defaults.object(forKey: StorageKey.playbackRate) != nil {
            playbackRate = defaults.float(forKey: StorageKey.playbackRate)
        }
    }
}
