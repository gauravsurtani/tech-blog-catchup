"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronDown,
  ListMusic,
  FileText,
} from "lucide-react";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { getPost } from "@/lib/api";
import { formatDate } from "@/lib/formatters";
import WaveformBar from "./WaveformBar";
import TranscriptPanel from "./TranscriptPanel";

// Deterministic gradient palette — works for any source key
const GRADIENT_PALETTE = [
  "from-orange-600 to-amber-800",
  "from-blue-600 to-indigo-900",
  "from-rose-600 to-pink-900",
  "from-violet-600 to-indigo-900",
  "from-green-600 to-green-900",
  "from-red-700 to-red-950",
  "from-sky-600 to-blue-900",
  "from-amber-600 to-orange-900",
  "from-purple-600 to-fuchsia-900",
  "from-teal-600 to-cyan-900",
  "from-gray-700 to-gray-900",
  "from-emerald-600 to-emerald-900",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getGradient(sourceKey: string): string {
  const index = hashString(sourceKey.toLowerCase()) % GRADIENT_PALETTE.length;
  return GRADIENT_PALETTE[index];
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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

  const volumeBarRef = useRef<HTMLDivElement>(null);
  const prevVolumeRef = useRef(volume || 0.75);

  // Transcript state
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [fullText, setFullText] = useState<string | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const lastFetchedPostIdRef = useRef<number | null>(null);

  // Reset full text cache when track changes (adjust state during render)
  const [prevTrackId, setPrevTrackId] = useState<number | null>(null);
  if (currentTrack && prevTrackId !== currentTrack.id) {
    setPrevTrackId(currentTrack.id);
    if (lastFetchedPostIdRef.current !== currentTrack.id) {
      setFullText(null);
      lastFetchedPostIdRef.current = null;
    }
  }

  // Fetch full text when transcript is toggled on
  useEffect(() => {
    if (!transcriptOpen || !currentTrack) return;
    if (lastFetchedPostIdRef.current === currentTrack.id && fullText !== null) return;

    let cancelled = false;

    const fetchData = async () => {
      setTranscriptLoading(true);
      try {
        const detail = await getPost(currentTrack.id);
        if (!cancelled) {
          setFullText(detail.full_text);
          lastFetchedPostIdRef.current = detail.id;
        }
      } catch {
        if (!cancelled) {
          setFullText(null);
        }
      } finally {
        if (!cancelled) {
          setTranscriptLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [transcriptOpen, currentTrack, fullText]);

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
      style={{ backgroundColor: "var(--bg)" }}
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
            className="text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors p-2 -ml-2 nb-hover border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius)]"
            aria-label="Minimize player"
          >
            <ChevronDown size={28} />
          </button>
          <span className="text-xs text-[var(--text-2)] uppercase tracking-widest font-medium">
            Now Playing
          </span>
          <div className="flex items-center gap-2 -mr-2">
            <button
              onClick={() => setTranscriptOpen((prev) => !prev)}
              className={`p-2 rounded-[var(--radius)] transition-colors nb-hover border-[var(--border-w)] border-[var(--border-color)] ${
                transcriptOpen
                  ? "text-[var(--primary)] bg-[var(--primary-bg)]"
                  : "text-[var(--text-2)] hover:text-[var(--text-1)]"
              }`}
              aria-label="Toggle transcript"
            >
              <FileText size={24} />
            </button>
            <button
              onClick={onQueueToggle}
              className={`relative p-2 rounded-[var(--radius)] transition-colors nb-hover border-[var(--border-w)] border-[var(--border-color)] ${
                queueOpen
                  ? "text-[var(--primary)] bg-[var(--primary-bg)]"
                  : "text-[var(--text-2)] hover:text-[var(--text-1)]"
              }`}
              aria-label="Toggle queue"
            >
              <ListMusic size={24} />
              {queue.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-[var(--primary-text)] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-[var(--border-w)] border-[var(--border-color)]">
                  {queue.length > 9 ? "9+" : queue.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Artwork area / Transcript panel */}
        <div className="flex-1 flex items-center justify-center px-8 min-h-0">
          {transcriptOpen ? (
            <div
              className="w-full max-w-2xl h-full rounded-[var(--radius)] overflow-hidden nb-card"
            >
              {transcriptLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div
                    className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: "var(--text-3)", borderTopColor: "transparent" }}
                  />
                </div>
              ) : fullText ? (
                <TranscriptPanel
                  fullText={fullText}
                  currentTime={currentTime}
                  duration={duration}
                />
              ) : (
                <div
                  className="flex items-center justify-center h-full"
                  style={{ color: "var(--text-3)" }}
                >
                  <p className="text-sm">No transcript available.</p>
                </div>
              )}
            </div>
          ) : (
            <div
              className={`w-64 h-64 sm:w-80 sm:h-80 rounded-[var(--radius)] bg-gradient-to-br ${gradient} flex items-center justify-center border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)]`}
            >
              <span className="text-8xl sm:text-9xl font-bold text-white/80 select-none">
                {initial}
              </span>
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="px-8 pb-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-1)] truncate">
            {currentTrack.title}
          </h2>
          <p className="text-sm text-[var(--text-2)] mt-1">
            {currentTrack.source_name}
            {currentTrack.author && ` \u00B7 ${currentTrack.author}`}
            {currentTrack.published_at &&
              ` \u00B7 ${formatDate(currentTrack.published_at)}`}
          </p>
        </div>

        {/* Waveform progress */}
        <div className="px-8 pb-2">
          <WaveformBar
            postId={currentTrack.id}
            progress={progress}
            onSeek={seek}
            height={32}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-[var(--text-2)] tabular-nums">
              {formatTime(currentTime)}
            </span>
            <span className="text-xs text-[var(--text-2)] tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-center gap-8 pb-4">
          <button
            onClick={previous}
            className="text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors p-2 nb-hover"
            aria-label="Previous track"
          >
            <SkipBack size={28} />
          </button>
          <button
            onClick={togglePlay}
            className="w-16 h-16 flex items-center justify-center bg-[var(--primary)] text-[var(--primary-text)] rounded-full border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] nb-hover"
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
            className="text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors p-2 disabled:opacity-30 disabled:cursor-not-allowed nb-hover"
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
              className="text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors p-1 nb-hover"
              aria-label={volume === 0 ? "Unmute" : "Mute"}
            >
              {volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div
              ref={volumeBarRef}
              className="w-28 h-1.5 bg-[var(--tag-bg)] rounded-full cursor-pointer group relative border-[1.5px] border-[var(--border-color)] p-[2px]"
              onMouseDown={handleVolumeMouseDown}
            >
              <div
                className="h-full bg-[var(--primary)] rounded-full relative"
                style={{ width: `${volume * 100}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[var(--text-1)] rounded-full shadow-[var(--shadow-sm)] opacity-0 group-hover:opacity-100 transition-opacity" />
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
            className="text-sm font-medium px-3 py-1.5 rounded-[var(--radius-full)] border-[var(--border-w)] border-[var(--border-color)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-2)] shadow-[var(--shadow-sm)] transition-colors min-w-[3.5rem] text-center cursor-pointer nb-hover"
            aria-label={`Playback speed: ${playbackRate}x`}
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
}
