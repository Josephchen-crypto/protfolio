import { Language, defaultLanguage } from "./config";

export type { Language } from "./config";

export function getDict(lang: Language) {
  const dictionaries = {
    en: () => import("./dicts/en.json").then((m) => m.default),
    zh: () => import("./dicts/zh.json").then((m) => m.default),
  };
  return dictionaries[lang]();
}

export type Dict = Awaited<ReturnType<typeof getDict>>;