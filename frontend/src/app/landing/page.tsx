import Link from "next/link";
import Logo from "@/components/Logo";
import HowItWorks from "@/components/landing/HowItWorks";

const features = [
  {
    title: "15+ Sources",
    description:
      "Engineering blogs from Uber, Meta, Airbnb, Cloudflare, Netflix, GitHub, and more.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" aria-hidden="true">
        <path
          d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M3.6 9h16.8M3.6 15h16.8M12 3c-2.4 2.7-3 6-3 9s.6 6.3 3 9c2.4-2.7 3-6 3-9s-.6-6.3-3-9Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    ),
  },
  {
    title: "AI Podcasts",
    description:
      "Every post becomes a two-host conversational podcast, generated with AI voices.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" aria-hidden="true">
        <path
          d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4m-3 0h6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Web Player",
    description:
      "Browse, filter, build playlists, and listen in a Spotify-like player right in your browser.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" aria-hidden="true">
        <rect
          x="2"
          y="3"
          width="20"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M8 21h8M12 17v4M10 9l5 3-5 3V9Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const sources = [
  "Meta",
  "Uber",
  "Airbnb",
  "Cloudflare",
  "Netflix",
  "GitHub",
  "Spotify",
  "Stripe",
  "LinkedIn",
];

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center gap-[var(--space-12)]">
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-[var(--space-6)] pt-12 sm:pt-20 max-w-3xl">
        <Logo variant="icon" className="w-16 h-16 text-[var(--primary)]" />
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--text-1)]">
          Catchup
        </h1>
        <p className="text-lg sm:text-xl text-[var(--text-2)] max-w-2xl leading-relaxed">
          Listen to the best tech engineering blogs as conversational podcasts.
          Two AI hosts break down every post so you can learn on the go.
        </p>
        <Link
          href="/explore"
          className="nb-hover inline-flex items-center gap-2 px-8 py-3 rounded-[var(--radius)] bg-[var(--primary)] text-[var(--primary-text)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow)] font-bold text-lg transition-all"
        >
          Start Listening
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M3 10a.75.75 0 0 1 .75-.75h10.638l-3.96-3.72a.75.75 0 1 1 1.024-1.06l5.25 4.93a.75.75 0 0 1 0 1.06l-5.25 4.93a.75.75 0 1 1-1.024-1.06l3.96-3.72H3.75A.75.75 0 0 1 3 10Z"
              clipRule="evenodd"
            />
          </svg>
        </Link>
      </section>

      {/* Stats bar */}
      <section className="flex items-center justify-center gap-8 sm:gap-12 w-full max-w-2xl py-2">
        {[
          { value: "15+", label: "Sources" },
          { value: "100+", label: "Podcasts" },
          { value: "50+", label: "Hours" },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[var(--primary)]">
              {stat.value}
            </span>
            <span className="text-xs text-[var(--text-3)] uppercase tracking-wide font-medium">
              {stat.label}
            </span>
          </div>
        ))}
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--space-6)] w-full max-w-4xl">
        {features.map((f) => (
          <div
            key={f.title}
            className="nb-hover flex flex-col items-center text-center gap-[var(--space-4)] p-[var(--space-8)] rounded-[var(--radius-xl)] bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-lg)] transition-all"
          >
            <div className="text-[var(--primary)]">{f.icon}</div>
            <h2 className="text-xl font-bold text-[var(--text-1)]">
              {f.title}
            </h2>
            <p className="text-sm text-[var(--text-2)] leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Social proof */}
      <section className="flex flex-col items-center gap-[var(--space-4)] pb-12">
        <p className="text-sm text-[var(--text-3)] uppercase tracking-wider font-medium">
          Sources include
        </p>
        <div className="flex flex-wrap justify-center gap-x-[var(--space-6)] gap-y-[var(--space-2)]">
          {sources.map((s) => (
            <span
              key={s}
              className="text-[var(--text-2)] font-medium"
            >
              {s}
            </span>
          ))}
        </div>
        <Link
          href="/browse"
          className="nb-hover inline-flex items-center gap-2 px-6 py-2.5 rounded-[var(--radius)] bg-[var(--bg-elevated)] text-[var(--text-1)] border-[var(--border-w)] border-[var(--border-color)] shadow-[var(--shadow-sm)] font-medium text-sm transition-all mt-4"
        >
          Browse Sources
        </Link>
      </section>
    </div>
  );
}
