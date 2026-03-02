"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface TranscriptPanelProps {
  fullText: string;
  currentTime: number;
  duration: number;
}

interface Paragraph {
  text: string;
  startTime: number;
  endTime: number;
}

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

function mapParagraphsToTimeRanges(
  paragraphs: string[],
  duration: number,
): Paragraph[] {
  if (paragraphs.length === 0 || duration <= 0) return [];

  // Weight each paragraph by character count for proportional time mapping
  const totalChars = paragraphs.reduce((sum, p) => sum + p.length, 0);
  if (totalChars === 0) return [];

  let cursor = 0;
  return paragraphs.map((text) => {
    const fraction = text.length / totalChars;
    const startTime = cursor;
    const endTime = cursor + fraction * duration;
    cursor = endTime;
    return { text, startTime, endTime };
  });
}

function findActiveParagraphIndex(
  paragraphs: Paragraph[],
  currentTime: number,
): number {
  for (let i = paragraphs.length - 1; i >= 0; i--) {
    if (currentTime >= paragraphs[i].startTime) {
      return i;
    }
  }
  return 0;
}

export default function TranscriptPanel({
  fullText,
  currentTime,
  duration,
}: TranscriptPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const [userScrolled, setUserScrolled] = useState(false);
  const [prevActiveIndex, setPrevActiveIndex] = useState(-1);
  const isAutoScrollingRef = useRef(false);

  const rawParagraphs = splitIntoParagraphs(fullText);
  const paragraphs = mapParagraphsToTimeRanges(rawParagraphs, duration);
  const activeIndex = findActiveParagraphIndex(paragraphs, currentTime);

  // Detect manual scroll — pause auto-scroll
  const handleScroll = useCallback(() => {
    if (isAutoScrollingRef.current) return;
    setUserScrolled(true);
  }, []);

  // Re-enable auto-scroll when active paragraph changes (adjust state during render)
  if (activeIndex !== prevActiveIndex) {
    setPrevActiveIndex(activeIndex);
    setUserScrolled(false);
  }

  // Auto-scroll to active paragraph
  useEffect(() => {
    if (userScrolled) return;
    const el = paragraphRefs.current[activeIndex];
    if (!el) return;

    isAutoScrollingRef.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Reset the auto-scrolling flag after animation settles
    const timer = setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 500);

    return () => clearTimeout(timer);
  }, [activeIndex, userScrolled]);

  if (paragraphs.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ color: "var(--text-3)" }}
      >
        <p className="text-sm">No transcript available for this post.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="overflow-y-auto h-full px-6 py-4 space-y-0 bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)]"
      style={{ scrollbarWidth: "thin" }}
    >
      {paragraphs.map((para, i) => {
        const isActive = i === activeIndex;
        const isLast = i === paragraphs.length - 1;
        return (
          <p
            key={i}
            ref={(el) => {
              paragraphRefs.current[i] = el;
            }}
            className={`text-sm leading-relaxed transition-all duration-300 ease-in-out px-3 py-3 ${
              !isLast ? "border-b-[1px] border-[var(--split)]" : ""
            } ${
              isActive ? "bg-[var(--primary-bg)] border-l-[3px] border-l-[var(--primary)]" : ""
            }`}
            style={{
              color: isActive
                ? "var(--text-1)"
                : "var(--text-3)",
              fontWeight: isActive ? 500 : 400,
            }}
          >
            {para.text}
          </p>
        );
      })}
    </div>
  );
}
