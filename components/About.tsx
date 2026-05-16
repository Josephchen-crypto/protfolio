"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SectionTitle } from "./ui/SectionTitle";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function About({
  title,
  content,
  stats,
  statLabels,
}: {
  title: string;
  content: string;
  stats: {
    years: string;
    projects: string;
    companies: string;
    languages: string;
  };
  statLabels: {
    years: string;
    projects: string;
    companies: string;
    languages: string;
  };
}) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".about-content",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
          },
        }
      );

      gsap.fromTo(
        ".about-stat",
        { opacity: 0, y: 30, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".about-stats",
            start: "top 85%",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const statItems = [
    { value: stats.years, label: statLabels.years },
    { value: stats.projects, label: statLabels.projects },
    { value: stats.companies, label: statLabels.companies },
    { value: stats.languages, label: statLabels.languages },
  ];

  return (
    <section id="about" ref={sectionRef} className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <SectionTitle title={title} />

        <div className="about-content relative bg-surface border border-border rounded-2xl p-8 md:p-12 opacity-0 overflow-hidden">
          {/* Subtle gradient corner */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />

          <p className="text-slate-300 text-lg leading-relaxed whitespace-pre-line relative z-10">
            {content}
          </p>

          <div className="about-stats grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-10 border-t border-border relative z-10">
            {statItems.map((stat, index) => (
              <div key={index} className="about-stat text-center">
                <p className="text-primary font-bold text-3xl md:text-4xl mb-2">
                  {stat.value}
                </p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
