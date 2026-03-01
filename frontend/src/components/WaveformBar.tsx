"use client";

import { useCallback, useRef, useState, useMemo } from "react";

const BAR_COUNT = 64;

function generateBars(seed: number): number[] {
  let s = seed | 0;
  const bars: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    bars.push(0.15 + r * 0.85);
  }
  return bars;
}

interface WaveformBarProps {
  postId: number;
  progress: number;
  onSeek: (fraction: number) => void;
  height?: number;
  activeColor?: string;
  inactiveColor?: string;
  className?: string;
}

export default function WaveformBar({
  postId,
  progress,
  onSeek,
  height = 24,
  activeColor = "rgb(34 197 94)",
  inactiveColor = "rgb(55 65 81)",
  className = "",
}: WaveformBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const bars = useMemo(() => generateBars(postId), [postId]);

  const getFraction = useCallback((clientX: number): number => {
    const el = containerRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsDragging(true);
      onSeek(getFraction(e.clientX));

      const handleMouseMove = (ev: MouseEvent) => {
        onSeek(getFraction(ev.clientX));
      };
      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [onSeek, getFraction],
  );

  const gap = 2;

  return (
    <div
      ref={containerRef}
      className={`cursor-pointer select-none ${className}`}
      style={{ height, position: "relative" }}
      onMouseDown={handleMouseDown}
    >
      <svg
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        viewBox={`0 0 ${BAR_COUNT * 10} ${height}`}
        aria-label="Waveform progress"
        role="progressbar"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {bars.map((h, i) => {
          const barH = h * height;
          const y = (height - barH) / 2;
          const x = i * 10;
          const w = 10 - gap;
          const fraction = (i + 0.5) / BAR_COUNT;
          const filled = fraction <= progress;

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={w}
              height={barH}
              rx={1.5}
              fill={filled ? activeColor : inactiveColor}
              style={{
                transition: isDragging ? "none" : "fill 0.1s ease",
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
