"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "sidebar-collapsed";
const MD_BREAKPOINT = 768;

/**
 * Wrapper that shifts main content to account for sidebar width on desktop.
 * On mobile (< md), no margin is applied since sidebar is hidden.
 */
export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MD_BREAKPOINT}px)`);
    const onMq = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onMq);

    const onSidebarToggle = () => {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setCollapsed(e.newValue === "true");
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("sidebar-toggle", onSidebarToggle);
    return () => {
      mq.removeEventListener("change", onMq);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("sidebar-toggle", onSidebarToggle);
    };
  }, []);

  const marginLeft = isDesktop ? (collapsed ? 72 : 240) : 0;

  return (
    <div
      className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text-1)] transition-[margin-left] duration-300 ease-in-out"
      style={{ marginLeft: `${marginLeft}px` }}
    >
      {children}
    </div>
  );
}
