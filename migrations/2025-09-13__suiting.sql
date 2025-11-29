-- Suiting tables for kits and handles
CREATE TABLE IF NOT EXISTS kit_suiting (
  kit_id TEXT NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  model TEXT,
  finish TEXT,
  type TEXT,
  width_min INT,
  width_max INT,
  height_min INT,
  height_max INT,
  PRIMARY KEY (kit_id, model, finish, type)
);

CREATE TABLE IF NOT EXISTS handle_suiting (
  handle_id TEXT NOT NULL REFERENCES handles(id) ON DELETE CASCADE,
  model TEXT,
  finish TEXT,
  type TEXT,
  width_min INT,
  width_max INT,
  height_min INT,
  height_max INT,
  PRIMARY KEY (handle_id, model, finish, type)
);

CREATE INDEX IF NOT EXISTS idx_kit_suiting_model ON kit_suiting(model, finish, type);
CREATE INDEX IF NOT EXISTS idx_handle_suiting_model ON handle_suiting(model, finish, type);
