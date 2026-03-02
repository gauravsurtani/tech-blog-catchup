"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { Settings, User, LogOut, LogIn } from "lucide-react";

interface UserMenuProps {
  collapsed?: boolean;
}

export default function UserMenu({ collapsed = false }: UserMenuProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] rounded-[var(--radius)] transition-colors"
        title={collapsed ? "Sign In" : undefined}
      >
        <LogIn size={20} className="shrink-0" />
        {!collapsed && <span className="whitespace-nowrap">Sign In</span>}
      </Link>
    );
  }

  const { user } = session;
  const initials = (user.name || user.email || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-[var(--radius)] text-sm font-medium text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)] transition-colors"
        title={collapsed ? user.name || "Account" : undefined}
        aria-label="User menu"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || "User avatar"}
            width={28}
            height={28}
            className="rounded-[var(--radius-full)] shrink-0 object-cover border-[var(--border-w)] border-[var(--border-color)]"
            referrerPolicy="no-referrer"
            unoptimized
          />
        ) : (
          <span className="w-7 h-7 rounded-[var(--radius-full)] shrink-0 bg-[var(--primary)] text-[var(--primary-text)] flex items-center justify-center text-xs font-bold border-[var(--border-w)] border-[var(--border-color)]">
            {initials}
          </span>
        )}
        {!collapsed && (
          <span className="truncate">{user.name || user.email}</span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-48 rounded-[var(--radius)] border-[var(--border-w)] border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-[var(--shadow)] py-1 z-50">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-1)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <User size={16} />
            Profile
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-1)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <Settings size={16} />
            Settings
          </Link>
          <div className="border-t border-[var(--split)] my-1" />
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--text-1)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
