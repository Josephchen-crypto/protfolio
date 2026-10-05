"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

type SearchPost = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  lang: string;
};

export function KnowledgeSearch({
  posts,
  placeholder,
}: {
  posts: SearchPost[];
  placeholder: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");

  const categories = useMemo(
    () => ["ALL", ...Array.from(new Set(posts.map((p) => p.category || "TECH")))],
    [posts]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = category === "ALL" || (post.category || "TECH") === category;
      const haystack = [post.title, post.summary, post.category].join(" ").toLowerCase();
      return matchesCategory && (!q || haystack.includes(q));
    });
  }, [posts, query, category]);

  return (
    <section className="mk-search-page">
      <div className="mk-search-input-wrap">
        <Search size={17} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          autoFocus
        />
        <kbd>⌘K</kbd>
      </div>

      <div className="mk-search-filters">
        {categories.map((item) => (
          <button
            type="button"
            key={item}
            className={item === category ? "is-active" : ""}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mk-search-results">
        {results.map((post, index) => (
          <Link href={`/${post.lang}/blog/${post.slug}`} className="mk-post-row" key={post.slug}>
            <span className="mk-post-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="mk-post-copy">
              <small>{post.category || "TECH NOTE"}</small>
              <b>{post.title}</b>
              <p>{post.summary}</p>
            </span>
            <ArrowRight size={15} />
          </Link>
        ))}

        {results.length === 0 && (
          <div className="mk-search-empty">No matching knowledge found.</div>
        )}
      </div>
    </section>
  );
}
