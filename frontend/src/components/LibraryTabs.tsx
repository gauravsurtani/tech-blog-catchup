"use client";

import { Heart, ListMusic, History } from "lucide-react";

export type LibraryTab = "favorites" | "playlists" | "history";

interface LibraryTabsProps {
  activeTab: LibraryTab;
  onTabChange: (tab: LibraryTab) => void;
  counts: { favorites: number; playlists: number; history: number };
}

const TABS: { key: LibraryTab; label: string; icon: typeof Heart }[] = [
  { key: "favorites", label: "Favorites", icon: Heart },
  { key: "playlists", label: "Playlists", icon: ListMusic },
  { key: "history", label: "History", icon: History },
];

export default function LibraryTabs({ activeTab, onTabChange, counts }: LibraryTabsProps) {
  return (
    <div
      className="flex border-b"
      style={{ borderColor: "var(--color-border)" }}
    >
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = activeTab === key;
        const count = counts[key];
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative cursor-pointer"
            style={{
              color: isActive
                ? "var(--color-accent)"
                : "var(--color-text-muted)",
            }}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {count > 0 && (
              <span
                className="text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center"
                style={{
                  backgroundColor: isActive
                    ? "var(--color-accent)"
                    : "var(--color-bg-tertiary)",
                  color: isActive
                    ? "var(--color-accent-text)"
                    : "var(--color-text-muted)",
                }}
              >
                {count}
              </span>
            )}
            {isActive && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: "var(--color-accent)" }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
