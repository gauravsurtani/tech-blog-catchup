"use client";

import { useState, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ListMusic,
  ChevronUp,
} from "lucide-react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import PlaylistQueue from "./PlaylistQueue";
import FullScreenPlayer from "./FullScreenPlayer";

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function AudioPlayer() {
  const {
    currentTrack,
    queue,
    isPlaying,
    progress,
    currentTime,
    duration,
    volume,
    togglePlay,
    next,
    previous,
    setVolume,
    seek,
    playbackRate,
    setPlaybackRate,
    toggleExpanded,
  } = useAudioPlayer();

  const [queueOpen, setQueueOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const prevVolumeRef = useRef(volume || 0.75);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = progressBarRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const fraction = (e.clientX - rect.left) / rect.width;
      seek(fraction);
    },
    [seek]
  );

  const handleProgressMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsDragging(true);
      handleProgressClick(e);

      const handleMouseMove = (ev: MouseEvent) => {
        const bar = progressBarRef.current;
        if (!bar) return;
        const rect = bar.getBoundingClientRect();
        const fraction = (ev.clientX - rect.left) / rect.width;
        seek(Math.max(0, Math.min(1, fraction)));
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleProgressClick, seek]
  );

  const handleVolumeClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = volumeBarRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const fraction = (e.clientX - rect.left) / rect.width;
      setVolume(Math.max(0, Math.min(1, fraction)));
    },
    [setVolume]
  );

  const handleVolumeMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      handleVolumeClick(e);

      const handleMouseMove = (ev: MouseEvent) => {
        const bar = volumeBarRef.current;
        if (!bar) return;
        const rect = bar.getBoundingClientRect();
        const fraction = (ev.clientX - rect.left) / rect.width;
        setVolume(Math.max(0, Math.min(1, fraction)));
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleVolumeClick, setVolume]
  );

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      prevVolumeRef.current = volume;
      setVolume(0);
    } else {
      setVolume(prevVolumeRef.current || 0.75);
    }
  }, [volume, setVolume]);

  if (!currentTrack) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 h-20 select-none">
        <div className="h-full max-w-full mx-auto px-4 flex items-center gap-4">
          {/* Track info */}
          <div className="flex flex-col min-w-0 w-56 shrink-0">
            <span className="text-xs text-gray-400 truncate">
              {currentTrack.source_name}
            </span>
            <span className="text-sm font-medium text-gray-100 truncate">
              {currentTrack.title}
            </span>
            {currentTrack.author && (
              <span className="text-xs text-gray-500 truncate">
                {currentTrack.author}
              </span>
            )}
          </div>

          {/* Play controls */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={previous}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Previous track"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={togglePlay}
              className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
            </button>
            <button
              onClick={next}
              disabled={queue.length === 0}
              className="text-gray-400 hover:text-white transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Next track"
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-xs text-gray-400 w-10 text-right tabular-nums shrink-0">
              {formatTime(currentTime)}
            </span>
            <div
              ref={progressBarRef}
              className="flex-1 h-1.5 bg-gray-700 rounded-full cursor-pointer group relative"
              onMouseDown={handleProgressMouseDown}
            >
              <div
                className="h-full bg-green-500 rounded-full relative transition-[width] duration-75"
                style={{ width: `${progress * 100}%` }}
              >
                <div
                  className={`absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md transition-opacity ${
                    isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                />
              </div>
            </div>
            <span className="text-xs text-gray-400 w-10 tabular-nums shrink-0">
              {formatTime(duration)}
            </span>
          </div>

          {/* Volume control */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              onClick={toggleMute}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label={volume === 0 ? "Unmute" : "Mute"}
            >
              {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div
              ref={volumeBarRef}
              className="w-24 h-1.5 bg-gray-700 rounded-full cursor-pointer group relative"
              onMouseDown={handleVolumeMouseDown}
            >
              <div
                className="h-full bg-gray-300 rounded-full relative"
                style={{ width: `${volume * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          {/* Speed control */}
          <button
            onClick={() => {
              const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
              const currentIndex = speeds.indexOf(playbackRate);
              const nextIndex = (currentIndex + 1) % speeds.length;
              setPlaybackRate(speeds[nextIndex]);
            }}
            className="text-xs font-medium px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors shrink-0 min-w-[3rem] text-center cursor-pointer"
            aria-label={`Playback speed: ${playbackRate}x`}
          >
            {playbackRate}x
          </button>

          {/* Expand button */}
          <button
            onClick={toggleExpanded}
            className="text-gray-400 hover:text-white transition-colors p-1 shrink-0"
            aria-label="Expand player"
          >
            <ChevronUp size={20} />
          </button>

          {/* Queue button */}
          <button
            onClick={() => setQueueOpen((o) => !o)}
            className={`relative p-2 rounded-md transition-colors shrink-0 ${
              queueOpen
                ? "text-green-400 bg-gray-800"
                : "text-gray-400 hover:text-white"
            }`}
            aria-label="Toggle queue"
          >
            <ListMusic size={20} />
            {queue.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {queue.length > 9 ? "9+" : queue.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <FullScreenPlayer
        onQueueToggle={() => setQueueOpen((o) => !o)}
        queueOpen={queueOpen}
      />
      <PlaylistQueue isOpen={queueOpen} onClose={() => setQueueOpen(false)} />
    </>
  );
}
