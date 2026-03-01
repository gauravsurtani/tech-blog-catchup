"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, SkipForward } from "lucide-react";
import Logo from "@/components/Logo";
import SourceSelector from "./SourceSelector";
import InterestSelector from "./InterestSelector";

const TOTAL_STEPS = 3;

const STORAGE_KEY_COMPLETED = "tbc-onboarding-completed";
const STORAGE_KEY_PREFERENCES = "tbc-user-preferences";

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const finish = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_COMPLETED, "true");
    localStorage.setItem(
      STORAGE_KEY_PREFERENCES,
      JSON.stringify({ sources: selectedSources, tags: selectedTags })
    );
    router.push("/");
  }, [selectedSources, selectedTags, router]);

  const skip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY_COMPLETED, "true");
    localStorage.setItem(
      STORAGE_KEY_PREFERENCES,
      JSON.stringify({ sources: [], tags: [] })
    );
    router.push("/");
  }, [router]);

  const next = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }, [step, finish]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-[var(--color-bg-primary)]">
      <div className="w-full max-w-lg flex flex-col items-center">
        {/* Progress dots */}
        <div className="flex items-center gap-2 mb-10">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === step
                  ? "bg-[var(--color-accent)]"
                  : i < step
                    ? "bg-[var(--color-accent)]/40"
                    : "bg-[var(--color-bg-tertiary)]"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="w-full min-h-[340px] flex flex-col items-center">
          {step === 0 && (
            <div className="flex flex-col items-center text-center gap-6">
              <Logo variant="icon" className="w-16 h-16 text-[var(--color-accent)]" />
              <div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
                  Welcome to Tech Blog Catchup
                </h1>
                <p className="text-[var(--color-text-secondary)] leading-relaxed max-w-md">
                  Stay on top of engineering blogs from the world&apos;s best tech companies.
                  We turn long-form articles into bite-sized conversational podcasts so you
                  can listen on the go.
                </p>
              </div>
              <button
                onClick={next}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-text)] font-semibold rounded-[var(--radius-lg)] transition-colors cursor-pointer"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 1 && (
            <SourceSelector selected={selectedSources} onChange={setSelectedSources} />
          )}

          {step === 2 && (
            <InterestSelector selected={selectedTags} onChange={setSelectedTags} />
          )}
        </div>

        {/* Bottom navigation (steps 1 and 2 only) */}
        {step > 0 && (
          <div className="w-full flex items-center justify-between mt-8 pt-6 border-t border-[var(--color-border)]">
            <button
              onClick={skip}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </button>
            <button
              onClick={next}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-accent-text)] font-medium rounded-[var(--radius-lg)] transition-colors cursor-pointer"
            >
              {step === TOTAL_STEPS - 1 ? "Finish" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Skip on welcome screen */}
        {step === 0 && (
          <button
            onClick={skip}
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
            Skip setup
          </button>
        )}
      </div>
    </div>
  );
}
