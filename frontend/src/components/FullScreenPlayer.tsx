"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronDown,
  ListMusic,
} from "lucide-react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

const SOURCE_GRADIENTS: Record<string, string> = {
  cloudflare: "from-orange-600 to-amber-800",
  github: "from-gray-700 to-gray-900",
  meta: "from-blue-600 to-indigo-900",
  uber: "from-gray-800 to-black",
  airbnb: "from-rose-600 to-pink-900",
  netflix: "from-red-700 to-red-950",
  stripe: "from-violet-600 to-indigo-900",
  spotify: "from-green-600 to-green-900",
  google: "from-blue-500 to-blue-800",
  aws: "from-amber-600 to-orange-900",
  linkedin: "from-sky-600 to-blue-900",
  dropbox: "from-blue-500 to-indigo-800",
  slack: "from-purple-600 to-fuchsia-900",
  twitter: "from-sky-500 to-cyan-800",
  default: "from-gray-600 to-gray-900",
};

function getGradient(sourceKey: string): string {
  return (
    SOURCE_GRADIENTS[sourceKey.toLowerCase()] ?? SOURCE_GRADIENTS["default"]
  );
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

interface FullScreenPlayerProps {
  onQueueToggle: () => void;
  queueOpen: boolean;
}

export default function FullScreenPlayer({
  onQueueToggle,
  queueOpen,
}: FullScreenPlayerProps) {
  const {
    currentTrack,
    queue,
    isPlaying,
    isExpanded,
    progress,
    currentTime,
    duration,
    volume,
    playbackRate,
    togglePlay,
    next,
    previous,
    setVolume,
    seek,
    setPlaybackRate,
    toggleExpanded,
  } = useAudioPlayer();

  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const prevVolumeRef = useRef(volume || 0.75);

  // Close on Escape key
  useEffect(() => {
    if (!isExpanded) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        toggleExpanded();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded, toggleExpanded]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = progressBarRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const fraction = (e.clientX - rect.left) / rect.width;
      seek(fraction);
    },
    [seek],
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
    [handleProgressClick, seek],
  );

  const handleVolumeClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = volumeBarRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const fraction = (e.clientX - rect.left) / rect.width;
      setVolume(Math.max(0, Math.min(1, fraction)));
    },
    [setVolume],
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
    [handleVolumeClick, setVolume],
  );

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      prevVolumeRef.current = volume;
      setVolume(0);
    } else {
      setVolume(prevVolumeRef.current || 0.75);
    }
  }, [volume, setVolume]);

  if (!isExpanded || !currentTrack) return null;

  const gradient = getGradient(currentTrack.source_key);
  const initial = (currentTrack.source_name || "?")[0].toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col animate-slide-up"
      style={{ backgroundColor: "var(--color-bg-primary, #111)" }}
    >
      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${gradient} opacity-30`}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <button
            onClick={toggleExpanded}
            className="text-gray-400 hover:text-white transition-colors p-2 -ml-2"
            aria-label="Minimize player"
          >
            <ChevronDown size={28} />
          </button>
          <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">
            Now Playing
          </span>
          <button
            onClick={onQueueToggle}
            className={`relative p-2 -mr-2 rounded-md transition-colors ${
              queueOpen
                ? "text-green-400 bg-white/10"
                : "text-gray-400 hover:text-white"
            }`}
            aria-label="Toggle queue"
          >
            <ListMusic size={24} />
            {queue.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {queue.length > 9 ? "9+" : queue.length}
              </span>
            )}
          </button>
        </div>

        {/* Artwork area */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div
            className={`w-64 h-64 sm:w-80 sm:h-80 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl`}
          >
            <span className="text-8xl sm:text-9xl font-bold text-white/80 select-none">
              {initial}
            </span>
          </div>
        </div>

        {/* Track info */}
        <div className="px-8 pb-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
            {currentTrack.title}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {currentTrack.source_name}
            {currentTrack.author && ` \u00B7 ${currentTrack.author}`}
            {currentTrack.published_at &&
              ` \u00B7 ${formatDate(currentTrack.published_at)}`}
          </p>
        </div>

        {/* Progress bar */}
        <div className="px-8 pb-2">
          <div
            ref={progressBarRef}
            className="w-full h-2 bg-white/20 rounded-full cursor-pointer group relative"
            onMouseDown={handleProgressMouseDown}
          >
            <div
              className="h-full bg-white rounded-full relative transition-[width] duration-75"
              style={{ width: `${progress * 100}%` }}
            >
              <div
                className={`absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md transition-opacity ${
                  isDragging
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              />
            </div>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-gray-400 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-8 pb-4">
          <button
            onClick={previous}
            className="text-gray-300 hover:text-white transition-colors p-2"
            aria-label="Previous track"
          >
            <SkipBack size={28} />
          </button>
          <button
            onClick={togglePlay}
            className="bg-white text-black rounded-full p-4 hover:scale-105 transition-transform"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={32} />
            ) : (
              <Play size={32} className="ml-1" />
            )}
          </button>
          <button
            onClick={next}
            disabled={queue.length === 0}
            className="text-gray-300 hover:text-white transition-colors p-2 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next track"
          >
            <SkipForward size={28} />
          </button>
        </div>

        {/* Bottom controls: volume + speed */}
        <div className="flex items-center justify-center gap-6 px-8 pb-8">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label={volume === 0 ? "Unmute" : "Mute"}
            >
              {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div
              ref={volumeBarRef}
              className="w-28 h-1.5 bg-white/20 rounded-full cursor-pointer group relative"
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
          <button
            onClick={() => {
              const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
              const currentIndex = speeds.indexOf(playbackRate);
              const nextIndex = (currentIndex + 1) % speeds.length;
              setPlaybackRate(speeds[nextIndex]);
            }}
            className="text-sm font-medium px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 transition-colors min-w-[3.5rem] text-center cursor-pointer"
            aria-label={`Playback speed: ${playbackRate}x`}
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}
