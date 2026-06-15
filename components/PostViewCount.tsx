"use client";

import { useEffect, useState } from "react";
import {
  buildPostKey,
  getViewStorageKey,
  shouldCountView,
} from "@/lib/blog-views";
import { Eye } from "lucide-react";

interface PostViewCountProps {
  lang: string;
  slug: string;
  /** i18n label template, e.g. "{count} views" — {count} is replaced with the number. */
  label: string;
  /**
   * Whether to attempt an increment on mount (true for the detail page,
   * false for listing cards). Defaults to false.
   */
  incrementOnMount?: boolean;
}

/**
 * Client component that displays the view count for a single blog post.
 *
 * When `incrementOnMount` is true it also checks localStorage for a 12-hour
 * dedupe window and sends a POST to increment the counter once per visitor.
 */
export function PostViewCount({
  lang,
  slug,
  label,
  incrementOnMount = false,
}: PostViewCountProps) {
  const [views, setViews] = useState<number | null>(null);
  const [incrementAttempted, setIncrementAttempted] = useState(false);

  useEffect(() => {
    const postKey = buildPostKey(lang as "en" | "zh", slug);

    async function run() {
      try {
        // --- Phase 1: attempt increment (with client-side dedupe) ---
        if (incrementOnMount && !incrementAttempted) {
          setIncrementAttempted(true);

          const storageKey = getViewStorageKey(postKey);
          const raw = localStorage.getItem(storageKey);
          const lastCounted = raw ? Number(raw) : undefined;

          if (shouldCountView(lastCounted, Date.now())) {
            const res = await fetch("/api/blog/views", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ lang, slug }),
            });

            if (res.ok) {
              const data = (await res.json()) as { views: number };
              setViews(data.views);
              localStorage.setItem(storageKey, String(Date.now()));
              return; // we already have the count
            }
          }
        }

        // --- Phase 2: fetch current count (fallback or listing) ---
        const res = await fetch(`/api/blog/views?keys=${encodeURIComponent(postKey)}`);
        if (res.ok) {
          const data = (await res.json()) as Record<string, number>;
          setViews(data[postKey] ?? 0);
        }
      } catch {
        // Silently fail — view count is non-critical
      }
    }

    run();
  }, [lang, slug, incrementOnMount, incrementAttempted]);

  // Don't render anything until we have a count
  if (views === null) return null;

  return (
    <span className="inline-flex items-center gap-1">
      <Eye size={14} />
      {label.replace("{count}", String(views))}
    </span>
  );
}
