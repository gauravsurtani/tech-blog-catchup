"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "tbc-favorites";

function loadFavorites(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed);
    return new Set();
  } catch {
    return new Set();
  }
}

function saveFavorites(favs: Set<number>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favs]));
}

export function useFavorites() {
  const [favoriteSet, setFavoriteSet] = useState<Set<number>>(() => loadFavorites());

  useEffect(() => {
    setFavoriteSet(loadFavorites());
  }, []);

  const toggleFavorite = useCallback((postId: number) => {
    setFavoriteSet((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      saveFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (postId: number): boolean => favoriteSet.has(postId),
    [favoriteSet]
  );

  const favorites = [...favoriteSet];

  return { toggleFavorite, isFavorite, favorites };
}
