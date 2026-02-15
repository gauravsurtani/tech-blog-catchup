"use client";

import { useGenerationStatus } from "@/hooks/useGenerationStatus";

export default function GenerationBanner() {
  const { isGenerating, activeJob } = useGenerationStatus();

  if (!isGenerating || !activeJob) return null;

  return (
    <div className="bg-indigo-900/60 border-b border-indigo-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3 text-sm text-indigo-200">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-400" />
        </span>
        <span>
          Generating podcasts&hellip; (Job #{activeJob.id} running)
        </span>
      </div>
    </div>
  );
}
