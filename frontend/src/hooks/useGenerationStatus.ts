"use client";

import { useState, useEffect, useRef } from "react";
import { getJobs } from "@/lib/api";
import type { Job } from "@/lib/types";

const POLL_INTERVAL_MS = 5_000;

interface GenerationStatus {
  isGenerating: boolean;
  activeJob: Job | null;
}

export function useGenerationStatus(): GenerationStatus {
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const jobs = await getJobs({ job_type: "generate", status: "running" });
        if (cancelled) return;
        setActiveJob(jobs.length > 0 ? jobs[0] : null);
      } catch {
        // Silently ignore polling errors to avoid spamming the user
      }
    }

    // Initial fetch
    poll();

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isGenerating: activeJob !== null,
    activeJob,
  };
}
