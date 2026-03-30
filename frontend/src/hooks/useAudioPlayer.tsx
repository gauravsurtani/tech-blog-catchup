"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { getAudioUrl } from "@/lib/api";
import type { Post } from "@/lib/types";

interface AudioPlayerState {
  currentTrack: Post | null;
  queue: Post[];
  history: Post[];
  isPlaying: boolean;
  isExpanded: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}

interface AudioPlayerActions {
  play: (post: Post) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  addToQueue: (post: Post) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  setVolume: (v: number) => void;
  seek: (fraction: number) => void;
  clearQueue: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleExpanded: () => void;
}

type AudioPlayerContextType = AudioPlayerState & AudioPlayerActions;

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

const VOLUME_KEY = "audio-player-volume";
const QUEUE_KEY = "audio-player-queue";
const CURRENT_TRACK_KEY = "audio-player-current-track";
const PLAYBACK_POSITIONS_KEY = "tbc-playback-positions";
const POSITION_SAVE_INTERVAL_MS = 5000;
const POSITION_MAX_AGE_DAYS = 30;

interface PlaybackPosition {
  position: number;
  duration: number;
  updatedAt: string;
}

type PlaybackPositions = Record<string, PlaybackPosition>;

function getStoredPositions(): PlaybackPositions {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(PLAYBACK_POSITIONS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return {};
}

function savePositions(positions: PlaybackPositions): void {
  try {
    localStorage.setItem(PLAYBACK_POSITIONS_KEY, JSON.stringify(positions));
  } catch {
    // ignore
  }
}

function cleanOldPositions(positions: PlaybackPositions): PlaybackPositions {
  const cutoff = Date.now() - POSITION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const cleaned: PlaybackPositions = {};
  for (const [id, entry] of Object.entries(positions)) {
    if (new Date(entry.updatedAt).getTime() > cutoff) {
      cleaned[id] = entry;
    }
  }
  return cleaned;
}

function savePosition(postId: number, position: number, duration: number): void {
  const positions = cleanOldPositions(getStoredPositions());
  positions[String(postId)] = {
    position,
    duration,
    updatedAt: new Date().toISOString(),
  };
  savePositions(positions);
}

function clearPosition(postId: number): void {
  const positions = getStoredPositions();
  delete positions[String(postId)];
  savePositions(positions);
}

function getPosition(postId: number): PlaybackPosition | null {
  const positions = getStoredPositions();
  return positions[String(postId)] ?? null;
}

function getStoredVolume(): number {
  if (typeof window === "undefined") return 0.75;
  try {
    const stored = localStorage.getItem(VOLUME_KEY);
    if (stored !== null) {
      const val = parseFloat(stored);
      if (!isNaN(val) && val >= 0 && val <= 1) return val;
    }
  } catch {
    // ignore
  }
  return 0.75;
}

function getStoredQueue(): Post[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return [];
}

function getStoredCurrentTrack(): Post | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CURRENT_TRACK_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return null;
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackRateRef = useRef(1);
  const prevVolumeForMuteRef = useRef(0.75);
  const pendingRestoreRef = useRef<number | null>(null);

  const [currentTrack, setCurrentTrack] = useState<Post | null>(getStoredCurrentTrack);
  const [queue, setQueue] = useState<Post[]>(getStoredQueue);
  const [history, setHistory] = useState<Post[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(getStoredVolume);
  const [playbackRate, setPlaybackRateState] = useState(1);

  // Set volume on audio element when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    try {
      localStorage.setItem(VOLUME_KEY, String(volume));
    } catch {
      // ignore
    }
  }, [volume]);

  // Sync playback rate with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Persist queue to localStorage (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      } catch {
        // ignore
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [queue]);

  // Persist current track to localStorage (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (currentTrack) {
          localStorage.setItem(CURRENT_TRACK_KEY, JSON.stringify(currentTrack));
        } else {
          localStorage.removeItem(CURRENT_TRACK_KEY);
        }
      } catch {
        // ignore
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [currentTrack]);

  // Debounced playback position save (every 5s while playing)
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;

    const timer = setInterval(() => {
      const audio = audioRef.current;
      if (audio && audio.currentTime > 0 && isFinite(audio.duration)) {
        savePosition(currentTrack.id, audio.currentTime, audio.duration);
      }
    }, POSITION_SAVE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isPlaying, currentTrack]);

  // Clean up old positions on mount
  useEffect(() => {
    const positions = getStoredPositions();
    const cleaned = cleanOldPositions(positions);
    if (Object.keys(cleaned).length !== Object.keys(positions).length) {
      savePositions(cleaned);
    }
  }, []);

  const loadAndPlay = useCallback((post: Post, restorePosition = true) => {
    const audio = audioRef.current;
    if (!audio || !post.audio_path) return;

    if (restorePosition) {
      const saved = getPosition(post.id);
      if (saved && saved.position > 0) {
        pendingRestoreRef.current = saved.position;
      } else {
        pendingRestoreRef.current = null;
      }
    } else {
      pendingRestoreRef.current = null;
    }

    audio.src = getAudioUrl(post.audio_path);
    audio.load();
    audio.playbackRate = playbackRateRef.current;
    audio.play().catch(() => {
      // autoplay may be blocked
    });
  }, []);

  // Update MediaSession for lock screen controls
  const updateMediaSession = useCallback((track: Post | null, playing: boolean) => {
    if (!("mediaSession" in navigator) || !track) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.source_name || "Catchup",
      album: "Catchup",
      artwork: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    });

    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, []);

  // Sync MediaSession when track changes or play state changes
  useEffect(() => {
    updateMediaSession(currentTrack, isPlaying);
  }, [currentTrack, isPlaying, updateMediaSession]);

  const play = useCallback(
    (post: Post) => {
      if (currentTrack) {
        setHistory((prev) => [...prev, currentTrack]);
      }
      setCurrentTrack(post);
      setIsPlaying(true);
      setProgress(0);
      setCurrentTime(0);
      loadAndPlay(post);
    },
    [currentTrack, loadAndPlay]
  );

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      // Save position immediately on pause
      if (currentTrack && audio.currentTime > 0 && isFinite(audio.duration)) {
        savePosition(currentTrack.id, audio.currentTime, audio.duration);
      }
    }
    setIsPlaying(false);
  }, [currentTrack]);

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {});
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    const [nextTrack, ...rest] = queue;
    if (currentTrack) {
      setHistory((prev) => [...prev, currentTrack]);
    }
    setQueue(rest);
    setCurrentTrack(nextTrack);
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);
    loadAndPlay(nextTrack);
  }, [queue, currentTrack, loadAndPlay]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    // If more than 3 seconds in, restart current track
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      setProgress(0);
      return;
    }
    // Go to previous track from history
    if (history.length === 0) {
      // Just restart
      if (audio) {
        audio.currentTime = 0;
        setCurrentTime(0);
        setProgress(0);
      }
      return;
    }
    const prevTrack = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    if (currentTrack) {
      setQueue((prev) => [currentTrack, ...prev]);
    }
    setCurrentTrack(prevTrack);
    setIsPlaying(true);
    setProgress(0);
    setCurrentTime(0);
    loadAndPlay(prevTrack);
  }, [history, currentTrack, loadAndPlay]);

  const addToQueue = useCallback((post: Post) => {
    setQueue((prev) => [...prev, post]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueue((prev) => {
      const newQueue = [...prev];
      const [moved] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, moved);
      return newQueue;
    });
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
  }, []);

  const seek = useCallback((fraction: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const clamped = Math.max(0, Math.min(1, fraction));
    audio.currentTime = clamped * audio.duration;
    setCurrentTime(audio.currentTime);
    setProgress(clamped);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    playbackRateRef.current = rate;
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case " ": // Space - toggle play
          e.preventDefault();
          if (currentTrack) {
            togglePlay();
          }
          break;
        case "ArrowRight": // Seek forward 10s
          e.preventDefault();
          if (audioRef.current && audioRef.current.duration) {
            const newTime = Math.min(audioRef.current.currentTime + 10, audioRef.current.duration);
            audioRef.current.currentTime = newTime;
          }
          break;
        case "ArrowLeft": // Seek backward 10s
          e.preventDefault();
          if (audioRef.current) {
            audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
          }
          break;
        case "ArrowUp": // Volume up 10%
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case "ArrowDown": // Volume down 10%
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case "m":
        case "M": // Toggle mute
          if (volume > 0) {
            prevVolumeForMuteRef.current = volume;
            setVolume(0);
          } else {
            setVolume(prevVolumeForMuteRef.current || 0.75);
          }
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTrack, togglePlay, volume, setVolume]);

  // Register MediaSession action handlers for lock screen / headphone controls
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    const audio = audioRef.current;

    navigator.mediaSession.setActionHandler("play", () => {
      audio?.play().catch(() => {});
      setIsPlaying(true);
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      audio?.pause();
      setIsPlaying(false);
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      previous();
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      if (queue.length > 0) next();
    });
    navigator.mediaSession.setActionHandler("seekbackward", (details) => {
      if (!audio) return;
      audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10));
    });
    navigator.mediaSession.setActionHandler("seekforward", (details) => {
      if (!audio) return;
      audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + (details.seekOffset || 10));
    });
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (!audio || details.seekTime == null) return;
      audio.currentTime = details.seekTime;
    });

    return () => {
      const actions: MediaSessionAction[] = ["play", "pause", "previoustrack", "nexttrack", "seekbackward", "seekforward", "seekto"];
      actions.forEach((action) => {
        try { navigator.mediaSession.setActionHandler(action, null); } catch {}
      });
    };
  }, [next, previous, queue.length]);

  // Audio element event handlers
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    if (audio.duration && isFinite(audio.duration)) {
      setProgress(audio.currentTime / audio.duration);
      // Report position to MediaSession for lock screen scrubber
      if ("mediaSession" in navigator && navigator.mediaSession.setPositionState) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime,
          });
        } catch {}
      }
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isFinite(audio.duration)) {
      setDuration(audio.duration);
    }
    // Restore saved playback position
    if (pendingRestoreRef.current !== null) {
      const pos = pendingRestoreRef.current;
      pendingRestoreRef.current = null;
      if (isFinite(audio.duration) && pos < audio.duration) {
        audio.currentTime = pos;
        setCurrentTime(pos);
        setProgress(pos / audio.duration);
      }
    }
  }, []);

  const handleEnded = useCallback(() => {
    // Clear saved position when track finishes naturally
    if (currentTrack) {
      clearPosition(currentTrack.id);
    }
    if (queue.length > 0) {
      next();
    } else {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
  }, [queue.length, next, currentTrack]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const contextValue: AudioPlayerContextType = {
    currentTrack,
    queue,
    history,
    isPlaying,
    isExpanded,
    progress,
    currentTime,
    duration,
    volume,
    playbackRate,
    play,
    pause,
    resume,
    togglePlay,
    next,
    previous,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    setVolume,
    seek,
    clearQueue,
    setPlaybackRate,
    toggleExpanded,
  };

  return (
    <AudioPlayerContext.Provider value={contextValue}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
      />
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer(): AudioPlayerContextType {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error(
      "useAudioPlayer must be used within an AudioPlayerProvider"
    );
  }
  return context;
}
