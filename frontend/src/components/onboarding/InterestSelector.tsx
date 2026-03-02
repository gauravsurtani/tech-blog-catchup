"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import type { Tag } from "@/lib/types";
import { getTags } from "@/lib/api";

interface InterestSelectorProps {
  selected: string[];
  onChange: (tags: string[]) => void;
}

export default function InterestSelector({ selected, onChange }: InterestSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTags()
      .then(setTags)
      .catch(() => setTags([]))
      .finally(() => setLoading(false));
  }, []);

  function toggle(slug: string) {
    if (selected.includes(slug)) {
      onChange(selected.filter((t) => t !== slug));
    } else {
      onChange([...selected, slug]);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="w-8 h-8 border-[var(--border-w)] border-[var(--primary)] border-t-transparent rounded-full animate-spin"
          aria-label="Loading interests"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-extrabold text-[var(--text-1)] mb-2">
        What interests you?
      </h2>
      <p className="text-sm text-[var(--text-2)] mb-6">
        Choose topics to personalize your feed. You can update these anytime.
      </p>
      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => {
          const isSelected = selected.includes(tag.slug);
          return (
            <button
              key={tag.slug}
              type="button"
              onClick={() => toggle(tag.slug)}
              className={`
                nb-hover inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)] border-[var(--border-w)] text-sm font-semibold transition-all cursor-pointer
                ${
                  isSelected
                    ? "border-[var(--border-color)] bg-[var(--primary)] text-[var(--primary-text)] shadow-[var(--shadow-sm)]"
                    : "border-[var(--border-color)] bg-[var(--bg-elevated)] text-[var(--text-2)] hover:bg-[var(--bg-hover)]"
                }
              `}
            >
              {isSelected && <Check className="w-3.5 h-3.5" />}
              {tag.name}
              <span
                className={`text-xs ${
                  isSelected ? "text-[var(--primary-text)]/70" : "text-[var(--text-3)]"
                }`}
              >
                ({tag.post_count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
