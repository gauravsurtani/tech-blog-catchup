import SwiftUI

struct QueueSheetView: View {
    @Environment(\.theme) private var theme
    @Environment(\.dismiss) private var dismiss
    let viewModel: PlayerViewModel

    var body: some View {
        NavigationStack {
            ZStack {
                theme.background.ignoresSafeArea()

                if viewModel.queue.isEmpty {
                    emptyState
                } else {
                    queueList
                }
            }
            .navigationTitle("Queue")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if !viewModel.queue.isEmpty {
                        Button("Clear All") {
                            viewModel.clearQueue()
                        }
                        .font(theme.captionFont)
                        .foregroundColor(theme.error)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                    .font(theme.captionFont)
                    .foregroundColor(theme.primary)
                }
            }
            .toolbarBackground(theme.surface, for: .navigationBar)
            .toolbarBackground(.visible, for: .navigationBar)
        }
    }

    // MARK: - Now Playing

    private var nowPlayingSection: some View {
        Group {
            if let track = viewModel.currentTrack {
                Section {
                    HStack(spacing: theme.spacingSm) {
                        Image(systemName: "waveform")
                            .font(.system(size: 16))
                            .foregroundColor(theme.primary)
                            .frame(width: 24)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(track.title)
                                .font(theme.captionFont)
                                .fontWeight(.medium)
                                .foregroundColor(theme.textPrimary)
                                .lineLimit(1)

                            Text(track.sourceName)
                                .font(theme.captionSmallFont)
                                .foregroundColor(theme.textSecondary)
                                .lineLimit(1)
                        }

                        Spacer()

                        if viewModel.isPlaying {
                            Image(systemName: "speaker.wave.2.fill")
                                .font(.system(size: 12))
                                .foregroundColor(theme.primary)
                        }
                    }
                    .padding(.vertical, theme.spacingXs)
                    .listRowBackground(theme.surface)
                } header: {
                    Text("Now Playing")
                        .font(theme.captionSmallFont)
                        .foregroundColor(theme.textTertiary)
                }
            }
        }
    }

    // MARK: - Queue List

    private var queueList: some View {
        List {
            nowPlayingSection

            Section {
                ForEach(Array(viewModel.queue.enumerated()), id: \.element.id) { index, post in
                    HStack(spacing: theme.spacingSm) {
                        Text("\(index + 1)")
                            .font(theme.captionSmallFont)
                            .foregroundColor(theme.textTertiary)
                            .frame(width: 24)

                        VStack(alignment: .leading, spacing: 2) {
                            Text(post.title)
                                .font(theme.captionFont)
                                .foregroundColor(theme.textPrimary)
                                .lineLimit(1)

                            HStack(spacing: theme.spacingXs) {
                                Text(post.sourceName)
                                    .font(theme.captionSmallFont)
                                    .foregroundColor(theme.textSecondary)

                                if !post.formattedDuration.isEmpty {
                                    Text(post.formattedDuration)
                                        .font(theme.captionSmallFont)
                                        .foregroundColor(theme.textTertiary)
                                }
                            }
                        }

                        Spacer()
                    }
                    .padding(.vertical, theme.spacingXs)
                    .listRowBackground(theme.background)
                }
                .onDelete { indexSet in
                    for index in indexSet {
                        viewModel.removeFromQueue(at: index)
                    }
                }
                .onMove { source, destination in
                    viewModel.moveInQueue(from: source, to: destination)
                }
            } header: {
                Text("Up Next — \(viewModel.queue.count) track\(viewModel.queue.count == 1 ? "" : "s")")
                    .font(theme.captionSmallFont)
                    .foregroundColor(theme.textTertiary)
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .environment(\.editMode, .constant(.active))
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: theme.spacingMd) {
            Image(systemName: "list.bullet")
                .font(.system(size: 40))
                .foregroundColor(theme.textMuted)

            Text("Queue is empty")
                .font(theme.titleMediumFont)
                .foregroundColor(theme.textSecondary)

            Text("Add posts to your queue from the explore or playlist screens.")
                .font(theme.captionFont)
                .foregroundColor(theme.textTertiary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, theme.spacingXl)
        }
    }
}
