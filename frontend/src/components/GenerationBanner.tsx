"use client";

import { useState, useCallback } from "react";
import { X } from "lucide-react";
import { useGenerationStatus } from "@/hooks/useGenerationStatus";

export default function GenerationBanner() {
  const { isGenerating, activeJob } = useGenerationStatus();
  const [dismissedJobId, setDismissedJobId] = useState<number | null>(null);

  const dismissed = activeJob ? dismissedJobId === activeJob.id : false;

  const handleDismiss = useCallback(() => {
    if (activeJob) setDismissedJobId(activeJob.id);
  }, [activeJob]);

  if (!isGenerating || !activeJob || dismissed) return null;

  return (
    <div className="bg-[var(--primary)] text-[var(--primary-text)] border-b-[var(--border-w)] border-[var(--border-color)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3 text-sm font-bold">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-[var(--primary-text)] opacity-75 border-[1.5px] border-[var(--border-color)]" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--primary-text)] border-[1.5px] border-[var(--border-color)]" />
        </span>
        <span className="flex-1">
          Generating podcasts&hellip; (Job #{activeJob.id} running)
        </span>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="shrink-0 p-1 rounded-[var(--radius)] text-[var(--primary-text)] hover:bg-white/20 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
