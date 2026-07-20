import type { NormalizedProfile } from "../auth/providers/types";

/**
 * Parse the admin whitelist from the comma-separated environment variable.
 * Trims whitespace and filters out empty entries.
 *
 * Example: "chenduji,johndoe" → ["chenduji", "johndoe"]
 */
export function parseAdminWhitelist(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Check if a given username is in the admin whitelist.
 */
export function isAdminUser(username: string, whitelist: string[]): boolean {
  return whitelist.includes(username);
}

/**
 * Determine the user's role based on their profile and the admin whitelist.
 *
 * If the username matches any entry in the whitelist → "admin", else → "user".
 */
export function determineRole(
  profile: NormalizedProfile,
  whitelist: string[],
): "admin" | "user" {
  return isAdminUser(profile.username, whitelist) ? "admin" : "user";
}
