"use client";

import { useState, useEffect } from "react";
import { X, ChevronUp, ChevronDown, Trash2, Music } from "lucide-react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

function formatTime(seconds: number | null): string {
  if (!seconds || !isFinite(seconds)) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface PlaylistQueueProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PlaylistQueue({ isOpen, onClose }: PlaylistQueueProps) {
  const {
    currentTrack,
    queue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    play,
  } = useAudioPlayer();

  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!confirmClear) return;
    const timer = setTimeout(() => setConfirmClear(false), 5000);
    return () => clearTimeout(timer);
  }, [confirmClear]);

  return (
    <>
      {/* Backdrop overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 sm:hidden"
          onClick={onClose}
        />
      )}

      {/* Slide-out panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-80 sm:w-96 bg-[var(--bg)] border-l-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-lg)] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ bottom: "80px", height: "calc(100vh - 80px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b-[1.5px] border-[var(--split)]">
          <h2 className="text-lg font-semibold text-[var(--text-1)]">Queue</h2>
          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              confirmClear ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[var(--text-2)]">Clear {queue.length} tracks?</span>
                  <button
                    onClick={() => { clearQueue(); setConfirmClear(false); }}
                    className="text-xs text-[var(--error)] hover:opacity-80 px-2 py-0.5 rounded-[var(--radius)] bg-[var(--error)]/10 hover:bg-[var(--error)]/20 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-xs text-[var(--text-2)] hover:text-[var(--text-1)] px-2 py-0.5 rounded-[var(--radius)] hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="text-xs text-[var(--text-2)] hover:text-[var(--error)] transition-colors px-2 py-1 rounded-[var(--radius)] hover:bg-[var(--bg-hover)]"
                >
                  Clear All
                </button>
              )
            )}
            <button
              onClick={onClose}
              className="text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors p-1"
              aria-label="Close queue"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-full pb-4">
          {/* Now Playing */}
          {currentTrack && (
            <div className="px-4 pt-4 pb-2">
              <span className="text-xs font-medium text-[var(--primary)] uppercase tracking-wider">
                Now Playing
              </span>
              <div className="mt-2 p-3 bg-[var(--bg-elevated)] rounded-[var(--radius)] border-l-4 border-[var(--primary)] border-t-[var(--border-w)] border-r-[var(--border-w)] border-b-[var(--border-w)] border-t-[var(--border-color)] border-r-[var(--border-color)] border-b-[var(--border-color)]">
                <p className="text-sm font-medium text-[var(--text-1)] truncate">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-[var(--text-2)] mt-0.5 truncate">
                  {currentTrack.source_name}
                  {currentTrack.author ? ` \u2022 ${currentTrack.author}` : ""}
                </p>
                {currentTrack.audio_duration_secs && (
                  <p className="text-xs text-[var(--text-3)] mt-1">
                    {formatTime(currentTrack.audio_duration_secs)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Upcoming tracks */}
          <div className="px-4 pt-3">
            <span className="text-xs font-medium text-[var(--text-2)] uppercase tracking-wider">
              Next Up {queue.length > 0 && `(${queue.length})`}
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Music size={40} className="text-[var(--text-4)] mb-3" />
              <p className="text-[var(--text-2)] text-sm">Queue is empty</p>
              <p className="text-[var(--text-3)] text-xs mt-1">
                Add tracks from the playlist to start building your queue.
              </p>
            </div>
          ) : (
            <ul className="mt-2 space-y-1 px-2">
              {queue.map((track, index) => (
                <li
                  key={`${track.id}-${index}`}
                  className="flex items-center gap-2 px-2 py-2 rounded-[var(--radius)] hover:bg-[var(--bg-hover)] transition-colors group"
                >
                  {/* Track number */}
                  <span className="text-xs text-[var(--text-4)] w-5 text-center shrink-0">
                    {index + 1}
                  </span>

                  {/* Track info (clickable to play) */}
                  <button
                    onClick={() => play(track)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-sm text-[var(--text-1)] truncate group-hover:text-[var(--text-1)] transition-colors">
                      {track.title}
                    </p>
                    <p className="text-xs text-[var(--text-3)] truncate">
                      {track.source_name}
                      {track.audio_duration_secs
                        ? ` \u2022 ${formatTime(track.audio_duration_secs)}`
                        : ""}
                    </p>
                  </button>

                  {/* Reorder buttons */}
                  <div className="flex flex-col shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        if (index > 0) reorderQueue(index, index - 1);
                      }}
                      disabled={index === 0}
                      className="text-[var(--text-4)] hover:text-[var(--text-1)] disabled:opacity-20 p-0.5"
                      aria-label="Move up"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (index < queue.length - 1)
                          reorderQueue(index, index + 1);
                      }}
                      disabled={index === queue.length - 1}
                      className="text-[var(--text-4)] hover:text-[var(--text-1)] disabled:opacity-20 p-0.5"
                      aria-label="Move down"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeFromQueue(index)}
                    className="text-[var(--text-3)] hover:text-[var(--error)] transition-colors p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
                    aria-label="Remove from queue"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
