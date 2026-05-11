"use client";

import { useRouter, usePathname } from "next/navigation";
import { languages, languageNames, type Language } from "@/i18n/config";
import { clsx } from "clsx";

export function LanguageToggle({ currentLang }: { currentLang: Language }) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLang = (newLang: Language) => {
    if (newLang === currentLang) return;
    const segments = pathname.split("/");
    segments[1] = newLang;
    router.push(segments.join("/"));
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