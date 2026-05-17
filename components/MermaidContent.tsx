"use client";

import { useEffect, useRef } from "react";

export function MermaidContent({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!containerRef.current) return;

    const renderMermaid = async () => {
      const mermaid = (await import("mermaid")).default;

      mermaid.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          primaryColor: "#6366f1",
          primaryTextColor: "#f8fafc",
          primaryBorderColor: "#6366f1",
          lineColor: "#6366f1",
          secondaryColor: "#1e1e2e",
          tertiaryColor: "#111118",
        },
        flowchart: { useMaxWidth: true },
        sequence: { useMaxWidth: true },
      });

      // Transform <pre><code class="language-mermaid"> → <div class="mermaid">
      const codeBlocks =
        containerRef.current?.querySelectorAll("pre code.language-mermaid");
      if (!codeBlocks || codeBlocks.length === 0) return;

      codeBlocks.forEach((codeEl) => {
        const pre = codeEl.parentElement;
        if (!pre) return;
        const text = codeEl.textContent || "";
        const div = document.createElement("div");
        div.className = "mermaid";
        div.textContent = text;
        pre.replaceWith(div);
      });

      try {
        await mermaid.run({ querySelector: ".mermaid" });
      } catch (e) {
        console.error("Mermaid render error:", e);
      }
    };

    renderMermaid();
  }, [content]);

  return (
    <div
      ref={containerRef}
      className="text-slate-300 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
