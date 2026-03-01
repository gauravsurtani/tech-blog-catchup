"use client";

import { useState, useCallback, useEffect } from "react";

const SETTINGS_KEY = "tbc-settings";

export interface Settings {
  theme: "light" | "dark" | "system";
  defaultSpeed: number;
  autoPlayNext: boolean;
  emailDigest: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  defaultSpeed: 1,
  autoPlayNext: true,
  emailDigest: false,
};

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function persistSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  // Sync to localStorage whenever settings change
  useEffect(() => {
    persistSettings(settings);
  }, [settings]);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return { settings, updateSetting } as const;
}
