CREATE TABLE IF NOT EXISTS blog_post_views (
  post_key TEXT PRIMARY KEY,
  lang TEXT NOT NULL,
  slug TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_post_views_lang_slug
ON blog_post_views(lang, slug);
