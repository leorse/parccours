CREATE TABLE IF NOT EXISTS progress (
  user_id TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
