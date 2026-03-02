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
    <div className="flex gap-2 border-b-[var(--border-w)] border-[var(--border-color)] pb-2">
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = activeTab === key;
        const count = counts[key];
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative cursor-pointer rounded-[var(--radius)] ${
              isActive
                ? "bg-[var(--primary)] text-[var(--primary-text)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] font-bold"
                : "text-[var(--text-3)] hover:text-[var(--text-1)] border-[var(--border-w)] border-transparent"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
            {count > 0 && (
              <span
                className={`text-xs rounded-[var(--radius-full)] px-1.5 py-0.5 min-w-[1.25rem] text-center font-semibold ${
                  isActive
                    ? "bg-[var(--primary-text)]/20 text-[var(--primary-text)]"
                    : "bg-[var(--tag-bg)] text-[var(--text-3)]"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
