"use client";
import { useEffect, useState } from "react";
import {
  FileText,
  ListChecks,
  AudioLines,
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Link2,
  Check,
  LockKeyhole,
} from "lucide-react";
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
      setPlaying(!q.matches);
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
        <span className="story-window-title">
          <AudioLines size={16} /> Inside Blog2Podcast
        </span>
        <span>Illustrative demo, no live generation</span>
      </div>
      <div
        className={`story-stage step-${step} ${playing ? "is-playing" : ""}`}
        aria-hidden="true"
      >
        <div className="story-grid" />
        <div className="stage-caption">
          <span className="stage-dot" />
          {
            [
              "Start with a source",
              "Find the key ideas",
              "Make it a conversation",
              "Preview before publishing",
            ][step]
          }
          <span className="stage-count">0{step + 1} / 04</span>
        </div>
        <div className="motion-source motion-object">
          <div className="object-top">
            <FileText size={16} />
            <span>Original article</span>
            <span className="paper-fold" />
          </div>
          <h3>
            A quick guide
            <br />
            to caching
          </h3>
          <p className="article-excerpt">
            <span className="highlight-one">
              Keep recently used data close.
            </span>
            <br />
            <span className="highlight-two">Remember it can become stale.</span>
          </p>
          <div className="paper-lines">
            <i />
            <i />
            <i />
          </div>
          <span className="source-credit">
            <Link2 size={12} /> Original source attached
          </span>
        </div>
        <div className="motion-outline motion-object">
          <div className="object-top">
            <ListChecks size={16} />
            <span>The useful bits</span>
          </div>
          <p>
            <Check size={15} /> Reuse recent data
          </p>
          <p>
            <Check size={15} /> Keep the caveat
          </p>
          <p>
            <Check size={15} /> Check the source
          </p>
        </div>
        <div className="motion-speakers motion-object">
          <div className="speaker-line speaker-one">
            <span className="speaker-avatar">01</span>
            <p>What does a cache do?</p>
          </div>
          <div className="speaker-line speaker-two">
            <p>
              Keeps useful data close.
              <br />
              But freshness still matters.
            </p>
            <span className="speaker-avatar">02</span>
          </div>
          <div className="speaker-tracks">
            <span>Voice 01</span>
            <div>
              {Array.from({ length: 23 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    height: `${20 + ((i * 17) % 74)}%`,
                    animationDelay: `${i * 37}ms`,
                  }}
                />
              ))}
            </div>
            <span>Voice 02</span>
            <div>
              {Array.from({ length: 23 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    height: `${18 + ((i * 23) % 77)}%`,
                    animationDelay: `${i * 53}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="motion-episode motion-object">
          <div className="episode-cover">
            <Headphones size={42} />
            <span>
              A quick guide
              <br />
              to caching
            </span>
          </div>
          <div className="episode-info">
            <span className="draft-chip">
              <LockKeyhole size={11} /> Private draft
            </span>
            <h3>
              Ready for
              <br />a closer listen.
            </h3>
            <div className="episode-wave">
              {Array.from({ length: 21 }, (_, i) => (
                <i key={i} style={{ height: `${18 + ((i * 19) % 78)}%` }} />
              ))}
            </div>
            <span className="episode-source">
              <Check size={12} /> Source · script · audio
            </span>
          </div>
        </div>
        <div className="motion-path">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="stage-footnote">
          Original example written for this demo. No audio autoplays.
        </div>
      </div>
      <div className="story-content" aria-live="polite">
        <h2>{current.title}</h2>
        <p>{current.body}</p>
        <p className="sr-only">
          {current.label}. {current.line}
        </p>
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
          {playing ? (
            <Pause size={14} />
          ) : step === 3 ? (
            <RotateCcw size={14} />
          ) : (
            <Play size={14} />
          )}
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
