"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Calendar } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Post {
  slug: string;
  title: string;
  date: string;
  summary: string;
  icon?: string | null;
  cover?: string | null;
  lang: string;
}

export function Blog({
  title,
  posts,
  viewAllLabel,
}: {
  title: string;
  posts: Post[];
  viewAllLabel: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".blog-card",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="blog" ref={sectionRef} className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {title && (
          <div className="mb-12">
            <div className="w-12 h-0.5 bg-gradient-to-r from-primary to-neon-cyan rounded-full mb-4" />
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
              {title}
            </h2>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <a
              key={post.slug}
              href={`/${post.lang}/blog/${post.slug}`}
              className="blog-card group block bg-surface border border-border rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
            >
              {/* Cover image */}
              <div className="relative h-44 md:h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-neon-purple/10">
                {post.cover ? (
                  <>
                    <img
                      src={post.cover}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
                  </>
                ) : null}

                {/* Icon badge */}
                {post.icon && (
                  <div className="absolute top-3 left-3">
                    {post.icon.length > 2 ? (
                      <img
                        src={post.icon}
                        alt=""
                        className="w-9 h-9 rounded-lg ring-2 ring-white/10"
                      />
                    ) : (
                      <span className="text-2xl drop-shadow-lg">{post.icon}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <div className="flex items-center gap-3 text-slate-500 text-xs mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {post.date}
                  </span>
                </div>

                <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4">
                  {post.summary}
                </p>

                <div className="flex items-center gap-1.5 text-primary text-sm font-medium group-hover:gap-2.5 transition-all">
                  {viewAllLabel}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
