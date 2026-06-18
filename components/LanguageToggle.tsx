"use client";

import { useRouter, usePathname } from "next/navigation";
import { languages, languageNames, type Language } from "@/i18n/config";
import { clsx } from "clsx";

export function LanguageToggle({ currentLang, pairedSlug }: { currentLang: Language; pairedSlug?: string | null }) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLang = (newLang: Language) => {
    if (newLang === currentLang) return;
    // On a blog post page with paired slug, use the paired slug
    if (pairedSlug) {
      const segments = pathname.split("/");
      // Replace language and slug: /en/blog/current-slug → /zh/blog/paired-slug
      segments[1] = newLang;
      segments[3] = pairedSlug;
      router.push(segments.join("/"));
    } else {
      const segments = pathname.split("/");
      segments[1] = newLang;
      router.push(segments.join("/"));
    }
  };

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => switchLang(lang)}
          className={clsx(
            "px-3 py-1 text-sm rounded transition-colors",
            currentLang === lang
              ? "bg-primary text-white"
              : "text-slate-400 hover:text-white"
          )}
        >
          {languageNames[lang]}
        </button>
      ))}
    </div>
  );
}