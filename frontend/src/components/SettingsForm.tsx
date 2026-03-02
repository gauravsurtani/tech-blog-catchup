"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Bell, Check } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import type { Settings } from "@/hooks/useSettings";
import { useEffect, useState, useCallback, useRef } from "react";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

const THEME_OPTIONS: { value: Settings["theme"]; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun className="w-5 h-5" /> },
  { value: "dark", label: "Dark", icon: <Moon className="w-5 h-5" /> },
  { value: "system", label: "System", icon: <Monitor className="w-5 h-5" /> },
];

function SectionHeader({ title, saved }: { title: string; saved?: boolean }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-[var(--text-1)]">{title}</h2>
        {saved !== undefined && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] transition-opacity duration-300 ${
              saved ? "opacity-100" : "opacity-0"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
      </div>
      <div className="mt-2 h-px bg-[var(--split)]" />
    </div>
  );
}

export default function SettingsForm() {
  const { settings, updateSetting } = useSettings();
  const { setTheme } = useTheme();
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUpdate = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      updateSetting(key, value);
      setSavedKey(key);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSavedKey(null), 1500);
    },
    [updateSetting]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Sync theme setting with next-themes
  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme, setTheme]);

  return (
    <div className="max-w-2xl space-y-8">
      {/* Theme Section */}
      <section className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-6">
        <SectionHeader title="Appearance" saved={savedKey === "theme"} />
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((option) => {
            const selected = settings.theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleUpdate("theme", option.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-[var(--radius-lg)] border-[var(--border-w)] transition-colors cursor-pointer ${
                  selected
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-[var(--shadow)]"
                    : "border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-2)] hover:bg-[var(--bg-hover)]"
                }`}
                aria-pressed={selected}
              >
                {option.icon}
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Playback Section */}
      <section className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-6">
        <SectionHeader title="Playback" saved={savedKey === "defaultSpeed" || savedKey === "autoPlayNext"} />
        <div className="space-y-5">
          {/* Default Speed */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-1)]">Default Speed</p>
              <p className="text-xs text-[var(--text-3)] mt-0.5">
                Applied when starting a new podcast
              </p>
            </div>
            <select
              value={settings.defaultSpeed}
              onChange={(e) => handleUpdate("defaultSpeed", parseFloat(e.target.value))}
              className="px-3 py-1.5 rounded-[var(--radius)] border-[var(--border-w)] border-[var(--border-color)] bg-[var(--bg)] text-[var(--text-1)] text-sm shadow-[var(--shadow-sm)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
            >
              {SPEED_OPTIONS.map((speed) => (
                <option key={speed} value={speed}>
                  {speed}x
                </option>
              ))}
            </select>
          </div>

          {/* Auto-play next */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-1)]">
                Auto-play Next
              </p>
              <p className="text-xs text-[var(--text-3)] mt-0.5">
                Automatically play the next podcast in queue
              </p>
            </div>
            <button
              role="switch"
              aria-checked={settings.autoPlayNext}
              onClick={() => handleUpdate("autoPlayNext", !settings.autoPlayNext)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-[var(--border-w)] border-[var(--border-color)] ${
                settings.autoPlayNext
                  ? "bg-[var(--primary)]"
                  : "bg-[var(--tag-bg)]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.autoPlayNext ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] p-6">
        <SectionHeader title="Notifications" saved={savedKey === "emailDigest"} />
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-[var(--text-3)] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--text-1)]">
                Email Digest
              </p>
              <p className="text-xs text-[var(--text-3)] mt-0.5">
                Weekly summary of new podcasts
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-[var(--radius)] bg-[var(--tag-bg)] text-[var(--text-3)] border-[1.5px] border-[var(--border-color)]">
                Coming soon
              </span>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={settings.emailDigest}
            onClick={() => handleUpdate("emailDigest", !settings.emailDigest)}
            disabled
            className={`relative w-11 h-6 rounded-full transition-colors cursor-not-allowed opacity-50 border-[var(--border-w)] border-[var(--border-color)] ${
              settings.emailDigest
                ? "bg-[var(--primary)]"
                : "bg-[var(--tag-bg)]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                settings.emailDigest ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </section>
    </div>
  );
}
