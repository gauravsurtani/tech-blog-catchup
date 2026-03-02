"use client";

import type { Tag } from "@/lib/types";

interface TagFilterProps {
  tags: Tag[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function TagFilter({
  tags,
  selected,
  onChange,
}: TagFilterProps) {
  function handleToggle(slug: string) {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else {
      onChange([...selected, slug]);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[var(--text-2)] uppercase tracking-wide">
        Tags
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selected.includes(tag.slug);
          return (
            <button
              key={tag.slug}
              onClick={() => handleToggle(tag.slug)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-full)] text-sm font-bold border-[1.5px] transition-colors cursor-pointer nb-hover ${
                isSelected
                  ? "bg-[var(--primary)] text-[var(--primary-text)] border-[var(--border-color)] shadow-[var(--shadow-sm)]"
                  : "bg-[var(--tag-bg)] text-[var(--text-2)] border-[var(--border-color)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)]"
              }`}
            >
              <span>{tag.name}</span>
              <span
                className={`text-xs ${
                  isSelected ? "text-[var(--primary-text)]" : "text-[var(--text-3)]"
                }`}
              >
                {tag.post_count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
