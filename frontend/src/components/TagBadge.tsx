"use client";

interface TagBadgeProps {
  name: string;
  onClick?: () => void;
}

const TAG_COLORS: Record<string, string> = {
  javascript: "bg-yellow-900/50 text-yellow-300 border-yellow-700/50",
  typescript: "bg-blue-900/50 text-blue-300 border-blue-700/50",
  react: "bg-cyan-900/50 text-cyan-300 border-cyan-700/50",
  python: "bg-green-900/50 text-green-300 border-green-700/50",
  rust: "bg-orange-900/50 text-orange-300 border-orange-700/50",
  go: "bg-sky-900/50 text-sky-300 border-sky-700/50",
  devops: "bg-purple-900/50 text-purple-300 border-purple-700/50",
  kubernetes: "bg-indigo-900/50 text-indigo-300 border-indigo-700/50",
  docker: "bg-blue-900/50 text-blue-300 border-blue-700/50",
  ai: "bg-pink-900/50 text-pink-300 border-pink-700/50",
  "machine-learning": "bg-pink-900/50 text-pink-300 border-pink-700/50",
  security: "bg-red-900/50 text-red-300 border-red-700/50",
  database: "bg-emerald-900/50 text-emerald-300 border-emerald-700/50",
  performance: "bg-amber-900/50 text-amber-300 border-amber-700/50",
  architecture: "bg-violet-900/50 text-violet-300 border-violet-700/50",
};

const FALLBACK_COLORS = [
  "bg-slate-800/60 text-slate-300 border-slate-600/50",
  "bg-zinc-800/60 text-zinc-300 border-zinc-600/50",
  "bg-neutral-800/60 text-neutral-300 border-neutral-600/50",
  "bg-stone-800/60 text-stone-300 border-stone-600/50",
  "bg-gray-800/60 text-gray-300 border-gray-600/50",
];

function getTagColor(name: string): string {
  const lower = name.toLowerCase();
  if (TAG_COLORS[lower]) return TAG_COLORS[lower];

  // Deterministic color based on string hash
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = lower.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

export default function TagBadge({ name, onClick }: TagBadgeProps) {
  const colorClasses = getTagColor(name);
  const baseClasses = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${colorClasses}`;

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} cursor-pointer hover:brightness-125`}
      >
        {name}
      </button>
    );
  }

  return <span className={baseClasses}>{name}</span>;
}
