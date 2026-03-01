"use client";

import { useState, useCallback } from "react";

export interface Playlist {
  id: string;
  name: string;
  description: string;
  color: string;
  postIds: number[];
  createdAt: string;
}

const STORAGE_KEY = "tbc-playlists";

const PALETTE = [
  "#10b981", "#6366f1", "#f59e0b", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316",
];

function generateId(): string {
  return `pl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function loadPlaylists(): Playlist[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function savePlaylists(playlists: Playlist[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
}

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadPlaylists());

  const persist = useCallback((next: Playlist[]) => {
    setPlaylists(next);
    savePlaylists(next);
  }, []);

  const createPlaylist = useCallback(
    (name: string, description = ""): Playlist => {
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const playlist: Playlist = {
        id: generateId(),
        name,
        description,
        color,
        postIds: [],
        createdAt: new Date().toISOString(),
      };
      const next = [...loadPlaylists(), playlist];
      persist(next);
      return playlist;
    },
    [persist]
  );

  const deletePlaylist = useCallback(
    (id: string) => {
      persist(loadPlaylists().filter((p: Playlist) => p.id !== id));
    },
    [persist]
  );

  const renamePlaylist = useCallback(
    (id: string, name: string, description?: string) => {
      persist(
        loadPlaylists().map((p: Playlist) =>
          p.id === id
            ? { ...p, name, ...(description !== undefined ? { description } : {}) }
            : p
        )
      );
    },
    [persist]
  );

  const addToPlaylist = useCallback(
    (playlistId: string, postId: number) => {
      persist(
        loadPlaylists().map((p: Playlist) =>
          p.id === playlistId && !p.postIds.includes(postId)
            ? { ...p, postIds: [...p.postIds, postId] }
            : p
        )
      );
    },
    [persist]
  );

  const removeFromPlaylist = useCallback(
    (playlistId: string, postId: number) => {
      persist(
        loadPlaylists().map((p: Playlist) =>
          p.id === playlistId
            ? { ...p, postIds: p.postIds.filter((pid: number) => pid !== postId) }
            : p
        )
      );
    },
    [persist]
  );

  const getPlaylistById = useCallback(
    (id: string): Playlist | undefined => {
      return playlists.find((p: Playlist) => p.id === id);
    },
    [playlists]
  );

  return {
    playlists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    getPlaylistById,
  };
}
