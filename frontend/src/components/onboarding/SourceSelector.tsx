"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { Source } from "@/lib/types";
import { getSources } from "@/lib/api";

interface SourceSelectorProps {
  selected: string[];
  onChange: (sources: string[]) => void;
}

export default function SourceSelector({ selected, onChange }: SourceSelectorProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSources()
      .then(setSources)
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  }, []);

  function toggle(key: string) {
    if (selected.includes(key)) {
      onChange(selected.filter((s) => s !== key));
    } else {
      onChange([...selected, key]);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="w-8 h-8 border-[var(--border-w)] border-[var(--primary)] border-t-transparent rounded-full animate-spin"
          aria-label="Loading sources"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-extrabold text-[var(--text-1)] mb-2">
        Pick your favorite sources
      </h2>
      <p className="text-sm text-[var(--text-2)] mb-6">
        Select the engineering blogs you want to follow. You can change these later.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sources.map((source) => {
          const isSelected = selected.includes(source.key);
          return (
            <button
              key={source.key}
              type="button"
              onClick={() => toggle(source.key)}
              className={`
                nb-hover relative flex flex-col items-start gap-1 p-4 rounded-[var(--radius-lg)] border-[var(--border-w)] transition-all cursor-pointer text-left shadow-[var(--shadow-sm)]
                ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                    : "border-[var(--border-color)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]"
                }
              `}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--primary)] border-[var(--border-w)] border-[var(--border-color)] flex items-center justify-center">
                  <Check className="w-3 h-3 text-[var(--primary-text)]" />
                </span>
              )}
              <span className="text-sm font-medium text-[var(--text-1)] leading-tight">
                {source.name}
              </span>
              <span className="text-xs text-[var(--text-3)]">
                {source.post_count} {source.post_count === 1 ? "post" : "posts"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
