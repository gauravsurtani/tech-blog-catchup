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
      className="fixed left-0 right-0 flex md:hidden items-center justify-around border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
      style={{
        bottom: "var(--player-height)",
        zIndex: "var(--z-nav)",
        height: "3.5rem",
      }}
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-[10px] font-medium transition-colors ${
              active
                ? "text-[var(--color-accent)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
