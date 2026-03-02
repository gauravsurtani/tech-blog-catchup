import { Globe, Sparkles, Headphones, Play, SkipForward, Volume2 } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Discover",
    description:
      "We crawl 15+ top engineering blogs daily — Meta, Uber, Netflix, Cloudflare, and more — so you never miss a post.",
    icon: Globe,
  },
  {
    number: 2,
    title: "Generate",
    description:
      "AI transforms each article into a two-host conversational podcast with natural voices and real discussion.",
    icon: Sparkles,
  },
  {
    number: 3,
    title: "Listen",
    description:
      "Browse, filter, and build playlists in a Spotify-like player. Learn on your commute, at the gym, or anywhere.",
    icon: Headphones,
  },
];

function AppMockup() {
  return (
    <div className="w-full max-w-3xl mx-auto rounded-[var(--radius-xl)] border-[var(--border-w)] border-[var(--border-color)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)] overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)] border-b-[var(--border-w)] border-[var(--border-color)] bg-[var(--tag-bg)]">
        <span className="w-3 h-3 rounded-full bg-[var(--error)] opacity-70" />
        <span className="w-3 h-3 rounded-full bg-[var(--warning)] opacity-70" />
        <span className="w-3 h-3 rounded-full bg-[var(--primary)] opacity-70" />
        <span className="ml-[var(--space-4)] text-xs text-[var(--text-3)] font-mono">
          techblogcatchup.app
        </span>
      </div>

      {/* Playlist area */}
      <div className="p-[var(--space-6)] space-y-[var(--space-3)]">
        <p className="text-sm font-bold text-[var(--text-1)] mb-[var(--space-4)]">
          Your Podcast Feed
        </p>
        {[
          { source: "Meta", title: "Scaling Cache Infrastructure at Meta", duration: "12 min" },
          { source: "Uber", title: "Real-Time ML Feature Store", duration: "9 min" },
          { source: "Netflix", title: "Resilience at the Edge with eBPF", duration: "15 min" },
        ].map((track, i) => (
          <div
            key={i}
            className={`flex items-center gap-[var(--space-3)] p-[var(--space-3)] rounded-[var(--radius)] transition-colors ${
              i === 0
                ? "bg-[var(--primary)]/10 border-[var(--border-w)] border-[var(--primary)]/30"
                : "bg-[var(--tag-bg)]"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-[var(--radius)] flex items-center justify-center shrink-0 ${
                i === 0
                  ? "bg-[var(--primary)] text-[var(--primary-text)]"
                  : "bg-[var(--bg-hover)] text-[var(--text-3)]"
              }`}
            >
              <Play className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-1)] truncate">
                {track.title}
              </p>
              <p className="text-xs text-[var(--text-3)]">{track.source}</p>
            </div>
            <span className="text-xs text-[var(--text-3)] shrink-0">
              {track.duration}
            </span>
          </div>
        ))}
      </div>

      {/* Player bar */}
      <div className="flex items-center gap-[var(--space-4)] px-[var(--space-6)] py-[var(--space-4)] border-t-[var(--border-w)] border-[var(--border-color)] bg-[var(--tag-bg)]">
        <div className="flex items-center gap-[var(--space-3)] flex-1 min-w-0">
          <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--primary)] flex items-center justify-center shrink-0">
            <Headphones className="w-5 h-5 text-[var(--primary-text)]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-1)] truncate">
              Scaling Cache Infrastructure at Meta
            </p>
            <p className="text-xs text-[var(--text-3)]">2:34 / 12:00</p>
          </div>
        </div>
        <div className="flex items-center gap-[var(--space-2)]">
          <button className="p-[var(--space-2)] text-[var(--text-2)] hover:text-[var(--text-1)]" aria-label="Skip forward">
            <SkipForward className="w-4 h-4" />
          </button>
          <button className="p-[var(--space-2)] text-[var(--text-2)] hover:text-[var(--text-1)]" aria-label="Volume">
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        {/* Progress bar */}
        <div className="hidden sm:flex items-center gap-[var(--space-2)] flex-1 max-w-[200px]">
          <div className="flex-1 h-1 rounded-full bg-[var(--bg-hover)]">
            <div className="h-1 rounded-full bg-[var(--primary)] w-[21%]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section className="flex flex-col items-center gap-[var(--space-12)] w-full max-w-5xl">
      {/* Section header */}
      <div className="flex flex-col items-center text-center gap-[var(--space-4)]">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-1)]">
          How It Works
        </h2>
        <p className="text-[var(--text-2)] max-w-xl leading-relaxed">
          From blog post to podcast in three simple steps — fully automated.
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-[var(--space-8)] w-full">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.number}
              className="flex flex-col items-center text-center gap-[var(--space-4)]"
            >
              {/* Numbered icon circle */}
              <div className="relative">
                <div className="w-16 h-16 rounded-[var(--radius-full)] bg-[var(--primary)]/10 border-[var(--border-w)] border-[var(--primary)]/30 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-[var(--primary)]" />
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-[var(--radius-full)] bg-[var(--primary)] text-[var(--primary-text)] text-xs font-bold flex items-center justify-center border-[var(--border-w)] border-[var(--border-color)]">
                  {step.number}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[var(--text-1)]">
                {step.title}
              </h3>
              <p className="text-sm text-[var(--text-2)] leading-relaxed max-w-xs">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Connector arrows (desktop only) — purely decorative */}
      <div className="hidden sm:flex items-center justify-center gap-[var(--space-6)] -mt-[var(--space-8)] w-full max-w-3xl" aria-hidden="true">
        {[0, 1].map((i) => (
          <div key={i} className="flex-1 flex items-center justify-center">
            <div className="h-px flex-1 bg-[var(--border-color)]" />
            <svg viewBox="0 0 12 12" className="w-3 h-3 text-[var(--text-3)] mx-1" fill="currentColor">
              <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="h-px flex-1 bg-[var(--border-color)]" />
          </div>
        ))}
      </div>

      {/* App mockup */}
      <AppMockup />
    </section>
  );
}
