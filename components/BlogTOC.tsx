"use client";

import { useEffect, useRef, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function BlogTOC({ content }: { content: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const headingElementsRef = useRef<Map<string, IntersectionObserverEntry>>(new Map());

  useEffect(() => {
    // Parse headings from the HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      `<div>${content}</div>`,
      "text/html"
    );
    const elements = doc.querySelectorAll("h2, h3");
    const items: Heading[] = [];
    elements.forEach((el, index) => {
      const text = el.textContent || "";
      const id = `heading-${index}-${text
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
        .replace(/(^-|-$)/g, "")}`;
      // Assign ID so real DOM elements match
      el.id = id;
      items.push({ id, text, level: el.tagName === "H2" ? 2 : 3 });
    });
    setHeadings(items);

    // Wait for next frame then observe the real heading elements
    const raf = requestAnimationFrame(() => {
      const realElements = items
        .map((h) => document.getElementById(h.id))
        .filter(Boolean) as HTMLElement[];

      if (realElements.length === 0) return;

      observerRef.current?.disconnect();

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            headingElementsRef.current.set(entry.target.id, entry);
          });

          // Find the first heading that is above the top or visible
          const visibleEntries: IntersectionObserverEntry[] = [];
          headingElementsRef.current.forEach((value) => {
            if (value.isIntersecting || value.boundingClientRect.top < 0) {
              visibleEntries.push(value);
            }
          });

          if (visibleEntries.length > 0) {
            // Sort by position: the one closest to the top (but negative = above viewport)
            const sorted = visibleEntries.sort(
              (a, b) =>
                Math.abs(a.boundingClientRect.top) -
                Math.abs(b.boundingClientRect.top)
            );
            setActiveId(sorted[0].target.id);
          }
        },
        {
          rootMargin: "-80px 0px -60% 0px",
          threshold: [0, 0.25, 0.5, 1],
        }
      );

      realElements.forEach((el) => observer.observe(el));
      observerRef.current = observer;
    });

    return () => {
      cancelAnimationFrame(raf);
      observerRef.current?.disconnect();
    };
    // Only parse when content changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (headings.length < 2) return null;

  return (
    <nav className="hidden xl:block sticky top-32 w-56 shrink-0" aria-label="Table of contents">
      <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          On this page
        </h3>
        <ul className="space-y-1.5">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={`block text-sm py-1 transition-colors border-l-2 pl-3 ${
                  activeId === h.id
                    ? "text-primary border-primary font-medium"
                    : "text-slate-500 border-transparent hover:text-slate-300 hover:border-slate-600"
                } ${h.level === 3 ? "pl-6" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(h.id);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                    // Update active immediately
                    setActiveId(h.id);
                  }
                }}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
