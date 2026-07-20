import type {
  OAuthProvider,
  ProviderConfig,
  AuthorizeUrlParams,
  TokenResponse,
  NormalizedProfile,
} from "./types";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_API_URL = "https://api.github.com/user";

// GitHub requires a User-Agent header on all API requests, otherwise it
// rejects with 403. In Workers/Node fetch this isn't set automatically.
const GITHUB_USER_AGENT = "portfolio-oauth-app";

/**
 * GitHub OAuth 2.0 provider implementation.
 *
 * Scope: `user` → get public profile + email.
 * Docs: https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps
 */
export class GitHubProvider implements OAuthProvider {
  readonly id = "github" as const;
  readonly displayName = "GitHub";
  private readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  getAuthorizeUrl({ state, redirectUri }: AuthorizeUrlParams): string {
    const url = new URL(GITHUB_AUTHORIZE_URL);
    url.searchParams.set("client_id", this.config.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("state", state);
    url.searchParams.set("scope", "user");
    return url.toString();
  }

  async exchangeCodeForToken(
    code: string,
    redirectUri: string,
  ): Promise<TokenResponse> {
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(GITHUB_ACCESS_TOKEN_URL, {
      method: "POST",
      body,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": GITHUB_USER_AGENT,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `GitHub exchangeCodeForToken failed: ${response.status} ${text}`,
      );
    }

    // GitHub can return HTTP 200 with an error body — e.g. when the code has
    // already been used, redirect_uri mismatch, or client_secret is wrong.
    // Detect and surface these instead of silently passing undefined downstream.
    const data: {
      access_token?: string;
      token_type?: string;
      scope?: string;
      error?: string;
      error_description?: string;
    } = await response.json();

    if (data.error || !data.access_token) {
      throw new Error(
        `GitHub exchangeCodeForToken returned error: ${data.error ?? "no_access_token"} - ${data.error_description ?? "no description"}`,
      );
    }

    return {
      accessToken: data.access_token,
      tokenType: data.token_type ?? "bearer",
      scope: data.scope ?? null,
    };
  }

  async fetchUserProfile(accessToken: string): Promise<NormalizedProfile> {
    const response = await fetch(GITHUB_USER_API_URL, {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/json",
        "User-Agent": GITHUB_USER_AGENT,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `GitHub fetchUserProfile failed: ${response.status} ${text}`,
      );
    }

    const data: {
      id: number;
      login: string;
      name?: string;
      avatar_url?: string;
      email?: string;
    } = await response.json();

    // GitHub returns: id (number), login, name, avatar_url, email
    return {
      provider: "github",
      providerUserId: String(data.id),
      username: data.login,
      displayName: data.name ?? data.login,
      avatarUrl: data.avatar_url ?? null,
      email: data.email ?? null,
    };
  }
}
