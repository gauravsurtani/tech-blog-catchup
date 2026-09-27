"use client";

import { useEffect, useRef, type ReactNode } from "react";
import "./landing-scroll.css";

export default function LandingScroll({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-scroll-card]"));
    const notes = Array.from(root.querySelectorAll<HTMLElement>("[data-scroll-note]"));
    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-progress-step]"));
    const footer = root.closest(".site")?.querySelector<HTMLElement>(".site-footer[data-home-footer]");
    const signoff = footer?.querySelector<HTMLElement>(".footer-signoff");
    const targets = [...cards, ...notes, ...(signoff ? [signoff] : [])];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const positions = new Map<HTMLElement, number>();
    let frame = 0;
    let disposed = false;

    // Layout offsets exclude the transforms we apply, so scrolling never feeds
    // the previous animation frame back into its own progress calculation.
    function measure() {
      for (const target of targets) {
        let top = 0;
        let node: HTMLElement | null = target;
        while (node) {
          top += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        positions.set(target, top);
      }
      schedule();
    }

    function paint() {
      frame = 0;
      const height = window.innerHeight;
      const scroll = window.scrollY;
      const reduced = motion.matches;
      root!.dataset.scrollMotion = reduced ? "reduced" : "active";
      if (footer) footer.dataset.scrollMotion = reduced ? "reduced" : "active";
      for (const target of targets) {
        const delay = target === notes[1] && window.innerWidth > 760 ? height * .1 : 0;
        const top = (positions.get(target) ?? 0) - scroll + delay;
        const focused = target.contains(document.activeElement);
        const progress = reduced || focused ? 1 : Math.max(0, Math.min(1, (height * .95 - top) / (height * .47)));
        const eased = 1 - (1 - progress) ** 3;
        target.style.setProperty("--reveal", eased.toFixed(4));
      }
      let active = 0;
      cards.forEach((card, index) => {
        if ((positions.get(card) ?? 0) - scroll < height * .6) active = index;
      });
      steps.forEach((step, index) => {
        step.dataset.active = String(index === active);
        step.dataset.complete = String(index < active);
      });
    }

    function schedule() {
      if (!disposed && !frame) frame = window.requestAnimationFrame(paint);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(root);
    if (footer) observer.observe(footer);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    document.addEventListener("focusin", schedule);
    document.addEventListener("focusout", schedule);
    motion.addEventListener("change", schedule);
    document.fonts.ready.then(() => { if (!disposed) measure(); });
    measure();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      document.removeEventListener("focusin", schedule);
      document.removeEventListener("focusout", schedule);
      motion.removeEventListener("change", schedule);
      delete root.dataset.scrollMotion;
      if (footer) delete footer.dataset.scrollMotion;
      targets.forEach((target) => target.style.removeProperty("--reveal"));
      steps.forEach((step) => { delete step.dataset.active; delete step.dataset.complete; });
    };
  }, []);

  return <div ref={rootRef} className="landing-scroll">{children}</div>;
}
