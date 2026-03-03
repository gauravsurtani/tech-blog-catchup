"use client";

import { useState, useEffect, useRef } from "react";
import { Share2, Link2, ExternalLink } from "lucide-react";

interface ShareButtonProps {
  postId: number;
  title: string;
  className?: string;
}

export default function ShareButton({ postId, title, className = "" }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const postUrl = typeof window !== "undefined"
    ? `${window.location.origin}/post/${postId}`
    : `/post/${postId}`;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const items = ref.current?.querySelectorAll('[role="menuitem"]');
        if (!items || items.length === 0) return;
        const focused = document.activeElement;
        let index = Array.from(items).indexOf(focused as Element);
        if (e.key === "ArrowDown") {
          index = index < items.length - 1 ? index + 1 : 0;
        } else {
          index = index > 0 ? index - 1 : items.length - 1;
        }
        (items[index] as HTMLElement).focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Auto-focus first item when menu opens
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const firstItem = ref.current?.querySelector('[role="menuitem"]');
      if (firstItem) (firstItem as HTMLElement).focus();
    });
  }, [open]);

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: postUrl });
        return;
      } catch {
        // User cancelled or Web Share API failed, fall through to dropdown
      }
    }
    setOpen((prev) => !prev);
  }

  async function handleCopyLink(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1500);
    } catch {
      // Clipboard API not available
    }
  }

  function handleTwitter(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(postUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  function handleLinkedIn(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={handleShare}
        className="nb-hover w-7 h-7 flex items-center justify-center text-[var(--text-2)] hover:text-[var(--text-1)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius)] shadow-[var(--shadow-sm)] bg-[var(--bg-elevated)] transition-colors cursor-pointer"
        title="Share"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 bottom-full mb-1 w-44 bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius)] shadow-[var(--shadow)] z-50 py-1">
          <button
            role="menuitem"
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-1)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            role="menuitem"
            onClick={handleTwitter}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-1)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Share on X
          </button>
          <button
            role="menuitem"
            onClick={handleLinkedIn}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-1)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Share on LinkedIn
          </button>
        </div>
      )}
    </div>
  );
}
