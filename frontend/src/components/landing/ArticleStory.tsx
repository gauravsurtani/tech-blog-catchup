"use client";
import { useEffect, useState } from "react";
const steps = [
  {
    name: "Source",
    title: "One article. A clear starting point.",
    body: "Start with text you have permission to use. Keep its title and original link attached.",
    line: "A cache keeps recently used data close to the application.",
    label: "Example article · written for this demonstration",
  },
  {
    name: "Outline",
    title: "Keep the ideas that matter.",
    body: "The text model drafts a summary and conversation. Names, numbers and caveats should remain faithful to the source.",
    line: "Key idea: reuse data. Caveat: cached data can become stale.",
    label: "Summary + supporting source quotations",
  },
  {
    name: "Conversation",
    title: "Give the explanation two voices.",
    body: "One speaker explains. The other asks questions. A speech model renders each turn and records its timing.",
    line: "“Why not always use a cache?” “Because freshness matters, too.”",
    label: "Speaker one / Speaker two",
  },
  {
    name: "Episode",
    title: "Listen. Then follow the source.",
    body: "Preview the private draft, check the claims and listen to the audio. An administrator decides what enters the public library.",
    line: "A short explanation, with a path back to the original.",
    label: "Private preview → review → public episode",
  },
];
export default function ArticleStory() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(q.matches);
      if (q.matches) setPlaying(false);
    };
    update();
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!playing || reduced) return;
    const t = setInterval(
      () =>
        setStep((s) => {
          if (s === 3) {
            setPlaying(false);
            return 3;
          }
          return s + 1;
        }),
      4200,
    );
    return () => clearInterval(t);
  }, [playing, reduced]);
  const current = steps[step];
  return (
    <section className="article-story" aria-label="How Blog2Podcast works">
      <div className="story-top">
        <span>Product walkthrough</span>
        <span>Illustrative demo, no live generation</span>
      </div>
      <div
        className={`story-stage step-${step} ${playing ? "is-playing" : ""}`}
      >
        <div className="source-sheet" aria-hidden="true">
          <div className="sheet-icon">B</div>
          <i />
          <i />
          <i />
          <i />
          <div className="sheet-block" />
          <i />
          <i />
        </div>
        <div className="story-track" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="story-note">
          <small>{current.label}</small>
          <p>{current.line}</p>
        </div>
      </div>
      <div className="story-content" aria-live="polite">
        <h2>{current.title}</h2>
        <p>{current.body}</p>
      </div>
      <div className="story-controls">
        <div role="group" aria-label="Walkthrough steps">
          {steps.map((s, i) => (
            <button
              key={s.name}
              aria-pressed={step === i}
              onClick={() => {
                setPlaying(false);
                setStep(i);
              }}
            >
              <span>{i + 1}</span>
              {s.name}
            </button>
          ))}
        </div>
        <button
          className="story-play"
          onClick={() => {
            if (reduced) {
              setStep((s) => (s + 1) % 4);
              return;
            }
            if (step === 3) setStep(0);
            setPlaying((p) => !p);
          }}
        >
          {reduced
            ? "Next step"
            : playing
              ? "Pause"
              : step === 3
                ? "Replay"
                : "Play demo"}
        </button>
      </div>
    </section>
  );
}
