"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { getJobs } from "@/lib/api";
import type { Job } from "@/lib/types";

const POLL_INTERVAL_MS = 5_000;

interface GenerationStatus {
  isGenerating: boolean;
  activeJob: Job | null;
}

export function useGenerationStatus(): GenerationStatus {
  const { status } = useSession();
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    async function poll() {
      try {
        const jobs = await getJobs({ job_type: "generate" });
        if (cancelled) return;
        setActiveJob(jobs.find(j => ["queued", "running", "retrying"].includes(j.status)) ?? null);
      } catch {
        if (!cancelled) setActiveJob(null);
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
  }, [status]);

  return {
    isGenerating: activeJob !== null,
    activeJob,
  };
}
