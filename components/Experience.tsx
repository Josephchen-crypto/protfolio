"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionTitle } from "./ui/SectionTitle";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function Experience({
  title,
  items,
}: {
  title: string;
  items: Array<{
    company: string;
    position: string;
    period: string;
    description: string;
  }>;
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      items.forEach((_, index) => {
        gsap.fromTo(
          `.timeline-item-${index}`,
          { opacity: 0, x: index % 2 === 0 ? -40 : 40 },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: `.timeline-item-${index}`,
              start: "top 85%",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [items.length]);

  return (
    <section id="experience" ref={sectionRef} className="py-24 px-6 bg-surface/50">
      <div className="max-w-4xl mx-auto">
        <SectionTitle title={title} />

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-border md:transform md:-translate-x-px" />

          {items.map((item, index) => (
            <div
              key={index}
              className={`timeline-item-${index} relative pl-8 md:pl-0 ${
                index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"
              } mb-12 group`}
            >
              {/* Timeline dot */}
              <div className="absolute left-0 md:left-1/2 w-4 h-4 rounded-full bg-primary border-4 border-background -translate-x-[6px] md:translate-x-[-8px] group-hover:bg-neon-cyan transition-colors" />

              <div
                className={`bg-surface border border-border rounded-xl p-6 transition-all duration-300 group-hover:border-primary/50 ${
                  index % 2 === 0 ? "md:ml-auto" : ""
                }`}
              >
                <span className="text-primary font-mono text-sm">{item.period}</span>
                <h3 className="text-xl font-bold text-white mt-2">{item.position}</h3>
                <p className="text-neon-cyan text-sm mt-1">{item.company}</p>
                <p className="text-slate-400 mt-3 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}