"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Headphones,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { submitPost, ApiError } from "@/lib/api";

interface SuccessResult {
  post_id: number;
  job_id: number;
}

const MAX_TEXT_LENGTH = 50000;

export default function SubmitForm() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessResult | null>(null);

  function resetForm() {
    setTitle("");
    setText("");
    setError(null);
    setSuccess(null);
  }

  function validate(): string | null {
    if (!title.trim()) return "Title is required";
    if (title.trim().length > 500) return "Title must be under 500 characters";
    if (!text.trim()) return "Text content is required";
    if (text.trim().length < 100) return "Text must be at least 100 characters";
    if (text.trim().length > MAX_TEXT_LENGTH)
      return `Text must be under ${MAX_TEXT_LENGTH.toLocaleString()} characters`;
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = await submitPost({ text: text.trim(), title: title.trim() });
      setSuccess({ post_id: result.post_id, job_id: result.job_id });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.details || err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[var(--bg-elevated)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-3 border-b-[var(--border-w)] border-[var(--border-color)] bg-[var(--primary)] text-[var(--primary-text)]">
        <FileText size={18} />
        <span className="text-sm font-semibold">Paste Article Text</span>
      </div>

      {/* Form body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 bg-[var(--error)]/10 border-[var(--border-w)] border-[var(--error)]/50 text-[var(--error)] rounded-[var(--radius)] p-3 text-sm">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success banner */}
        {success && (
          <div className="flex items-start gap-2 bg-[var(--primary)]/10 border-[var(--border-w)] border-[var(--primary)]/50 text-[var(--primary)] rounded-[var(--radius)] p-3 text-sm">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>
              Podcast queued!{" "}
              <Link
                href={`/post/${success.post_id}`}
                className="underline font-semibold hover:opacity-80"
              >
                View post &rarr;
              </Link>
            </span>
          </div>
        )}

        {/* Title input */}
        <div>
          <label
            htmlFor="submit-title"
            className="block text-sm font-semibold text-[var(--text-1)] mb-2"
          >
            Title
          </label>
          <input
            id="submit-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article title..."
            maxLength={500}
            disabled={loading}
            className="w-full px-4 py-3 bg-[var(--bg-main)] text-[var(--text-1)] placeholder:text-[var(--text-3)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius)] shadow-[var(--shadow-sm)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors disabled:opacity-50"
          />
        </div>

        {/* Content textarea */}
        <div>
          <label
            htmlFor="submit-text"
            className="block text-sm font-semibold text-[var(--text-1)] mb-2"
          >
            Content
          </label>
          <textarea
            id="submit-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your article text here..."
            rows={10}
            maxLength={MAX_TEXT_LENGTH}
            disabled={loading}
            className="w-full px-4 py-3 bg-[var(--bg-main)] text-[var(--text-1)] placeholder:text-[var(--text-3)] border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius)] shadow-[var(--shadow-sm)] text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-y disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-[var(--text-3)] mt-1">
            <span>Minimum 100 characters</span>
            <span>
              {text.length.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || success !== null}
          className="nb-hover w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--primary)] text-[var(--primary-text)] font-bold text-sm border-[var(--border-w)] border-[var(--border-color)] rounded-[var(--radius)] shadow-[var(--shadow-sm)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generating podcast...
            </>
          ) : success ? (
            <>
              <CheckCircle2 size={18} />
              Podcast queued
            </>
          ) : (
            <>
              <Headphones size={18} />
              Podcastify
            </>
          )}
        </button>

        {/* Submit another */}
        {success && (
          <button
            type="button"
            onClick={resetForm}
            className="w-full text-center text-sm text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors cursor-pointer"
          >
            Submit another article
          </button>
        )}
      </form>
    </div>
  );
}
