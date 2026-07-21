-- D1 migration: per-view event log for trend / today-view aggregation.
--
-- `blog_post_views` already stores the running total per post. This new table
-- appends one row per successful view increment so we can aggregate by day /
-- month and answer questions like "views today" and "views over the last N days".
--
-- Kept intentionally narrow: only the fields we need, indexed on the two
-- filter dimensions we query (created_at range + post_key equality).

CREATE TABLE IF NOT EXISTS blog_view_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_key TEXT NOT NULL,        -- "en:slug" — matches blog_post_views.post_key
  lang TEXT NOT NULL,            -- "en" | "zh"
  slug TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blog_view_events_created_at
  ON blog_view_events(created_at);

CREATE INDEX IF NOT EXISTS idx_blog_view_events_post_key
  ON blog_view_events(post_key);
