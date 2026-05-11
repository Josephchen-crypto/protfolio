"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ArrowDown, Github, Linkedin, Mail } from "lucide-react";
import { Button } from "./ui/Button";

export function Hero({
  name,
  title,
  subtitle,
  cta,
  label,
}: {
  name: string;
  title: string;
  subtitle: string;
  cta: string;
  label: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Animate avatar
      tl.fromTo(
        ".hero-avatar",
        { opacity: 0, scale: 0.8, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "power3.out" },
      );

      // Animate label
      tl.fromTo(
        ".hero-label",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
        "-=0.3",
      );

      // Animate name
      tl.fromTo(
        ".hero-name",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
        "-=0.3",
      );

      // Animate title words
      tl.fromTo(
        ".hero-word",
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.03, ease: "power3.out" },
        "-=0.3",
      );

      // Animate subtitle
      tl.fromTo(
        ".hero-subtitle",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" },
        "-=0.2",
      );

      // Animate buttons
      tl.fromTo(
        ".hero-buttons > *",
        { opacity: 0, y: 20, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: "power3.out",
        },
        "-=0.2",
      );

      // Animate social links
      tl.fromTo(
        ".hero-social a",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power3.out" },
        "-=0.2",
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const words = title.split("");

  return (
    <section
      ref={containerRef}
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-neon-purple/10" />

      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-[120px]" />

      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Avatar */}
        <div className="hero-avatar mb-8 opacity-0">
          <div className="relative inline-block">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-primary/50 shadow-lg shadow-primary/20">
              <img
                src="https://avatars.githubusercontent.com/u/4225592?v=4"
                alt="Chen Deji"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-2 border-background"></div>
          </div>
        </div>

        <p className="hero-label text-primary font-mono text-sm mb-4 tracking-[0.3em] opacity-0">
          {label}
        </p>

        {/* Name */}
        <h2 className="hero-name font-heading text-3xl md:text-4xl font-bold text-white mb-2 opacity-0">
          {name}
        </h2>

        {/* Title (profession) */}
        <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight tracking-tight">
          {words.map((word, i) => (
            <span
              key={i}
              className="hero-word inline-block opacity-0"
              style={{ marginRight: word === " " ? "0.25em" : "0" }}
            >
              {word === " " ? "\u00A0" : word}
            </span>
          ))}
        </h1>

        <p className="hero-subtitle text-slate-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto opacity-0">
          {subtitle}
        </p>

        <div className="hero-buttons flex flex-col sm:flex-row gap-4 justify-center mb-12 opacity-0">
          <a href="#projects">
            <Button size="lg" variant="primary">
              {cta}
              <ArrowDown size={18} />
            </Button>
          </a>
          <a
            href="https://github.com/Josephchen-crypto"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" variant="outline">
              <Github size={18} />
              GitHub
            </Button>
          </a>
          <a
            href="https://linkedin.com/in/chendeji"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" variant="outline">
              <Linkedin size={18} />
              LinkedIn
            </Button>
          </a>
        </div>

        <div className="hero-social flex justify-center gap-6 text-slate-500 opacity-0">
          <a
            href="mailto:18701434169@163.com"
            className="hover:text-primary transition-colors"
            aria-label="Email"
          >
            <Mail size={20} />
          </a>
          <a
            href="https://github.com/Josephchen-crypto"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="GitHub"
          >
            <Github size={20} />
          </a>
          <a
            href="https://linkedin.com/in/chendeji"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin size={20} />
          </a>
        </div>
      </div>
    </section>
  );
}
