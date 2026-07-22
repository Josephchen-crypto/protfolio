"use client";

import { useState, type FormEvent } from "react";
import { clsx } from "clsx";

interface CommentFormProps {
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
}

/**
 * Textarea + submit button for writing a comment.
 * Can be used for top-level comments and inline replies.
 */
export function CommentForm({
  placeholder = "Write a comment…",
  submitLabel = "Post",
  onSubmit,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(trimmed);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        maxLength={5000}
        disabled={submitting}
        className={clsx(
          "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-white",
          "placeholder:text-slate-500 resize-none focus:outline-none focus:border-primary/50",
          "disabled:opacity-50",
        )}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className={clsx(
            "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
            "bg-primary hover:bg-primary/80 text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {submitting ? "Posting…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}