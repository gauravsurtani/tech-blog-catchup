"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rss } from "lucide-react";
import { getFeedUrl } from "@/lib/api";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export default function Footer() {
  const pathname = usePathname();

  return (
    <footer className="border-t-[var(--border-w)] border-[var(--border-color)] bg-[var(--bg)] mt-auto pb-[var(--player-height)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-4)]">
            &copy; {new Date().getFullYear()} Catchup
          </p>
          <nav className="flex items-center gap-6">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={`text-sm transition-colors ${
                  pathname === href
                    ? "text-[var(--text-1)] font-medium"
                    : "text-[var(--text-3)] hover:text-[var(--blue)] hover:underline"
                }`}
              >
                {label}
              </Link>
            ))}
            <a
              href="https://github.com/gauravsurtani/tech-blog-catchup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--text-3)] hover:text-[var(--blue)] hover:underline transition-colors"
            >
              GitHub
            </a>
            <a
              href={getFeedUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-[var(--text-3)] hover:text-[var(--orange)] transition-colors"
              title="Subscribe to podcast RSS feed"
            >
              <Rss className="w-3.5 h-3.5" />
              RSS
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
