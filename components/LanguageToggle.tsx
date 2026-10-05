"use client";

import { useRouter, usePathname } from "next/navigation";
import { type Language } from "@/i18n/config";

export function LanguageToggle({
  currentLang,
  pairedSlug,
}: {
  currentLang: Language;
  pairedSlug?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const switchLang = (newLang: Language) => {
    if (newLang === currentLang) return;

    if (pairedSlug) {
      const segments = pathname.split("/");
      segments[1] = newLang;
      segments[3] = pairedSlug;
      router.push(segments.join("/"));
      return;
    }

    const segments = pathname.split("/");
    segments[1] = newLang;
    router.push(segments.join("/"));
  };

  const target = currentLang === "en" ? "zh" : "en";

  return (
    <button
      type="button"
      onClick={() => switchLang(target)}
      className="mk-lang-toggle"
      aria-label={target === "zh" ? "切换到中文" : "Switch to English"}
      title={target === "zh" ? "切换到中文" : "Switch to English"}
    >
      <span>{currentLang === "en" ? "EN" : "中"}</span>
      <em>⇄</em>
      <span>{target === "en" ? "EN" : "中"}</span>
    </button>
  );
}
