-- D1 migration: create users and user_identities tables for OAuth authentication
--
-- Schema design:
--   - One row in `users` per human user (can have multiple provider identities)
--   - One row in `user_identities` per connected OAuth provider account
--   - This allows linking multiple providers (GitHub + Google + ...) to the same user
--   - Unique constraint ensures one provider account can't be claimed by multiple users

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS user_identities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- One provider+userId can only belong to one user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_identities_provider_provider_user_id
  ON user_identities(provider, provider_user_id);

CREATE INDEX IF NOT EXISTS idx_user_identities_user_id
  ON user_identities(user_id);
