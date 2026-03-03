"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Home,
  Compass,
  LayoutGrid,
  Library,
  ListMusic,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import Logo from "./Logo";
import UserMenu from "./UserMenu";
import SearchDialog from "./SearchDialog";
import { useAuthEnabled } from "@/hooks/useRequireAuth";

const STORAGE_KEY = "sidebar-collapsed";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/browse", label: "Browse", icon: LayoutGrid },
  { href: "/library", label: "Library", icon: Library },
  { href: "/playlist", label: "Playlist", icon: ListMusic },
  { href: "/status", label: "Status", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "true";
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const authEnabled = useAuthEnabled();

  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setSearchOpen((prev) => !prev);
    }
    if (e.key === "Escape") {
      setSearchOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new Event("sidebar-toggle"));
  };

  return (
    <aside
      role="navigation"
      aria-label="Main navigation"
      className="hidden md:flex flex-col fixed top-0 left-0 h-screen pb-[var(--player-height)] border-r-[var(--border-w)] border-[var(--border-color)] bg-[var(--bg-elevated)] transition-[width] duration-300 ease-in-out"
      style={{
        width: collapsed ? 60 : 240,
        zIndex: "var(--z-nav)",
      }}
    >
      {/* Logo + Collapse toggle */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--border-color)]">
        <Link href="/" className="text-[var(--text-1)] text-xl">
          <Logo
            variant={collapsed ? "icon" : "full"}
            className={collapsed ? "h-8 w-8" : "text-xl"}
          />
        </Link>
        <button
          onClick={toggle}
          className="nb-hover flex items-center justify-center w-8 h-8 rounded-[var(--radius)] text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--bg-hover)] transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Search button */}
      <div className="px-3 pt-4 pb-1">
        <button
          onClick={() => setSearchOpen(true)}
          title={collapsed ? "Search (Cmd+K)" : undefined}
          aria-label="Search posts"
          className="nb-hover flex items-center gap-3 w-full rounded-[var(--radius)] px-3 py-2.5 text-sm font-semibold text-[var(--text-2)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] transition-colors"
        >
          <Search size={20} className="shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left whitespace-nowrap">Search</span>
              <kbd className="text-[10px] font-mono text-[var(--text-3)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded-[var(--radius)]">
                {typeof navigator !== "undefined" && /Mac/.test(navigator.platform)
                  ? "\u2318"
                  : "Ctrl+"}
                K
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={`nb-hover flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-[var(--primary)] text-[var(--primary-text)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)]"
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User menu — hidden when no OAuth providers configured */}
      {authEnabled !== false && (
        <div className="px-3 py-2 border-t border-[var(--border-color)]">
          <UserMenu collapsed={collapsed} />
        </div>
      )}

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </aside>
  );
}

/** CSS class for main content margin. Use in layout.tsx. */
export const SIDEBAR_EXPANDED_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 60;
