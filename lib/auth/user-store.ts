import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { NormalizedProfile } from "../auth/providers/types";

/**
 * User record from the `users` table.
 */
export interface UserRecord {
  id: number;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: "admin" | "user";
  created_at: string;
  last_login_at: string | null;
}

/**
 * User identity record from the `user_identities` table.
 * Connects an OAuth provider account to a local user.
 */
export interface UserIdentityRecord {
  id: number;
  user_id: number;
  provider: string;
  provider_user_id: string;
  username: string;
  created_at: string;
}

/**
 * Get the D1 database binding from Cloudflare context.
 */
function getDb(): D1Database | null {
  try {
    const { env } = getCloudflareContext();
    const db = (env as unknown as CloudflareEnv).BLOG_VIEWS_DB;
    return db ?? null;
  } catch {
    // getCloudflareContext throws outside Cloudflare runtime
    return null;
  }
}

/**
 * Find an existing user identity by (provider, provider_user_id).
 * This gives us the local user id if this provider account has logged in before.
 */
export async function findUserByProviderIdentity(
  provider: string,
  providerUserId: string,
): Promise<UserIdentityRecord | null> {
  const db = getDb();
  if (!db) return null;

  try {
    return await db
      .prepare(
        `SELECT * FROM user_identities WHERE provider = ? AND provider_user_id = ?`,
      )
      .bind(provider, providerUserId)
      .first<UserIdentityRecord>();
  } catch {
    return null;
  }
}

/**
 * Find an existing user by email address.
 * Used to automatically link multiple provider identities to the same user
 * if they share the same verified email.
 */
export async function findUserByEmail(
  email: string,
): Promise<UserRecord | null> {
  const db = getDb();
  if (!db || !email) return null;

  try {
    return await db
      .prepare(`SELECT * FROM users WHERE email = ?`)
      .bind(email)
      .first<UserRecord>();
  } catch {
    return null;
  }
}

/**
 * Get a user by primary key id.
 */
export async function getUserById(id: number): Promise<UserRecord | null> {
  const db = getDb();
  if (!db) return null;

  try {
    return await db
      .prepare(`SELECT * FROM users WHERE id = ?`)
      .bind(id)
      .first<UserRecord>();
  } catch {
    return null;
  }
}

/**
 * Create a new local user and link the given provider identity to it in one transaction.
 * Called when a user logs in with a provider for the first time and we can't
 * find an existing user by identity or by email.
 */
export async function createUserWithIdentity(
  profile: NormalizedProfile,
  role: "admin" | "user",
): Promise<UserRecord | null> {
  const db = getDb();
  if (!db) return null;

  try {
    // Start transaction via D1 batch
    const createUser = db
      .prepare(
        `INSERT INTO users (email, display_name, avatar_url, role) VALUES (?, ?, ?, ?)`,
      )
      .bind(profile.email ?? null, profile.displayName, profile.avatarUrl, role);

    // D1 batch returns the last result → we need the insert id after creating user
    const userResult = await db.batch([createUser]);
    const userInsert = userResult[0];
    if (!userInsert.success) return null;

    const userId = userInsert.meta.last_row_id;
    if (!userId) return null;

    const createIdentity = db
      .prepare(
        `INSERT INTO user_identities (user_id, provider, provider_user_id, username) VALUES (?, ?, ?, ?)`,
      )
      .bind(userId, profile.provider, profile.providerUserId, profile.username);

    const identityResult = await db.batch([createIdentity]);
    if (!identityResult[0].success) return null;

    return getUserById(userId);
  } catch {
    return null;
  }
}

/**
 * Link an existing provider identity to an existing user.
 * Used when we find an existing user by email (different provider but same email).
 */
export async function linkIdentityToUser(
  userId: number,
  profile: NormalizedProfile,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    const result = await db
      .prepare(
        `INSERT INTO user_identities (user_id, provider, provider_user_id, username) VALUES (?, ?, ?, ?)`,
      )
      .bind(userId, profile.provider, profile.providerUserId, profile.username)
      .run();

    return result.success;
  } catch {
    return false;
  }
}

/**
 * Update the `last_login_at` timestamp for a user.
 * Called after every successful login to track activity.
 */
export async function updateLastLogin(userId: number): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  try {
    const result = await db
      .prepare(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(userId)
      .run();

    return result.success;
  } catch {
    return false;
  }
}
