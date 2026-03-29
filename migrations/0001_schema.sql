CREATE TABLE IF NOT EXISTS site_config (
  site_key TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages (slug);
CREATE INDEX IF NOT EXISTS idx_pages_type ON pages (page_type);
