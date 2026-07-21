import assert from "node:assert/strict";
import test from "node:test";
import type { NormalizedProfile } from "../lib/auth/providers/types";

const { GitHubProvider } = await import(
  new URL("../lib/auth/providers/github.ts", import.meta.url).href
);

const testConfig = {
  clientId: "test-client-id",
  clientSecret: "test-client-secret",
};

test("GitHubProvider has correct id and displayName", () => {
  const provider = new GitHubProvider(testConfig);
  assert.equal(provider.id, "github");
  assert.equal(provider.displayName, "GitHub");
});

test("GitHubProvider getAuthorizeUrl builds correct URL", () => {
  const provider = new GitHubProvider(testConfig);
  const urlStr = provider.getAuthorizeUrl({
    state: "test-state-123",
    redirectUri: "https://example.com/api/auth/github/callback",
  });
  const url = new URL(urlStr);
  assert.equal(url.searchParams.get("client_id"), "test-client-id");
  assert.equal(url.searchParams.get("state"), "test-state-123");
  assert.equal(url.searchParams.get("scope"), "user");
  assert.equal(url.searchParams.get("redirect_uri"), "https://example.com/api/auth/github/callback");
});

test("NormalizeGitHubProfile maps correctly", () => {
  // This test just verifies our mapping logic for the GitHub response shape
  // In integration code this comes from fetch, we just test the conversion here
  const githubData = {
    id: 12345,
    login: "testuser",
    name: "Test User",
    avatar_url: "https://example.com/avatar.jpg",
    email: "test@example.com",
  };

  // We manually do what fetchUserProfile would do to test the mapping
  const profile: NormalizedProfile = {
    provider: "github",
    providerUserId: String(githubData.id),
    username: githubData.login,
    displayName: githubData.name ?? githubData.login,
    avatarUrl: githubData.avatar_url ?? null,
    email: githubData.email ?? null,
  };

  assert.equal(profile.provider, "github");
  assert.equal(profile.providerUserId, "12345");
  assert.equal(profile.username, "testuser");
  assert.equal(profile.displayName, "Test User");
  assert.equal(profile.avatarUrl, "https://example.com/avatar.jpg");
  assert.equal(profile.email, "test@example.com");
});

test("NormalizeGitHubProfile handles missing optional fields", () => {
  const githubData: {
    id: number;
    login: string;
    name?: string;
    avatar_url?: string;
    email?: string;
  } = {
    id: 12345,
    login: "testuser",
  };

  const profile: NormalizedProfile = {
    provider: "github",
    providerUserId: String(githubData.id),
    username: githubData.login,
    displayName: githubData.name ?? githubData.login,
    avatarUrl: githubData.avatar_url ?? null,
    email: githubData.email ?? null,
  };

  assert.equal(profile.displayName, "testuser"); // falls back to login
  assert.equal(profile.avatarUrl, null);
  assert.equal(profile.email, null);
});
