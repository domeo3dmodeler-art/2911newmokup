-- Админ для входа (пароль: Test2025!)
INSERT INTO users (id, email, password_hash, first_name, last_name, middle_name, role, is_active, created_at, updated_at)
VALUES ('seed-admin-id', 'admin@domeo.ru', '$2a$12$q4UnQSGtalR9/i7tyZhHLuulW3sBUkecekRUMNdsutkdRJG6JT7cC', 'Петр', 'Иванов', 'Владимирович', 'ADMIN', true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Категория "Межкомнатные двери" и 3 тестовых товара
INSERT INTO catalog_categories (id, name, parent_id, level, path, sort_order, is_active, products_count, created_at, updated_at)
VALUES ('seed-doors-category-id', 'Межкомнатные двери', NULL, 0, '/doors', 0, true, 0, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, path = EXCLUDED.path, is_active = EXCLUDED.is_active;

INSERT INTO products (id, catalog_category_id, sku, name, description, brand, model, series, base_price, currency, stock_quantity, min_order_qty, dimensions, specifications, properties_data, tags, is_active, is_featured, created_at, updated_at)
VALUES
  ('seed-p1', 'seed-doors-category-id', 'TEST-MODEL-01', 'Тестовая модель 01', NULL, NULL, 'Модель 01', NULL, 15000, 'RUB', 0, 1, '{}', '{}', '{"Название модели":"Модель 01","Domeo_Стиль Web":"Современный"}', '[]', true, false, NOW(), NOW()),
  ('seed-p2', 'seed-doors-category-id', 'TEST-MODEL-02', 'Тестовая модель 02', NULL, NULL, 'Модель 02', NULL, 15000, 'RUB', 0, 1, '{}', '{}', '{"Название модели":"Модель 02","Domeo_Стиль Web":"Классика"}', '[]', true, false, NOW(), NOW()),
  ('seed-p3', 'seed-doors-category-id', 'TEST-MODEL-03', 'Тестовая модель 03', NULL, NULL, 'Модель 03', NULL, 15000, 'RUB', 0, 1, '{}', '{}', '{"Название модели":"Модель 03","Domeo_Стиль Web":"Современный"}', '[]', true, false, NOW(), NOW())
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  model = EXCLUDED.model,
  properties_data = EXCLUDED.properties_data;

UPDATE catalog_categories SET products_count = 3 WHERE id = 'seed-doors-category-id';
