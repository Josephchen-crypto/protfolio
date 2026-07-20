import assert from "node:assert/strict";
import test from "node:test";
import type { NormalizedProfile } from "../lib/auth/providers/types";

const {
  parseAdminWhitelist,
  isAdminUser,
  determineRole,
} = await import(new URL("../lib/auth/roles.ts", import.meta.url).href);

test("parseAdminWhitelist parses comma-separated and trims", () => {
  assert.deepEqual(parseAdminWhitelist(undefined), []);
  assert.deepEqual(parseAdminWhitelist(""), []);
  assert.deepEqual(parseAdminWhitelist("   alice  ,   bob  "), ["alice", "bob"]);
  assert.deepEqual(parseAdminWhitelist("chenduji"), ["chenduji"]);
});

test("isAdminUser correctly checks membership", () => {
  const whitelist = ["alice", "bob"];
  assert.equal(isAdminUser("alice", whitelist), true);
  assert.equal(isAdminUser("bob", whitelist), true);
  assert.equal(isAdminUser("charlie", whitelist), false);
  assert.equal(isAdminUser("", whitelist), false);
});

test("determineRole returns admin when username is in whitelist, user otherwise", () => {
  const whitelist = ["alice"];

  const profileAlice: NormalizedProfile = {
    provider: "github",
    providerUserId: "1",
    username: "alice",
    displayName: "Alice",
    avatarUrl: null,
    email: null,
  };
  assert.equal(determineRole(profileAlice, whitelist), "admin");

  const profileBob: NormalizedProfile = {
    provider: "github",
    providerUserId: "2",
    username: "bob",
    displayName: "Bob",
    avatarUrl: null,
    email: null,
  };
  assert.equal(determineRole(profileBob, whitelist), "user");
});
