import SwiftUI

struct ExpandedPlayerView: View {
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss
    let viewModel: PlayerViewModel

    @State private var isSeeking = false
    @State private var seekProgress: Double = 0
    @State private var showQueue = false

    var body: some View {
        ZStack {
            theme.background.ignoresSafeArea()

            VStack(spacing: 0) {
                dragHandle
                closeBar
                Spacer(minLength: theme.spacingLg)
                artworkPlaceholder
                Spacer(minLength: theme.spacingLg)
                trackInfoSection
                Spacer(minLength: theme.spacingMd)
                seekSection
                Spacer(minLength: theme.spacingLg)
                transportControls
                Spacer(minLength: theme.spacingLg)
                volumeSection
                Spacer(minLength: theme.spacingMd)
                bottomControls
                Spacer(minLength: theme.spacingMd)
                queuePreview
                Spacer(minLength: theme.spacingSm)
            }
            .padding(.horizontal, theme.spacingLg)
        }
        .sheet(isPresented: $showQueue) {
            QueueSheetView(viewModel: viewModel)
        }
    }

    // MARK: - Drag Handle

    private var dragHandle: some View {
        RoundedRectangle(cornerRadius: theme.radiusFull)
            .fill(theme.textMuted)
            .frame(width: 36, height: 4)
            .padding(.top, theme.spacingSm)
    }

    // MARK: - Close Bar

    private var closeBar: some View {
        HStack {
            Spacer()
            Button(action: { dismiss() }) {
                Image(systemName: "chevron.down")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(theme.textSecondary)
                    .frame(width: 32, height: 32)
            }
            .buttonStyle(.plain)
        }
        .padding(.top, theme.spacingXs)
    }

    // MARK: - Artwork

    private var artworkPlaceholder: some View {
        RoundedRectangle(cornerRadius: theme.radiusLg)
            .fill(
                LinearGradient(
                    colors: [theme.primary.opacity(0.6), theme.accentBg],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .frame(maxWidth: 280, maxHeight: 280)
            .aspectRatio(1, contentMode: .fit)
            .overlay {
                VStack(spacing: theme.spacingSm) {
                    Image(systemName: "waveform")
                        .font(.system(size: 48))
                        .foregroundColor(theme.textPrimary.opacity(0.8))
                    if let track = viewModel.currentTrack {
                        Text(track.sourceName)
                            .font(theme.captionFont)
                            .foregroundColor(theme.textSecondary)
                    }
                }
            }
    }

    // MARK: - Track Info

    private var trackInfoSection: some View {
        VStack(spacing: theme.spacingXs) {
            if let track = viewModel.currentTrack {
                Text(track.title)
                    .font(theme.titleMediumFont)
                    .foregroundColor(theme.textPrimary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)

                Text(track.sourceName)
                    .font(theme.captionFont)
                    .foregroundColor(theme.textSecondary)
            }
        }
    }

    // MARK: - Seek

    private var seekSection: some View {
        VStack(spacing: theme.spacingXs) {
            Slider(
                value: Binding(
                    get: { isSeeking ? seekProgress : viewModel.progress },
                    set: { newValue in
                        isSeeking = true
                        seekProgress = newValue
                    }
                ),
                in: 0...1,
                onEditingChanged: { editing in
                    if !editing {
                        viewModel.seekToProgress(seekProgress)
                        isSeeking = false
                    }
                }
            )
            .tint(theme.primary)

            HStack {
                Text(viewModel.timeString)
                    .font(theme.captionSmallFont)
                    .foregroundColor(theme.textTertiary)

                Spacer()

                Text(viewModel.remainingString)
                    .font(theme.captionSmallFont)
                    .foregroundColor(theme.textTertiary)
            }
        }
    }

    // MARK: - Transport

    private var transportControls: some View {
        HStack(spacing: theme.spacingXl) {
            Button(action: viewModel.previous) {
                Image(systemName: "backward.fill")
                    .font(.system(size: 28))
                    .foregroundColor(theme.textPrimary)
            }
            .buttonStyle(.plain)

            Button(action: viewModel.skipBackward) {
                Image(systemName: "gobackward.10")
                    .font(.system(size: 22))
                    .foregroundColor(theme.textSecondary)
            }
            .buttonStyle(.plain)

            Button(action: {
                viewModel.togglePlayPause()
                HapticService.playPause()
            }) {
                Image(systemName: viewModel.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                    .font(.system(size: 56))
                    .foregroundColor(theme.textPrimary)
            }
            .buttonStyle(.plain)

            Button(action: viewModel.skipForward) {
                Image(systemName: "goforward.10")
                    .font(.system(size: 22))
                    .foregroundColor(theme.textSecondary)
            }
            .buttonStyle(.plain)

            Button(action: viewModel.next) {
                Image(systemName: "forward.fill")
                    .font(.system(size: 28))
                    .foregroundColor(viewModel.queue.isEmpty ? theme.textMuted : theme.textPrimary)
            }
            .buttonStyle(.plain)
            .disabled(viewModel.queue.isEmpty)
        }
    }

    // MARK: - Volume

    private var volumeSection: some View {
        HStack(spacing: theme.spacingSm) {
            Image(systemName: "speaker.fill")
                .font(.system(size: 12))
                .foregroundColor(theme.textTertiary)

            Slider(
                value: Binding(
                    get: { Double(viewModel.volume) },
                    set: { viewModel.volume = Float($0) }
                ),
                in: 0...1
            )
            .tint(theme.textSecondary)

            Image(systemName: "speaker.wave.3.fill")
                .font(.system(size: 12))
                .foregroundColor(theme.textTertiary)
        }
    }

    // MARK: - Bottom Controls

    private var bottomControls: some View {
        HStack {
            PlaybackSpeedPicker(viewModel: viewModel)

            Spacer()

            Button(action: { showQueue = true }) {
                HStack(spacing: theme.spacingXs) {
                    Image(systemName: "list.bullet")
                        .font(.system(size: 14))
                    if !viewModel.queue.isEmpty {
                        Text("\(viewModel.queue.count)")
                            .font(theme.captionSmallFont)
                    }
                }
                .foregroundColor(theme.textSecondary)
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: - Queue Preview

    private var queuePreview: some View {
        Group {
            if !viewModel.queue.isEmpty {
                VStack(alignment: .leading, spacing: theme.spacingSm) {
                    Text("Up Next")
                        .font(theme.captionFont)
                        .fontWeight(.semibold)
                        .foregroundColor(theme.textSecondary)

                    ForEach(Array(viewModel.queue.prefix(3).enumerated()), id: \.element.id) { _, post in
                        HStack(spacing: theme.spacingSm) {
                            RoundedRectangle(cornerRadius: theme.radiusSm)
                                .fill(theme.surfaceHover)
                                .frame(width: 32, height: 32)
                                .overlay {
                                    Image(systemName: "waveform")
                                        .font(.system(size: 12))
                                        .foregroundColor(theme.textTertiary)
                                }

                            VStack(alignment: .leading, spacing: 1) {
                                Text(post.title)
                                    .font(theme.captionSmallFont)
                                    .foregroundColor(theme.textPrimary)
                                    .lineLimit(1)

                                Text(post.sourceName)
                                    .font(.system(size: 10))
                                    .foregroundColor(theme.textTertiary)
                                    .lineLimit(1)
                            }

                            Spacer()
                        }
                    }
                }
                .padding(theme.spacingSm)
                .background(theme.surface)
                .clipShape(RoundedRectangle(cornerRadius: theme.radiusMd))
            }
        }
    }
}
