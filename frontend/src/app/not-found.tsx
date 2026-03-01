import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <SearchX
        size={64}
        className="mb-6"
        style={{ color: "var(--color-text-muted)" }}
      />

      <h1
        className="text-3xl font-bold mb-3"
        style={{ color: "var(--color-text-primary)" }}
      >
        Page not found
      </h1>

      <p
        className="text-lg mb-8 max-w-md"
        style={{ color: "var(--color-text-secondary)" }}
      >
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 font-medium rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
