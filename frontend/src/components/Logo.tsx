import React from "react";

interface LogoProps {
  variant?: "icon" | "full" | "compact";
  className?: string;
}

/**
 * Headphones + audio waveform logo for Tech Blog Catchup.
 * Uses currentColor for theme adaptability (light/dark).
 *
 * Variants:
 *  - "icon"    — headphones icon only (square)
 *  - "full"    — icon + "Tech Blog Catchup" wordmark
 *  - "compact" — icon + "TBC" shortform
 */
export default function Logo({ variant = "icon", className }: LogoProps) {
  const icon = (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={variant === "icon" ? className : "h-[1em] w-[1em]"}
      aria-hidden="true"
    >
      {/* Headphone arc */}
      <path
        d="M6 18C6 11.373 11.373 6 18 6h0c5.523 0 10 4.477 10 10v4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Left ear cup */}
      <rect
        x="4"
        y="17"
        width="5"
        height="9"
        rx="2.5"
        fill="currentColor"
      />
      {/* Right ear cup */}
      <rect
        x="25"
        y="17"
        width="5"
        height="9"
        rx="2.5"
        fill="currentColor"
      />
      {/* Audio wave bars (center) */}
      <rect x="13" y="19" width="1.5" height="5" rx="0.75" fill="currentColor" opacity="0.6" />
      <rect x="16" y="17" width="1.5" height="9" rx="0.75" fill="currentColor" opacity="0.8" />
      <rect x="19" y="18" width="1.5" height="7" rx="0.75" fill="currentColor" opacity="0.6" />
    </svg>
  );

  if (variant === "icon") {
    return icon;
  }

  const label = variant === "compact" ? "TBC" : "Tech Blog Catchup";

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      {icon}
      <span className="font-extrabold leading-none whitespace-nowrap text-[var(--text-1)]">{label}</span>
    </span>
  );
}
