"use client";

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
        className={`fixed top-0 right-0 z-50 h-full w-80 sm:w-96 bg-gray-900 border-l border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ bottom: "80px", height: "calc(100vh - 80px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Queue</h2>
          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors px-2 py-1 rounded hover:bg-gray-800"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
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
              <span className="text-xs font-medium text-green-400 uppercase tracking-wider">
                Now Playing
              </span>
              <div className="mt-2 p-3 bg-gray-800/70 rounded-lg border border-gray-700">
                <p className="text-sm font-medium text-white truncate">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {currentTrack.source_name}
                  {currentTrack.author ? ` \u2022 ${currentTrack.author}` : ""}
                </p>
                {currentTrack.audio_duration_secs && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(currentTrack.audio_duration_secs)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Upcoming tracks */}
          <div className="px-4 pt-3">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Next Up {queue.length > 0 && `(${queue.length})`}
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Music size={40} className="text-gray-600 mb-3" />
              <p className="text-gray-400 text-sm">Queue is empty</p>
              <p className="text-gray-500 text-xs mt-1">
                Add tracks from the playlist to start building your queue.
              </p>
            </div>
          ) : (
            <ul className="mt-2 space-y-1 px-2">
              {queue.map((track, index) => (
                <li
                  key={`${track.id}-${index}`}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-800/60 transition-colors group"
                >
                  {/* Track number */}
                  <span className="text-xs text-gray-500 w-5 text-center shrink-0">
                    {index + 1}
                  </span>

                  {/* Track info (clickable to play) */}
                  <button
                    onClick={() => play(track)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-sm text-gray-200 truncate group-hover:text-white transition-colors">
                      {track.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {track.source_name}
                      {track.audio_duration_secs
                        ? ` \u2022 ${formatTime(track.audio_duration_secs)}`
                        : ""}
                    </p>
                  </button>

                  {/* Reorder buttons */}
                  <div className="flex flex-col shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        if (index > 0) reorderQueue(index, index - 1);
                      }}
                      disabled={index === 0}
                      className="text-gray-500 hover:text-white disabled:opacity-20 p-0.5"
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
                      className="text-gray-500 hover:text-white disabled:opacity-20 p-0.5"
                      aria-label="Move down"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeFromQueue(index)}
                    className="text-gray-500 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100 shrink-0"
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
