"use client";

import { FileSearch, Scroll, AudioLines } from "lucide-react";
import SubmitForm from "@/components/SubmitForm";

const steps = [
  {
    icon: FileSearch,
    title: "Extract",
    description: "We fetch and parse the article content from the URL or your pasted text.",
  },
  {
    icon: Scroll,
    title: "Script",
    description: "An AI generates a conversational podcast script with two hosts.",
  },
  {
    icon: AudioLines,
    title: "Audio",
    description: "Text-to-speech creates a natural-sounding podcast episode for you.",
  },
];

export default function SubmitPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-[var(--text-1)] mb-2">
          Podcastify
        </h1>
        <p className="text-[var(--text-2)] text-base">
          Turn any article into a podcast
        </p>
      </div>

      {/* Submit form */}
      <SubmitForm />

      {/* How it works */}
      <div className="mt-12">
        <h2 className="text-lg font-bold text-[var(--text-1)] text-center mb-6">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {steps.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] p-5 text-center"
            >
              <div className="flex items-center justify-center w-10 h-10 mx-auto mb-3 rounded-[var(--radius)] bg-[var(--primary)]/10 text-[var(--primary)]">
                <Icon size={22} />
              </div>
              <p className="text-xs text-[var(--text-3)] font-semibold uppercase tracking-wide mb-1">
                Step {i + 1}
              </p>
              <p className="text-sm font-bold text-[var(--text-1)] mb-1">
                {title}
              </p>
              <p className="text-xs text-[var(--text-2)] leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
