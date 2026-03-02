"use client";

import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselProps {
  title: string;
  seeAllHref?: string;
  children: ReactNode;
}

export default function Carousel({ title, seeAllHref, children }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState]);

  function scroll(direction: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild
      ? el.firstElementChild.getBoundingClientRect().width + 16
      : 300;
    const distance = cardWidth * 2;
    el.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  }

  return (
    <section className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[var(--text-1)]">{title}</h2>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="text-sm text-[var(--text-2)] hover:text-[var(--primary)] transition-colors"
          >
            See all
          </Link>
        )}
      </div>

      {/* Scroll container */}
      <div className="relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 items-center justify-center rounded-[var(--radius)] bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] shadow-[var(--shadow-sm)] nb-hover transition-all cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 items-center justify-center rounded-[var(--radius)] bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] shadow-[var(--shadow-sm)] nb-hover transition-all cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Cards */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {children}
        </div>
      </div>
    </section>
  );
}
