"use client";

import { useGenerationStatus } from "@/hooks/useGenerationStatus";

export default function GenerationBanner() {
  const { isGenerating, activeJob } = useGenerationStatus();

  if (!isGenerating || !activeJob) return null;

  return (
    <div className="bg-[var(--primary)] text-[var(--primary-text)] border-b-[var(--border-w)] border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3 text-sm font-bold">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-[var(--primary-text)] opacity-75 border-[1.5px] border-[var(--border-color)]" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--primary-text)] border-[1.5px] border-[var(--border-color)]" />
        </span>
        <span>
          Generating podcasts&hellip; (Job #{activeJob.id} running)
        </span>
      </div>
    </div>
  );
}
