"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionTitle } from "./ui/SectionTitle";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function Skills({
  title,
  items,
}: {
  title: string;
  items: Array<{ name: string; level: number }>;
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      // Animate skill bars
      const bars = sectionRef.current?.querySelectorAll(".skill-bar-fill");
      bars?.forEach((bar) => {
        const width = bar.getAttribute("data-width");
        gsap.fromTo(
          bar,
          { width: 0 },
          {
            width: `${width}%`,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: bar,
              start: "top 90%",
            },
          }
        );
      });

      // Animate skill items
      gsap.fromTo(
        ".skill-item",
        { opacity: 0, scale: 0.8, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
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
    <section id="skills" ref={sectionRef} className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <SectionTitle title={title} />

        <div className="grid gap-6">
          {items.map((skill, index) => (
            <div key={index} className="skill-item">
              <div className="flex justify-between mb-2">
                <span className="text-white font-medium">{skill.name}</span>
                <span className="text-slate-400 font-mono text-sm">
                  {skill.level}%
                </span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className="skill-bar-fill h-full bg-gradient-to-r from-primary to-neon-cyan rounded-full"
                  data-width={skill.level}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}