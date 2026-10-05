"use client";

import { useEffect, useRef, useState } from "react";

interface Heading {
  id: string;
  text: string;
  level: number;
}

export function BlogTOC({ content }: { content: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${content}</div>`, "text/html");
    const items = Array.from(doc.querySelectorAll("h2[id], h3[id]")).map((el) => ({
      id: el.getAttribute("id") || "",
      text: el.textContent || "",
      level: el.tagName === "H2" ? 2 : 3,
    })).filter((item) => item.id);

    setHeadings(items);
    if (!items.length) return;

    const raf = requestAnimationFrame(() => {
      const elements = items
        .map((item) => document.getElementById(item.id))
        .filter(Boolean) as HTMLElement[];

      observerRef.current?.disconnect();
      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible[0]) setActiveId(visible[0].target.id);
        },
        { rootMargin: "-90px 0px -72% 0px", threshold: [0, .2, .6] }
      );

      elements.forEach((el) => observer.observe(el));
      observerRef.current = observer;
    });

    return () => {
      cancelAnimationFrame(raf);
      observerRef.current?.disconnect();
    };
  }, [content]);

  if (headings.length < 2) return null;

  return (
    <nav className="mk-toc" aria-label="Table of contents">
      {headings.map((heading, index) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          className={[
            activeId === heading.id ? "is-active" : "",
            heading.level === 3 ? "is-child" : "",
          ].join(" ")}
          onClick={(event) => {
            event.preventDefault();
            document.getElementById(heading.id)?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
            setActiveId(heading.id);
          }}
        >
          <span>{String(index + 1).padStart(2, "0")}</span>
          <b>{heading.text}</b>
        </a>
      ))}
    </nav>
  );
}
