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
        className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
        title="Share"
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-1 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 py-1">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" />
            {copied ? "Copied!" : "Copy Link"}
          </button>
          <button
            onClick={handleTwitter}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Share on X
          </button>
          <button
            onClick={handleLinkedIn}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Share on LinkedIn
          </button>
        </div>
      )}
    </div>
  );
}
