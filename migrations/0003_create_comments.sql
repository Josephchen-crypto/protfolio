-- D1 migration: comments table for blog post comments.
--
-- Schema:
--   - Each comment belongs to a post (via post_key).
--   - parent_id supports single-level nesting (reply to a comment).
--   - user_id references the users table so we can show author info.
--   - ON DELETE CASCADE: if a parent comment is deleted, its replies go too.

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_key TEXT NOT NULL,
  lang TEXT NOT NULL,
  slug TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_comments_post_key ON comments(post_key);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);