export const BLOG_VIEW_DEDUPE_WINDOW_MS = 12 * 60 * 60 * 1000;

export type SupportedLanguage = "en" | "zh";

export type ViewPayload = {
  lang: SupportedLanguage;
  slug: string;
};

export type ViewRow = {
  post_key: string;
  views: number;
};

export function buildPostKey(lang: SupportedLanguage, slug: string): string {
  return `${lang}:${slug}`;
}

export function getViewStorageKey(postKey: string): string {
  return `blog:view-counted:${postKey}`;
}

export function parseViewKeysParam(raw: string | null): string[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeViewRows(keys: string[], rows: ViewRow[]): Record<string, number> {
  const rowMap = new Map(rows.map((row) => [row.post_key, row.views]));

  return Object.fromEntries(keys.map((key) => [key, rowMap.get(key) ?? 0]));
}

export function shouldCountView(lastCountedAt?: number, now = Date.now()): boolean {
  if (!lastCountedAt) {
    return true;
  }

  return now - lastCountedAt >= BLOG_VIEW_DEDUPE_WINDOW_MS;
}

export function isValidViewPayload(value: unknown): value is ViewPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const lang = Reflect.get(value, "lang");
  const slug = Reflect.get(value, "slug");

  return (lang === "en" || lang === "zh") && typeof slug === "string" && slug.trim().length > 0;
}
