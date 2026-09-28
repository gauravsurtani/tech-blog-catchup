"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createTimeline } from "animejs";
import { Play, Pause, RotateCcw } from "lucide-react";
import {
  CHAPTERS,
  DURATION,
  drawWordSound,
  type MotionPalette,
} from "./word-sound-renderer";
import "./word-to-sound.css";

const descriptions = [
  "Start with permitted source text. Keep its meaning and its caveats.",
  "Build the outline from the source. Useful data and freshness belong in the same explanation.",
  "Give the script two voices: one explains, the other asks. Each turn becomes speech.",
  "Listen to the private preview and check the source. Publication requires human review.",
];
const phaseAt = (time: number) =>
  time < 5000 ? 0 : time < 10000 ? 1 : time < 16000 ? 2 : 3;
const mediaQuery = "(prefers-reduced-motion: reduce)";
function subscribeReduced(callback: () => void) {
  const query = window.matchMedia(mediaQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
interface Controls {
  toggle: () => void;
  chapter: (index: number) => void;
  seek: (time: number) => void;
}

export default function WordToSound() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const slider = useRef<HTMLInputElement>(null);
  const timeLabel = useRef<HTMLSpanElement>(null);
  const controls = useRef<Controls | null>(null);
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const reduced = useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(mediaQuery).matches,
    () => false,
  );
  const descriptionId = useId();

  useEffect(() => {
    const element = root.current,
      surface = canvas.current,
      container = stage.current;
    if (!element || !surface || !container) return;
    const context = surface.getContext("2d");
    if (!context) return;
    let disposed = false,
      visible = false,
      ready = false;
    const reducedNow = window.matchMedia(mediaQuery).matches;
    let intent = !reducedNow;
    const startTime = reducedNow ? CHAPTERS[0].at : 0;
    let activePhase = -1,
      clockTime = startTime;
    let completed: boolean | null = null;
    let width = 0,
      height = 0;
    const clock = { time: 0 };
    const getPalette = (): MotionPalette => {
      const css = getComputedStyle(element);
      return {
        background: css.getPropertyValue("--bg").trim(),
        foreground: css.getPropertyValue("--text-1").trim(),
        muted: css.getPropertyValue("--text-2").trim(),
        accent: css.getPropertyValue("--primary").trim(),
        line: css.getPropertyValue("--border-color").trim(),
      };
    };
    let palette = getPalette();
    const render = (time: number) => {
      if (disposed || !width || !height) return;
      clockTime = time;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      drawWordSound(context, width, height, time, palette);
      const isComplete = time >= DURATION;
      if (isComplete !== completed) {
        completed = isComplete;
        setEnded(isComplete);
      }
      const next = phaseAt(time);
      if (next !== activePhase) {
        activePhase = next;
        setPhase(next);
      }
      element.dataset.timeMs = String(Math.round(time));
      element.dataset.chapter = CHAPTERS[next].label;
      if (slider.current) slider.current.value = String(time);
      if (timeLabel.current)
        timeLabel.current.textContent = `${(time / 1000).toFixed(1)} / ${DURATION / 1000}s`;
    };
    const timeline = createTimeline({
      autoplay: false,
      onUpdate: (self) => render(self.currentTime),
      onComplete: () => {
        if (!disposed) {
          intent = false;
          setPlaying(false);
          setEnded(true);
          element.dataset.playing = "false";
        }
      },
    }).add(
      clock,
      { time: [0, DURATION], duration: DURATION, ease: "linear" },
      0,
    );
    const resize = () => {
      if (disposed) return;
      const bounds = container.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.max(1, Math.round(width * pixelRatio));
      surface.height = Math.max(1, Math.round(height * pixelRatio));
      render(clockTime);
    };
    const sync = () => {
      if (disposed) return;
      const canPlay =
        intent &&
        visible &&
        ready &&
        !document.hidden &&
        !window.matchMedia(mediaQuery).matches;
      if (canPlay) timeline.play();
      else timeline.pause();
      element.dataset.playing = String(canPlay);
      setPlaying(canPlay);
    };
    const seek = (time: number) => {
      intent = false;
      timeline.pause();
      const bounded = Math.max(0, Math.min(DURATION, time));
      timeline.seek(bounded, true);
      render(bounded);
      setPlaying(false);
      setEnded(bounded === DURATION);
      element.dataset.playing = "false";
    };
    controls.current = {
      seek,
      chapter: (index) => seek(CHAPTERS[index].at),
      toggle: () => {
        if (intent && !timeline.paused) {
          intent = false;
          sync();
          return;
        }
        if (timeline.currentTime >= DURATION) {
          timeline.seek(0, true);
          render(0);
          setEnded(false);
        }
        intent = true;
        sync();
      },
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const themeObserver = new MutationObserver(() => {
      palette = getPalette();
      render(clockTime);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    const intersection = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        sync();
      },
      { threshold: 0.15 },
    );
    intersection.observe(element);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("resize", resize);
    resize();
    timeline.seek(startTime, true);
    render(startTime);
    document.fonts.ready.then(() => {
      if (!disposed) {
        ready = true;
        render(clockTime);
        sync();
      }
    });
    return () => {
      disposed = true;
      controls.current = null;
      timeline.revert();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  return (
    <section
      className="word-sound"
      ref={root}
      aria-label="Words into sound"
      aria-describedby={descriptionId}
    >
      <div className="word-sound__eyeline">
        <span>Words into sound</span>
        <span>Illustrative demo, no live generation</span>
      </div>
      <div className="word-sound__stage" ref={stage}>
        <canvas ref={canvas} aria-hidden="true" />
      </div>
      <div className="word-sound__transport">
        <button
          className="word-sound__play"
          onClick={() =>
            reduced
              ? controls.current?.chapter((phase + 1) % CHAPTERS.length)
              : controls.current?.toggle()
          }
        >
          {playing ? (
            <Pause size={15} />
          ) : ended ? (
            <RotateCcw size={15} />
          ) : (
            <Play size={15} />
          )}
          {reduced
            ? "Next step"
            : playing
              ? "Pause"
              : ended
                ? "Replay"
                : "Play demo"}
        </button>
        <label className="word-sound__seek">
          <span className="sr-only">Animation position</span>
          <input
            ref={slider}
            type="range"
            min={0}
            max={DURATION}
            step={100}
            defaultValue={CHAPTERS[0].at}
            onChange={(event) =>
              controls.current?.seek(Number(event.target.value))
            }
          />
        </label>
        <span ref={timeLabel} className="word-sound__time" aria-hidden="true">
          2.4 / 22s
        </span>
      </div>
      <div
        className="word-sound__chapters"
        role="group"
        aria-label="Walkthrough steps"
      >
        {CHAPTERS.map((chapter, index) => (
          <button
            key={chapter.label}
            onClick={() => controls.current?.chapter(index)}
            aria-pressed={phase === index}
          >
            <span>0{index + 1}</span>
            {chapter.label}
          </button>
        ))}
      </div>
      <div
        className="word-sound__description"
        id={descriptionId}
        aria-live="polite"
      >
        <h2>{CHAPTERS[phase].label}</h2>
        <p>{descriptions[phase]}</p>
      </div>
      <p className="word-sound__footnote">
        Original sample: “A cache keeps useful data close. The trade-off is
        freshness.” No audio autoplays.
      </p>
    </section>
  );
}
