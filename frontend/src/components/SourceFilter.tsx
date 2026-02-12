"use client";

import type { Source } from "@/lib/types";

interface SourceFilterProps {
  sources: Source[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function SourceFilter({
  sources,
  selected,
  onChange,
}: SourceFilterProps) {
  const allSelected = selected.length === sources.length;
  const noneSelected = selected.length === 0;

  function handleToggle(key: string) {
    if (selected.includes(key)) {
      onChange(selected.filter((s) => s !== key));
    } else {
      onChange([...selected, key]);
    }
  }

  function handleSelectAll() {
    onChange(sources.map((s) => s.key));
  }

  function handleClear() {
    onChange([]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Sources
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            disabled={allSelected}
            className="text-xs text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Select All
          </button>
          <span className="text-gray-700">|</span>
          <button
            onClick={handleClear}
            disabled={noneSelected}
            className="text-xs text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="space-y-1">
        {sources.map((source) => (
          <label
            key={source.key}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-800/60 transition-colors cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={selected.includes(source.key)}
              onChange={() => handleToggle(source.key)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-sm text-gray-300 group-hover:text-gray-100 flex-1 truncate">
              {source.name}
            </span>
            <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded-full font-medium">
              {source.post_count}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
