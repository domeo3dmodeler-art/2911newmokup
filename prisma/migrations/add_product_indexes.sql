-- Миграция для добавления индексов к таблице products
-- Оптимизация запросов для калькулятора дверей

-- Индекс по created_at для сортировки
CREATE INDEX IF NOT EXISTS "idx_products_created_at" ON "products" ("created_at");

-- Индекс по properties_data для поиска товаров с фотографиями
CREATE INDEX IF NOT EXISTS "idx_products_properties_data" ON "products" ("properties_data");

-- Составной индекс для оптимизации запросов калькулятора
CREATE INDEX IF NOT EXISTS "idx_products_category_properties" ON "products" ("catalog_category_id", "properties_data");

-- Индекс по is_active для фильтрации активных товаров
CREATE INDEX IF NOT EXISTS "idx_products_is_active" ON "products" ("is_active");
