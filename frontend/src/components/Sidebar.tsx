"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  Compass,
  LayoutGrid,
  Library,
  ListMusic,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Logo from "./Logo";
import UserMenu from "./UserMenu";

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
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new Event("sidebar-toggle"));
  };

  return (
    <aside
      className="hidden md:flex flex-col fixed top-0 left-0 h-screen border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] transition-[width] duration-300 ease-in-out"
      style={{
        width: mounted ? (collapsed ? 72 : 240) : 240,
        zIndex: "var(--z-nav)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-[var(--color-border)]">
        <Link href="/" className="text-[var(--color-text-primary)] text-xl">
          <Logo
            variant={collapsed ? "icon" : "full"}
            className={collapsed ? "h-8 w-8" : "text-xl"}
          />
        </Link>
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
              className={`flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--color-accent)] text-[var(--color-accent-text)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User menu */}
      <div className="px-3 py-2 border-t border-[var(--color-border)]">
        <UserMenu collapsed={collapsed} />
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="flex items-center justify-center h-12 border-t border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}

/** CSS class for main content margin. Use in layout.tsx. */
export const SIDEBAR_EXPANDED_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 72;
