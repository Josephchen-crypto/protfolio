export const languages = ["en", "zh"] as const;
export type Language = (typeof languages)[number];

export const defaultLanguage: Language = "en";

export const languageNames: Record<Language, string> = {
  en: "English",
  zh: "中文",
};

/**
 * Extract the language from the URL path.
 * First segment is the language, falls back to default if invalid.
 */
export function getLangFromUrl(url: { pathname: string }): Language {
  const segments = url.pathname.split("/");
  const lang = segments[1];
  if (lang === "en" || lang === "zh") {
    return lang;
  }
  return defaultLanguage;
}