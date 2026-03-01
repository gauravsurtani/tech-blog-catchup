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
          className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin"
          aria-label="Loading interests"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
        What interests you?
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
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
                inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-full)] border-2 text-sm font-medium transition-all cursor-pointer
                ${
                  isSelected
                    ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                    : "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)]"
                }
              `}
            >
              {isSelected && <Check className="w-3.5 h-3.5" />}
              {tag.name}
              <span
                className={`text-xs ${
                  isSelected ? "text-[var(--color-accent-text)]/70" : "text-[var(--color-text-muted)]"
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
