"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  getFavorites as apiFetchFavorites,
  addFavorite as apiAddFavorite,
  removeFavorite as apiRemoveFavorite,
} from "@/lib/api";

const STORAGE_KEY = "tbc-favorites";

function loadLocal(): Set<number> {
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

function saveLocal(favs: Set<number>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...favs]));
}

function getToken(session: unknown): string | null {
  const s = session as Record<string, unknown> | null;
  if (!s) return null;
  const token = s.accessToken as Record<string, unknown> | undefined;
  if (!token) return null;
  // NextAuth JWT — we need the encoded token, but the session callback gives the decoded object.
  // For our backend we pass the session JWT cookie via a direct encode isn't available client-side.
  // Fallback: use the raw cookie approach. The simplest path: grab the jwt from the cookie.
  if (typeof document !== "undefined") {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith("next-auth.session-token=") || cookie.startsWith("__Secure-next-auth.session-token=")) {
        return cookie.split("=").slice(1).join("=");
      }
      if (cookie.startsWith("authjs.session-token=") || cookie.startsWith("__Secure-authjs.session-token=")) {
        return cookie.split("=").slice(1).join("=");
      }
    }
  }
  return null;
}

export function useFavorites() {
  const { data: session } = useSession();
  const [favoriteSet, setFavoriteSet] = useState<Set<number>>(() => loadLocal());
  const syncedRef = useRef(false);

  const token = getToken(session);
  const isAuthenticated = !!token;

  // Sync server favorites on first authenticated mount
  useEffect(() => {
    if (!isAuthenticated || syncedRef.current) return;
    syncedRef.current = true;

    (async () => {
      try {
        const { post_ids } = await apiFetchFavorites(token);
        const serverSet = new Set(post_ids);
        const localSet = loadLocal();

        // Merge: local favorites not on server get pushed up
        const toAdd = [...localSet].filter((id) => !serverSet.has(id));
        for (const id of toAdd) {
          try {
            await apiAddFavorite(id, token);
          } catch {
            // ignore individual failures
          }
        }

        // Combined set = union
        const merged = new Set([...serverSet, ...localSet]);
        setFavoriteSet(merged);
        saveLocal(merged);
      } catch {
        // Server unavailable — keep using local
      }
    })();
  }, [isAuthenticated, token]);

  const toggleFavorite = useCallback(
    (postId: number) => {
      setFavoriteSet((prev) => {
        const next = new Set(prev);
        const removing = next.has(postId);
        if (removing) {
          next.delete(postId);
        } else {
          next.add(postId);
        }
        saveLocal(next);

        // Fire-and-forget server sync
        if (isAuthenticated && token) {
          if (removing) {
            apiRemoveFavorite(postId, token).catch(() => {});
          } else {
            apiAddFavorite(postId, token).catch(() => {});
          }
        }

        return next;
      });
    },
    [isAuthenticated, token],
  );

  const isFavorite = useCallback(
    (postId: number): boolean => favoriteSet.has(postId),
    [favoriteSet],
  );

  const favorites = [...favoriteSet];

  return { toggleFavorite, isFavorite, favorites };
}
