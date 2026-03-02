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
import WaveformBar from "./WaveformBar";

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
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const prevVolumeRef = useRef(volume || 0.75);

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

  const handleVolumeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newVolume: number | null = null;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowUp":
          newVolume = Math.min(1, volume + 0.05);
          break;
        case "ArrowLeft":
        case "ArrowDown":
          newVolume = Math.max(0, volume - 0.05);
          break;
        case "Home":
          newVolume = 0;
          break;
        case "End":
          newVolume = 1;
          break;
        default:
          return;
      }
      e.preventDefault();
      setVolume(newVolume);
    },
    [volume, setVolume],
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

  if (!currentTrack) return null;

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-50 h-[76px] select-none border-t-[var(--border-w)] border-[var(--border-color)]"
        style={{
          backgroundColor: "var(--player-bg)",
          boxShadow: "var(--player-shadow)",
        }}
      >
        <div className="h-full max-w-full mx-auto px-4 flex items-center gap-4">
          {/* Track info */}
          <div className="flex flex-col min-w-0 w-56 shrink-0" aria-live="polite">
            <span className="text-xs text-[var(--text-2)] truncate">
              {currentTrack.source_name}
            </span>
            <span className="text-sm font-medium text-[var(--text-1)] truncate">
              {currentTrack.title}
            </span>
            {currentTrack.author && (
              <span className="text-xs text-[var(--text-3)] truncate">
                {currentTrack.author}
              </span>
            )}
          </div>

          {/* Play controls */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={previous}
              className="text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors p-1 nb-hover"
              aria-label="Previous track"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={togglePlay}
              className="w-11 h-11 flex items-center justify-center bg-[var(--primary)] text-[var(--primary-text)] rounded-full border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] nb-hover"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause size={22} />
              ) : (
                <Play size={22} className="ml-0.5" />
              )}
            </button>
            <button
              onClick={next}
              disabled={queue.length === 0}
              className="text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed nb-hover"
              aria-label="Next track"
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* Waveform progress */}
          <div
            className="flex items-center gap-3 flex-1 min-w-0"
            role="group"
            aria-label="Playback progress"
          >
            <span className="text-xs text-[var(--text-2)] w-10 text-right tabular-nums shrink-0">
              {formatTime(currentTime)}
            </span>
            <WaveformBar
              postId={currentTrack.id}
              progress={progress}
              onSeek={seek}
              height={24}
              className="flex-1"
            />
            <span className="text-xs text-[var(--text-2)] w-10 tabular-nums shrink-0">
              {formatTime(duration)}
            </span>
          </div>

          {/* Volume control */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              onClick={toggleMute}
              className="text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors p-1 nb-hover"
              aria-label={volume === 0 ? "Unmute" : "Mute"}
            >
              {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div
              ref={volumeBarRef}
              role="slider"
              aria-label="Volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(volume * 100)}
              tabIndex={0}
              className="w-24 h-1.5 bg-[var(--tag-bg)] rounded-full cursor-pointer group relative border-[1.5px] border-[var(--border-color)] p-[2px]"
              onMouseDown={handleVolumeMouseDown}
              onKeyDown={handleVolumeKeyDown}
            >
              <div
                className="h-full bg-[var(--primary)] rounded-full relative"
                style={{ width: `${volume * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--text-1)] rounded-full shadow-[var(--shadow-sm)] opacity-0 group-hover:opacity-100 transition-opacity" />
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
            className="text-xs font-medium px-2 py-1 rounded-[var(--radius-full)] border-[var(--border-w)] border-[var(--border-color)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-2)] shadow-[var(--shadow-sm)] transition-colors shrink-0 min-w-[3rem] text-center cursor-pointer nb-hover"
            aria-label={`Playback speed: ${playbackRate}x`}
          >
            {playbackRate}x
          </button>

          {/* Expand button */}
          <button
            onClick={toggleExpanded}
            className="text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors p-1 shrink-0 nb-hover"
            aria-label="Expand player"
          >
            <ChevronUp size={20} />
          </button>

          {/* Queue button */}
          <button
            onClick={() => setQueueOpen((o) => !o)}
            className={`relative p-2 rounded-[var(--radius)] transition-colors shrink-0 nb-hover ${
              queueOpen
                ? "text-[var(--primary)] bg-[var(--bg-elevated)]"
                : "text-[var(--text-2)] hover:text-[var(--text-1)]"
            }`}
            aria-label="Toggle queue"
          >
            <ListMusic size={20} />
            {queue.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-[var(--primary-text)] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-[var(--border-w)] border-[var(--border-color)]">
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
