CREATE INDEX IF NOT EXISTS idx_products_model          ON products (model);
CREATE INDEX IF NOT EXISTS idx_products_style          ON products (style);
CREATE INDEX IF NOT EXISTS idx_products_finish         ON products (finish);
CREATE INDEX IF NOT EXISTS idx_products_domeo_color    ON products (domeo_color);
CREATE INDEX IF NOT EXISTS idx_products_type           ON products (type);
CREATE INDEX IF NOT EXISTS idx_products_wh             ON products (width, height);
CREATE INDEX IF NOT EXISTS idx_products_key_composite  ON products (model, finish, domeo_color, type, width, height);
