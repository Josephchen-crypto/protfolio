export const languages = ["en", "zh"] as const;
export type Language = (typeof languages)[number];

export const defaultLanguage: Language = "en";

export const languageNames: Record<Language, string> = {
  en: "English",
  zh: "中文",
};