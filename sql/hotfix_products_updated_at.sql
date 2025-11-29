-- === HOTFIX products.updated_at / trigger ===

-- 1) Сносим триггер (если есть) и функцию (если есть)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_products_updated_at') THEN
    EXECUTE 'DROP TRIGGER trg_products_updated_at ON products';
  END IF;
END $$;

DROP FUNCTION IF EXISTS set_updated_at();

-- 2) Добавляем недостающие служебные колонки
ALTER TABLE IF EXISTS products
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 3) Дефолты и первичное заполнение значений
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

UPDATE products
SET
  created_at = COALESCE(created_at, now()),
  updated_at = COALESCE(updated_at, now());

-- 4) Заново создаём функцию и триггер
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
