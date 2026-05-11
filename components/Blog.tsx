"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Card } from "./ui/Card";
import { SectionTitle } from "./ui/SectionTitle";
import { ArrowRight } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface Post {
  slug: string;
  title: string;
  date: string;
  summary: string;
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
        <SectionTitle title={title} />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {posts.map((post) => (
            <Card key={post.slug} hover className="blog-card flex flex-col h-full group">
              <span className="text-slate-500 text-sm mb-3">{post.date}</span>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-slate-400 text-sm flex-grow leading-relaxed">
                {post.summary}
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <a
                  href={`/${post.lang}/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-primary hover:gap-3 transition-all text-sm font-medium"
                >
                  {viewAllLabel} <ArrowRight size={14} />
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
