import { randomBytes } from "crypto";
import type { Language } from "@/i18n/config";

/**
 * OAuth state format: `random:lang`
 *
 * Why encode the language here? So after the OAuth callback we can redirect
 * back to the correct language version of the site (the user started the flow on
 * either /en/login or /zh/login, we want to end up back on the same language).
 *
 * The random part prevents CSRF: we store it in an HTTP-only cookie and compare
 * it in the callback. The attacker can't read or write this cookie.
 */
export interface OAuthState {
  random: string;
  lang: Language;
}

/**
 * Generate a new random OAuth state with the current language encoded.
 */
export function generateState(lang: Language): string {
  const random = randomBytes(16).toString("hex");
  return `${random}:${lang}`;
}

/**
 * Parse a state string back into random and language.
 * Returns null if parsing fails.
 */
export function parseState(state: string): OAuthState | null {
  const parts = state.split(":", 2);
  if (parts.length !== 2) return null;
  const [random, lang] = parts;
  if (random.length !== 32) return null; // 16 bytes → 32 hex chars
  if (lang !== "en" && lang !== "zh") return null;
  return { random, lang };
}

/**
 * Validate the state from the query against the state from the cookie.
 * They must match exactly (including the random part).
 */
export function validateState(
  stateFromCookie: string | undefined,
  stateFromQuery: string,
): boolean {
  if (!stateFromCookie) return false;
  return stateFromCookie === stateFromQuery;
}
