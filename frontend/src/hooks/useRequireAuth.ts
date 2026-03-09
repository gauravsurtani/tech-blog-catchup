"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

/** Cache the auth-enabled check across hook instances */
let _authEnabledCache: boolean | null = null;

async function checkAuthEnabled(): Promise<boolean> {
  if (_authEnabledCache !== null) return _authEnabledCache;
  try {
    const res = await fetch("/api/auth/providers");
    if (!res.ok) {
      _authEnabledCache = false;
      return false;
    }
    const providers = await res.json();
    _authEnabledCache = Object.keys(providers).length > 0;
    return _authEnabledCache;
  } catch {
    _authEnabledCache = false;
    return false;
  }
}

/** Lightweight hook that only checks if auth is enabled (no redirect) */
export function useAuthEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(_authEnabledCache);

  useEffect(() => {
    checkAuthEnabled().then(setEnabled);
  }, []);

  return enabled;
}

export function useRequireAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [authEnabled, setAuthEnabled] = useState<boolean | null>(_authEnabledCache);

  useEffect(() => {
    checkAuthEnabled().then(setAuthEnabled);
  }, []);

  useEffect(() => {
    // Only redirect to login if auth is actually configured
    if (authEnabled && status === "unauthenticated") {
      router.replace("/login");
    }
  }, [authEnabled, status, router]);

  // Still checking if auth is enabled
  if (authEnabled === null) {
    return { loading: true, session: null, authEnabled: null } as const;
  }

  // Auth not configured — allow anonymous access
  if (!authEnabled) {
    return { loading: false, session: null, authEnabled: false } as const;
  }

  if (status === "loading") {
    return { loading: true, session: null, authEnabled: true } as const;
  }

  if (status === "authenticated") {
    return { loading: false, session, authEnabled: true } as const;
  }

  return { loading: true, session: null, authEnabled: true } as const;
}
