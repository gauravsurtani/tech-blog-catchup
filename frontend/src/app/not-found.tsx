import Link from "next/link";
import { SearchX, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 bg-[var(--bg)]">
      <SearchX
        size={64}
        className="mb-6 text-[var(--text-3)]"
      />

      <h1 className="text-6xl font-extrabold mb-3 text-[var(--text-1)]">
        404
      </h1>

      <p className="text-lg mb-2 font-bold text-[var(--text-1)]">
        Page not found
      </p>

      <p className="text-base mb-8 max-w-md text-[var(--text-2)]">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="nb-hover inline-flex items-center gap-2 px-8 py-3 font-bold rounded-[var(--radius)] bg-[var(--primary)] text-[var(--primary-text)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow)] transition-all"
        >
          Go Home
        </Link>
        <Link
          href="/explore"
          className="nb-hover inline-flex items-center gap-2 px-6 py-3 font-medium text-sm rounded-[var(--radius)] bg-[var(--bg-elevated)] text-[var(--text-1)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] transition-all"
        >
          <Compass className="w-4 h-4" />
          Search Posts
        </Link>
      </div>
    </div>
  );
}
