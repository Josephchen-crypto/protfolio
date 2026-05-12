"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { LanguageToggle } from "./LanguageToggle";
import { type Language } from "@/i18n/config";
import { clsx } from "clsx";
import { type Dict } from "@/i18n";

export function Navigation({ lang, dict }: { lang: Language; dict: Dict }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { key: "about", href: `/${lang}#about` },
    { key: "experience", href: `/${lang}#experience` },
    { key: "skills", href: `/${lang}#skills` },
    { key: "projects", href: `/${lang}#projects` },
    { key: "blog", href: `/${lang}/blog` },
    { key: "contact", href: `/${lang}#contact` },
  ] as const;

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border"
          : "bg-transparent",
      )}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a
          href={`/${lang}`}
          className="font-heading font-bold text-xl text-white tracking-wider"
        >
          JC
        </a>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              {dict.nav[item.key]}
            </a>
          ))}
          <LanguageToggle currentLang={lang} />
        </div>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="px-6 py-4 flex flex-col gap-4">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                {dict.nav[item.key]}
              </a>
            ))}
            <LanguageToggle currentLang={lang} />
          </div>
        </div>
      )}
    </nav>
  );
}
