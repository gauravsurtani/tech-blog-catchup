"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Library, ListMusic, BarChart3 } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/library", label: "Library", icon: Library },
  { href: "/playlist", label: "Playlist", icon: ListMusic },
  { href: "/status", label: "Status", icon: BarChart3 },
];

export default function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed left-0 right-0 flex md:hidden items-center justify-around border-t-[var(--border-w)] border-[var(--border-color)] bg-[var(--nav-bg)] backdrop-blur-[12px]"
      style={{
        bottom: "var(--player-height)",
        zIndex: "var(--z-nav)",
        height: "3.5rem",
      }}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? (pathname === "/" || pathname.startsWith("/post/")) : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`nb-hover flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] font-semibold transition-colors ${
              active
                ? "text-[var(--primary-text)]"
                : "text-[var(--text-3)] hover:text-[var(--text-1)]"
            }`}
          >
            <span
              className={`flex items-center justify-center w-10 h-7 rounded-[var(--radius)] transition-colors ${
                active
                  ? "bg-[var(--primary)] border-[1.5px] border-[var(--border-color)] shadow-[var(--shadow-sm)]"
                  : ""
              }`}
            >
              <Icon size={20} />
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
