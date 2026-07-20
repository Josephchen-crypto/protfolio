import type { ProviderId, OAuthProvider } from "./types";
import { GitHubProvider } from "./github";

/**
 * Registry of all enabled OAuth providers.
 *
 * When adding a new provider:
 *   1. Import the new provider class
 *   2. Add an entry to this map with the provider id as the key
 *   3. Update the ProviderId union type in ./types.ts
 *   4. Add env var placeholders to .dev.vars.example
 * The rest of the system (routes, login page) automatically picks it up —
 * no other code changes needed.
 */
const PROVIDERS: Partial<Record<ProviderId, OAuthProvider>> = {};

// Initialize GitHub if env vars are present
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;
if (githubClientId && githubClientSecret) {
  PROVIDERS.github = new GitHubProvider({
    clientId: githubClientId,
    clientSecret: githubClientSecret,
  });
}

// Future: Google
// const googleClientId = process.env.GOOGLE_CLIENT_ID;
// const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
// if (googleClientId && googleClientSecret) {
//   PROVIDERS.google = new GoogleProvider({ clientId: googleClientId, clientSecret: googleClientSecret });
// }

export { PROVIDERS };

/**
 * Get a provider by id. Returns undefined if it's not enabled (missing
 * env vars).
 */
export function getProvider(id: ProviderId): OAuthProvider | undefined {
  return PROVIDERS[id];
}

/**
 * List all enabled providers (have env vars configured). The login page
 * renders a button for each enabled provider.
 */
export function listEnabledProviders(): OAuthProvider[] {
  return Object.values(PROVIDERS).filter(
    (p): p is OAuthProvider => p !== undefined,
  );
}
