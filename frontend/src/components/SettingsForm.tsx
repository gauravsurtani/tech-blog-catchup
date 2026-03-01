"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Bell } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import type { Settings } from "@/hooks/useSettings";
import { useEffect } from "react";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];

const THEME_OPTIONS: { value: Settings["theme"]; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <Sun className="w-5 h-5" /> },
  { value: "dark", label: "Dark", icon: <Moon className="w-5 h-5" /> },
  { value: "system", label: "System", icon: <Monitor className="w-5 h-5" /> },
];

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <div className="mt-2 h-px bg-[var(--color-border)]" />
    </div>
  );
}

export default function SettingsForm() {
  const { settings, updateSetting } = useSettings();
  const { setTheme } = useTheme();

  // Sync theme setting with next-themes
  useEffect(() => {
    setTheme(settings.theme);
  }, [settings.theme, setTheme]);

  return (
    <div className="max-w-2xl space-y-8">
      {/* Theme Section */}
      <section>
        <SectionHeader title="Appearance" />
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map((option) => {
            const selected = settings.theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => updateSetting("theme", option.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-[var(--radius-lg)] border transition-colors cursor-pointer ${
                  selected
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)]"
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
      <section>
        <SectionHeader title="Playback" />
        <div className="space-y-5">
          {/* Default Speed */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">Default Speed</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Applied when starting a new podcast
              </p>
            </div>
            <select
              value={settings.defaultSpeed}
              onChange={(e) => updateSetting("defaultSpeed", parseFloat(e.target.value))}
              className="px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent)] cursor-pointer"
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
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                Auto-play Next
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Automatically play the next podcast in queue
              </p>
            </div>
            <button
              role="switch"
              aria-checked={settings.autoPlayNext}
              onClick={() => updateSetting("autoPlayNext", !settings.autoPlayNext)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                settings.autoPlayNext
                  ? "bg-[var(--color-accent)]"
                  : "bg-[var(--color-bg-tertiary)]"
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
      <section>
        <SectionHeader title="Notifications" />
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-[var(--color-text-muted)] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                Email Digest
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Weekly summary of new podcasts
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-[var(--radius-sm)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                Coming soon
              </span>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={settings.emailDigest}
            onClick={() => updateSetting("emailDigest", !settings.emailDigest)}
            disabled
            className={`relative w-11 h-6 rounded-full transition-colors cursor-not-allowed opacity-50 ${
              settings.emailDigest
                ? "bg-[var(--color-accent)]"
                : "bg-[var(--color-bg-tertiary)]"
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
