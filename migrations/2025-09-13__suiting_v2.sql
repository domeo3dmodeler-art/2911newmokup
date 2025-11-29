-- Recreate suiting tables with nullable fields and surrogate PK

DROP TABLE IF EXISTS kit_suiting;
DROP TABLE IF EXISTS handle_suiting;

CREATE TABLE kit_suiting (
  id BIGSERIAL PRIMARY KEY,
  kit_id TEXT NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  model TEXT,
  finish TEXT,
  type TEXT,
  width_min INT,
  width_max INT,
  height_min INT,
  height_max INT
);

-- уникальность набора признаков (как раньше PK), но через UNIQUE INDEX
CREATE UNIQUE INDEX IF NOT EXISTS uq_kit_suiting ON kit_suiting(kit_id, model, finish, type);
CREATE INDEX IF NOT EXISTS idx_kit_suiting_model ON kit_suiting(model, finish, type);

CREATE TABLE handle_suiting (
  id BIGSERIAL PRIMARY KEY,
  handle_id TEXT NOT NULL REFERENCES handles(id) ON DELETE CASCADE,
  model TEXT,
  finish TEXT,
  type TEXT,
  width_min INT,
  width_max INT,
  height_min INT,
  height_max INT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_handle_suiting ON handle_suiting(handle_id, model, finish, type);
CREATE INDEX IF NOT EXISTS idx_handle_suiting_model ON handle_suiting(model, finish, type);
