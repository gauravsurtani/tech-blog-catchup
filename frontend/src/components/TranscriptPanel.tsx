"use client";
import { useEffect, useRef, useState } from "react";
type Turn = {
  speaker: string;
  text: string;
  start_sample: number;
  end_sample: number;
};
export default function TranscriptPanel({
  fullText,
  currentTime,
  turns,
  sampleRate = 24000,
}: {
  fullText: string;
  currentTime: number;
  duration: number;
  turns?: Turn[];
  sampleRate?: number;
}) {
  const [following, setFollowing] = useState(true);
  const activeRef = useRef<HTMLParagraphElement>(null);
  const active =
    turns?.findIndex(
      (t) =>
        currentTime * sampleRate >= t.start_sample &&
        currentTime * sampleRate < t.end_sample,
    ) ?? -1;
  useEffect(() => {
    if (following && active >= 0)
      activeRef.current?.scrollIntoView({ block: "nearest", behavior: "auto" });
  }, [active, following]);
  if (!turns?.length)
    return (
      <div className="h-full overflow-y-auto p-5" tabIndex={0}>
        <p className="text-sm mb-4">
          Text without synchronized timing.
        </p>
        <p className="whitespace-pre-wrap">{fullText}</p>
      </div>
    );
  return (
    <div
      className="h-full overflow-y-auto p-5"
      tabIndex={0}
      role="region"
      aria-label="Timed transcript"
      onPointerDown={(event) => { if (event.target === event.currentTarget) setFollowing(false); }}
      onWheel={() => setFollowing(false)}
      onTouchMove={() => setFollowing(false)}
      onKeyDown={(e) => {
        if (["ArrowDown", "PageDown", "ArrowUp", "PageUp"].includes(e.key))
          setFollowing(false);
      }}
    >
      <button onClick={() => setFollowing((p) => !p)}>
        {following ? "Pause following" : "Follow playback"}
      </button>
      {turns.map((t, i) => (
        <p
          key={i}
          ref={i === active ? activeRef : undefined}
          className={`my-4 p-3 rounded ${i === active ? "bg-blue-500/15" : ""}`}
        >
          <strong>
            {t.speaker === "Person1" ? "Speaker one" : "Speaker two"}
          </strong>
          <br />
          {t.text}
        </p>
      ))}
    </div>
  );
}
