"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Card } from "./ui/Card";
import { SectionTitle } from "./ui/SectionTitle";
import { ExternalLink } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function Projects({
  title,
  items,
}: {
  title: string;
  items: Array<{
    name: string;
    period: string;
    description: string;
    tech: string[];
    link: string;
  }>;
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".project-card",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
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
    <section id="projects" ref={sectionRef} className="py-24 px-6 bg-surface/50">
      <div className="max-w-6xl mx-auto">
        <SectionTitle title={title} />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((project, index) => (
            <Card key={index} hover className="project-card flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{project.name}</h3>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-primary transition-colors flex-shrink-0"
                    aria-label="External link"
                  >
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>

              <span className="text-primary font-mono text-xs mb-3">
                {project.period}
              </span>

              <p className="text-slate-400 text-sm mb-4 flex-grow leading-relaxed">
                {project.description}
              </p>

              <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-border">
                {project.tech.map((t, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
