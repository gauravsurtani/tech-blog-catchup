"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/playlist", label: "Playlist" },
  { href: "/status", label: "Status" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-[var(--bg-elevated)] border-b-[var(--border-w)] border-[var(--border-color)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-[var(--text-1)]">
              Tech Blog Catchup
            </Link>
            <div className="flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-[var(--radius)] text-sm font-semibold transition-colors ${
                    pathname === item.href
                      ? "bg-[var(--primary)] text-[var(--primary-text)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)]"
                      : "text-[var(--text-2)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-1)]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
