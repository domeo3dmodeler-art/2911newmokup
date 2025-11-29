-- === Canonical catalog for Doors ===
-- Таблица products + совместимый VIEW doors_catalog.
-- Идемпотентно: можно выполнять многократно.

CREATE TABLE IF NOT EXISTS products (
  id                   BIGSERIAL PRIMARY KEY,
  model                TEXT    NOT NULL,
  finish               TEXT    NOT NULL,
  color                TEXT    NOT NULL,  -- импорт: domeo_color -> color
  type                 TEXT    NOT NULL,
  width                INT     NOT NULL,
  height               INT     NOT NULL,
  rrc_price            NUMERIC NOT NULL,
  sku_1c               TEXT,
  -- витринные атрибуты
  style                TEXT,
  model_photo          TEXT,
  -- метаданные
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- уникальность одной двери
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='products_uq'
  ) THEN
    CREATE UNIQUE INDEX products_uq
      ON products (model, finish, color, type, width, height);
  END IF;
END $$;

-- индексы для быстрых distinct в /options
CREATE INDEX IF NOT EXISTS products_model_idx  ON products (model);
CREATE INDEX IF NOT EXISTS products_style_idx  ON products (style);
CREATE INDEX IF NOT EXISTS products_finish_idx ON products (finish);
CREATE INDEX IF NOT EXISTS products_color_idx  ON products (color);
CREATE INDEX IF NOT EXISTS products_type_idx   ON products (type);

-- автообновление updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_updated_at'
  ) THEN
    CREATE TRIGGER trg_products_updated_at
      BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- Совместимость с текущими роутами: VIEW doors_catalog
DROP VIEW IF EXISTS doors_catalog;
CREATE VIEW doors_catalog AS
SELECT
  id, model, style, finish, color, type, width, height, rrc_price, sku_1c, model_photo
FROM products;

-- Мини-демо SKU (upsert по уникальному ключу)
INSERT INTO products (model,finish,color,type,width,height,rrc_price,sku_1c,style,model_photo) VALUES
  ('PG Base 1','Нанотекс','Белый','Распашная',800,2000,15900,'SKU-PG1-800x2000-BEL','Современная',NULL),
  ('PG Base 1','Нанотекс','Белый','Распашная',900,2000,16900,'SKU-PG1-900x2000-BEL','Современная',NULL),
  ('PG Base 1','Нанотекс','Серый','Распашная',800,2000,15900,'SKU-PG1-800x2000-SER','Современная',NULL),
  ('PG Base 2','Эмаль','Белый','Распашная',800,2000,18900,'SKU-PG2-800x2000-BEL','Современная',NULL)
ON CONFLICT (model,finish,color,type,width,height) DO UPDATE
SET rrc_price=EXCLUDED.rrc_price,
    sku_1c=EXCLUDED.sku_1c,
    style=EXCLUDED.style,
    model_photo=EXCLUDED.model_photo;

-- === HOTFIX: гарантируем служебные столбцы и триггер updated_at ===
ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- дефолты для служебных столбцов
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='created_at'
  ) THEN
    EXECUTE 'ALTER TABLE products ALTER COLUMN created_at SET DEFAULT now()';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='products' AND column_name='updated_at'
  ) THEN
    EXECUTE 'ALTER TABLE products ALTER COLUMN updated_at SET DEFAULT now()';
  END IF;
END $$;

-- проставим значения в существующих строках (если пусто)
UPDATE products
SET
  created_at = COALESCE(created_at, now()),
  updated_at = COALESCE(updated_at, now());

-- функция и триггер обновления updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- переcоздадим триггер безопасно
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_updated_at') THEN
    EXECUTE 'DROP TRIGGER trg_products_updated_at ON products';
  END IF;
  EXECUTE 'CREATE TRIGGER trg_products_updated_at
           BEFORE UPDATE ON products
           FOR EACH ROW EXECUTE FUNCTION set_updated_at()';
END $$;
