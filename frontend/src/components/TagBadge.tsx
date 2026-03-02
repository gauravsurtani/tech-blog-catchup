"use client";

interface TagBadgeProps {
  name: string;
  onClick?: () => void;
}

// Neo-brutalist tag color system with category groupings
// Light mode colors inline; dark mode handled via .dark class override
const TAG_COLORS: Record<string, { text: string; bg: string; darkText: string; darkBg: string }> = {
  // Blue: frontend / AI / web
  javascript: { text: "#0958D9", bg: "#E6F4FF", darkText: "#69B4FF", darkBg: "rgba(22,119,255,0.15)" },
  typescript: { text: "#0958D9", bg: "#E6F4FF", darkText: "#69B4FF", darkBg: "rgba(22,119,255,0.15)" },
  react: { text: "#0958D9", bg: "#E6F4FF", darkText: "#69B4FF", darkBg: "rgba(22,119,255,0.15)" },
  frontend: { text: "#0958D9", bg: "#E6F4FF", darkText: "#69B4FF", darkBg: "rgba(22,119,255,0.15)" },
  web: { text: "#0958D9", bg: "#E6F4FF", darkText: "#69B4FF", darkBg: "rgba(22,119,255,0.15)" },
  ai: { text: "#0958D9", bg: "#E6F4FF", darkText: "#69B4FF", darkBg: "rgba(22,119,255,0.15)" },
  "machine-learning": { text: "#0958D9", bg: "#E6F4FF", darkText: "#69B4FF", darkBg: "rgba(22,119,255,0.15)" },

  // Green: infra / backend
  python: { text: "#377B13", bg: "#F0FFE0", darkText: "#95DE64", darkBg: "rgba(82,196,26,0.15)" },
  go: { text: "#377B13", bg: "#F0FFE0", darkText: "#95DE64", darkBg: "rgba(82,196,26,0.15)" },
  devops: { text: "#377B13", bg: "#F0FFE0", darkText: "#95DE64", darkBg: "rgba(82,196,26,0.15)" },
  kubernetes: { text: "#377B13", bg: "#F0FFE0", darkText: "#95DE64", darkBg: "rgba(82,196,26,0.15)" },
  docker: { text: "#377B13", bg: "#F0FFE0", darkText: "#95DE64", darkBg: "rgba(82,196,26,0.15)" },
  database: { text: "#377B13", bg: "#F0FFE0", darkText: "#95DE64", darkBg: "rgba(82,196,26,0.15)" },
  infrastructure: { text: "#377B13", bg: "#F0FFE0", darkText: "#95DE64", darkBg: "rgba(82,196,26,0.15)" },
  backend: { text: "#377B13", bg: "#F0FFE0", darkText: "#95DE64", darkBg: "rgba(82,196,26,0.15)" },

  // Orange: perf / systems
  rust: { text: "#AD4E00", bg: "#FFF7E6", darkText: "#FFC069", darkBg: "rgba(250,140,22,0.15)" },
  performance: { text: "#AD4E00", bg: "#FFF7E6", darkText: "#FFC069", darkBg: "rgba(250,140,22,0.15)" },
  systems: { text: "#AD4E00", bg: "#FFF7E6", darkText: "#FFC069", darkBg: "rgba(250,140,22,0.15)" },

  // Purple: API / graphql
  architecture: { text: "#531DAB", bg: "#F9F0FF", darkText: "#B37FEB", darkBg: "rgba(114,46,209,0.15)" },
  api: { text: "#531DAB", bg: "#F9F0FF", darkText: "#B37FEB", darkBg: "rgba(114,46,209,0.15)" },
  graphql: { text: "#531DAB", bg: "#F9F0FF", darkText: "#B37FEB", darkBg: "rgba(114,46,209,0.15)" },

  // Cyan: networking / distributed
  networking: { text: "#08827E", bg: "#E6FFFB", darkText: "#5CDBD3", darkBg: "rgba(19,194,194,0.15)" },
  distributed: { text: "#08827E", bg: "#E6FFFB", darkText: "#5CDBD3", darkBg: "rgba(19,194,194,0.15)" },

  // Red: security / errors
  security: { text: "#CF1322", bg: "#FFF1F0", darkText: "#FF7875", darkBg: "rgba(245,34,45,0.15)" },
  error: { text: "#CF1322", bg: "#FFF1F0", darkText: "#FF7875", darkBg: "rgba(245,34,45,0.15)" },
};

// Fallback category colors for unknown tags (deterministic by hash)
const FALLBACK_COLORS = [
  { text: "#0958D9", bg: "#E6F4FF", darkText: "#69B4FF", darkBg: "rgba(22,119,255,0.15)" },
  { text: "#377B13", bg: "#F0FFE0", darkText: "#95DE64", darkBg: "rgba(82,196,26,0.15)" },
  { text: "#AD4E00", bg: "#FFF7E6", darkText: "#FFC069", darkBg: "rgba(250,140,22,0.15)" },
  { text: "#531DAB", bg: "#F9F0FF", darkText: "#B37FEB", darkBg: "rgba(114,46,209,0.15)" },
  { text: "#08827E", bg: "#E6FFFB", darkText: "#5CDBD3", darkBg: "rgba(19,194,194,0.15)" },
];

function getTagColor(name: string): { text: string; bg: string; darkText: string; darkBg: string } {
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
  const colors = getTagColor(name);

  // Use CSS custom properties to handle dark mode via inline styles
  // The dark: prefix in Tailwind handles the toggle
  const style = {
    "--tag-text-light": colors.text,
    "--tag-bg-light": colors.bg,
    "--tag-text-dark": colors.darkText,
    "--tag-bg-dark": colors.darkBg,
  } as React.CSSProperties;

  const baseClasses =
    "inline-flex items-center h-6 px-2.5 rounded-[var(--radius-full)] text-[11px] font-bold border-[1.5px] border-[var(--border-color)] shadow-[1px_1px_0px_0px_var(--border-color)] transition-colors " +
    "text-[var(--tag-text-light)] bg-[var(--tag-bg-light)] " +
    "dark:text-[var(--tag-text-dark)] dark:bg-[var(--tag-bg-dark)]";

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} cursor-pointer hover:brightness-110`}
        style={style}
      >
        {name}
      </button>
    );
  }

  return (
    <span className={baseClasses} style={style}>
      {name}
    </span>
  );
}
