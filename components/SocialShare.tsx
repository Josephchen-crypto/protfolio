"use client";

import { Link2, Share2 } from "lucide-react";
import { useState } from "react";

const PLATFORMS = [
  {
    id: "x",
    label: "X",
    href: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    href: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: "reddit",
    label: "Reddit",
    href: (url: string, title: string) =>
      `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
  {
    id: "hackernews",
    label: "HN",
    href: (url: string, title: string) =>
      `https://news.ycombinator.com/submitlink?u=${encodeURIComponent(url)}&t=${encodeURIComponent(title)}`,
  },
  {
    id: "pocket",
    label: "Pocket",
    href: (url: string, title: string) =>
      `https://getpocket.com/save?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
];

export function SocialShare({
  url,
  title,
  labels,
}: {
  url: string;
  title: string;
  labels: { share: string; copied: string };
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the URL text
    }
  };

  return (
    <div className="flex items-center gap-3 pt-8 mt-12 border-t border-border">
      <span className="flex items-center gap-2 text-slate-400 text-sm font-medium">
        <Share2 size={14} />
        {labels.share}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {PLATFORMS.map((platform) => (
          <a
            key={platform.id}
            href={platform.href(url, title)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-sm text-slate-400 hover:text-white hover:border-primary/50 transition-all hover:-translate-y-0.5"
          >
            {platform.label}
          </a>
        ))}
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-sm text-slate-400 hover:text-white hover:border-primary/50 transition-all hover:-translate-y-0.5"
        >
          <Link2 size={14} />
          {copied ? labels.copied : labels.share}
        </button>
      </div>
    </div>
  );
}
