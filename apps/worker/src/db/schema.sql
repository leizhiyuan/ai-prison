CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  provider TEXT NOT NULL,
  incident_count INTEGER DEFAULT 0,
  severity_score REAL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  model_id TEXT NOT NULL REFERENCES models(id),
  title TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description TEXT NOT NULL,
  description_en TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('hallucination','bias','safety','privacy','other')),
  severity INTEGER NOT NULL CHECK(severity BETWEEN 1 AND 5),
  source_url TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_model ON cases(model_id);
CREATE INDEX IF NOT EXISTS idx_cases_created ON cases(created_at DESC);
