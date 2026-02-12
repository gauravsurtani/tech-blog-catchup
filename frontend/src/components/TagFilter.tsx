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
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
        Tags
      </h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selected.includes(tag.slug);
          return (
            <button
              key={tag.slug}
              onClick={() => handleToggle(tag.slug)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                isSelected
                  ? "bg-blue-600/30 text-blue-300 border-blue-500/50 hover:bg-blue-600/40"
                  : "bg-gray-800/60 text-gray-400 border-gray-700/50 hover:bg-gray-800 hover:text-gray-300"
              }`}
            >
              <span>{tag.name}</span>
              <span
                className={`text-xs ${
                  isSelected ? "text-blue-400" : "text-gray-600"
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
