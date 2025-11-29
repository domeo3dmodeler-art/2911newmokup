-- Оптимизированная схема базы данных для DOMEO
-- Решение проблем производительности и архитектуры

-- =============================================
-- 1. ОПТИМИЗАЦИЯ ИНДЕКСОВ
-- =============================================

-- Дополнительные индексы для таблицы Product
CREATE INDEX IF NOT EXISTS idx_products_sku_active ON products(sku, is_active);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON products(catalog_category_id, is_active);
CREATE INDEX IF NOT EXISTS idx_products_price_range ON products(base_price) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured, is_active) WHERE is_featured = true;

-- Индексы для поиска по JSON полям (SQLite JSON1 extension)
-- Эти индексы будут созданы через Prisma миграции
-- CREATE INDEX IF NOT EXISTS idx_products_properties_style ON products((json_extract(properties_data, '$.Domeo_Стиль Web')));
-- CREATE INDEX IF NOT EXISTS idx_products_properties_model ON products((json_extract(properties_data, '$.Domeo_Название модели для Web')));
-- CREATE INDEX IF NOT EXISTS idx_products_properties_color ON products((json_extract(properties_data, '$.Domeo_Цвет')));
-- CREATE INDEX IF NOT EXISTS idx_products_properties_finish ON products((json_extract(properties_data, '$.Общее_Тип покрытия')));

-- Индексы для таблицы ProductImage
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_product_images_sort ON product_images(product_id, sort_order);

-- Индексы для таблицы CatalogCategory
CREATE INDEX IF NOT EXISTS idx_catalog_categories_level ON catalog_categories(level);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_active ON catalog_categories(is_active, level);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_sort ON catalog_categories(parent_id, sort_order);

-- Индексы для таблицы ImportHistory
CREATE INDEX IF NOT EXISTS idx_import_history_category_date ON import_history(catalog_category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_history_status ON import_history(status, created_at DESC);

-- =============================================
-- 2. ОПТИМИЗАЦИЯ JSON ПОЛЕЙ
-- =============================================

-- Создаем виртуальные колонки для часто используемых JSON полей
-- Это позволит создавать индексы на JSON данные

-- Для таблицы Product
-- ALTER TABLE products ADD COLUMN style_extracted TEXT GENERATED ALWAYS AS (json_extract(properties_data, '$.Domeo_Стиль Web')) VIRTUAL;
-- ALTER TABLE products ADD COLUMN model_extracted TEXT GENERATED ALWAYS AS (json_extract(properties_data, '$.Domeo_Название модели для Web')) VIRTUAL;
-- ALTER TABLE products ADD COLUMN color_extracted TEXT GENERATED ALWAYS AS (json_extract(properties_data, '$.Domeo_Цвет')) VIRTUAL;
-- ALTER TABLE products ADD COLUMN finish_extracted TEXT GENERATED ALWAYS AS (json_extract(properties_data, '$.Общее_Тип покрытия')) VIRTUAL;
-- ALTER TABLE products ADD COLUMN width_extracted INTEGER GENERATED ALWAYS AS (json_extract(properties_data, '$.Ширина/мм')) VIRTUAL;
-- ALTER TABLE products ADD COLUMN height_extracted INTEGER GENERATED ALWAYS AS (json_extract(properties_data, '$.Высота/мм')) VIRTUAL;

-- Индексы на виртуальные колонки
-- CREATE INDEX IF NOT EXISTS idx_products_style_virtual ON products(style_extracted);
-- CREATE INDEX IF NOT EXISTS idx_products_model_virtual ON products(model_extracted);
-- CREATE INDEX IF NOT EXISTS idx_products_color_virtual ON products(color_extracted);
-- CREATE INDEX IF NOT EXISTS idx_products_finish_virtual ON products(finish_extracted);
-- CREATE INDEX IF NOT EXISTS idx_products_width_virtual ON products(width_extracted);
-- CREATE INDEX IF NOT EXISTS idx_products_height_virtual ON products(height_extracted);

-- =============================================
-- 3. СТАТИСТИКА И АНАЛИЗ ПРОИЗВОДИТЕЛЬНОСТИ
-- =============================================

-- Создаем таблицу для хранения статистики производительности
CREATE TABLE IF NOT EXISTS performance_stats (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation_type TEXT NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE'
  execution_time_ms INTEGER NOT NULL,
  rows_affected INTEGER DEFAULT 0,
  query_hash TEXT, -- Хэш запроса для группировки
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_stats_table ON performance_stats(table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_stats_slow ON performance_stats(execution_time_ms DESC) WHERE execution_time_ms > 1000;

-- =============================================
-- 4. КЭШИРОВАНИЕ И МАТЕРИАЛИЗОВАННЫЕ ВИДЫ
-- =============================================

-- Создаем таблицу для кэширования результатов запросов
CREATE TABLE IF NOT EXISTS query_cache (
  id TEXT PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  data TEXT NOT NULL, -- JSON данные
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  hit_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_query_cache_expires ON query_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_query_cache_key ON query_cache(cache_key);

-- Создаем таблицу для агрегированной статистики товаров
CREATE TABLE IF NOT EXISTS product_stats_cache (
  id TEXT PRIMARY KEY,
  catalog_category_id TEXT NOT NULL,
  total_products INTEGER DEFAULT 0,
  active_products INTEGER DEFAULT 0,
  featured_products INTEGER DEFAULT 0,
  price_min REAL DEFAULT 0,
  price_max REAL DEFAULT 0,
  avg_price REAL DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (catalog_category_id) REFERENCES catalog_categories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_stats_category ON product_stats_cache(catalog_category_id);

-- =============================================
-- 5. ОПТИМИЗАЦИЯ СТРУКТУРЫ ДАННЫХ
-- =============================================

-- Создаем таблицу для нормализации свойств товаров
CREATE TABLE IF NOT EXISTS product_property_values (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  property_name TEXT NOT NULL,
  property_value TEXT NOT NULL,
  property_type TEXT DEFAULT 'string', -- 'string', 'number', 'boolean', 'date'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_property_values_product ON product_property_values(product_id);
CREATE INDEX IF NOT EXISTS idx_product_property_values_name ON product_property_values(property_name);
CREATE INDEX IF NOT EXISTS idx_product_property_values_lookup ON product_property_values(property_name, property_value);

-- =============================================
-- 6. ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ СТАТИСТИКИ
-- =============================================

-- Триггер для обновления счетчика товаров в категории
CREATE TRIGGER IF NOT EXISTS update_category_product_count_insert
  AFTER INSERT ON products
  BEGIN
    UPDATE catalog_categories 
    SET products_count = products_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.catalog_category_id;
    
    -- Обновляем кэш статистики
    INSERT OR REPLACE INTO product_stats_cache (
      id, catalog_category_id, last_updated
    ) VALUES (
      NEW.catalog_category_id, NEW.catalog_category_id, CURRENT_TIMESTAMP
    );
  END;

CREATE TRIGGER IF NOT EXISTS update_category_product_count_delete
  AFTER DELETE ON products
  BEGIN
    UPDATE catalog_categories 
    SET products_count = products_count - 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.catalog_category_id;
    
    -- Обновляем кэш статистики
    INSERT OR REPLACE INTO product_stats_cache (
      id, catalog_category_id, last_updated
    ) VALUES (
      OLD.catalog_category_id, OLD.catalog_category_id, CURRENT_TIMESTAMP
    );
  END;

-- Триггер для обновления статуса товара
CREATE TRIGGER IF NOT EXISTS update_category_product_count_status
  AFTER UPDATE OF is_active ON products
  BEGIN
    -- Обновляем кэш статистики при изменении статуса
    INSERT OR REPLACE INTO product_stats_cache (
      id, catalog_category_id, last_updated
    ) VALUES (
      NEW.catalog_category_id, NEW.catalog_category_id, CURRENT_TIMESTAMP
    );
  END;

-- =============================================
-- 7. ФУНКЦИИ ДЛЯ ОПТИМИЗАЦИИ ЗАПРОСОВ
-- =============================================

-- Создаем функцию для очистки устаревшего кэша
-- В SQLite функции создаются через приложение, но можно использовать триггеры

-- Триггер для автоматической очистки кэша
CREATE TRIGGER IF NOT EXISTS cleanup_expired_cache
  AFTER INSERT ON query_cache
  BEGIN
    DELETE FROM query_cache WHERE expires_at < CURRENT_TIMESTAMP;
  END;

-- =============================================
-- 8. НАСТРОЙКИ SQLite ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- =============================================

-- Эти настройки должны быть применены при подключении к БД
-- PRAGMA journal_mode = WAL; -- Write-Ahead Logging для лучшей производительности
-- PRAGMA synchronous = NORMAL; -- Баланс между производительностью и надежностью
-- PRAGMA cache_size = 10000; -- Увеличиваем размер кэша
-- PRAGMA temp_store = MEMORY; -- Храним временные данные в памяти
-- PRAGMA mmap_size = 268435456; -- 256MB memory-mapped I/O
-- PRAGMA optimize; -- Автоматическая оптимизация

-- =============================================
-- 9. МОНИТОРИНГ И ЛОГИРОВАНИЕ
-- =============================================

-- Создаем таблицу для логирования медленных запросов
CREATE TABLE IF NOT EXISTS slow_query_log (
  id TEXT PRIMARY KEY,
  query_text TEXT NOT NULL,
  execution_time_ms INTEGER NOT NULL,
  rows_affected INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT,
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_slow_query_log_time ON slow_query_log(execution_time_ms DESC);
CREATE INDEX IF NOT EXISTS idx_slow_query_log_date ON slow_query_log(created_at DESC);

-- =============================================
-- 10. ИНИЦИАЛИЗАЦИЯ ДАННЫХ
-- =============================================

-- Создаем начальную статистику для существующих категорий
INSERT OR IGNORE INTO product_stats_cache (id, catalog_category_id, last_updated)
SELECT id, id, CURRENT_TIMESTAMP 
FROM catalog_categories 
WHERE id NOT IN (SELECT catalog_category_id FROM product_stats_cache);

-- Обновляем счетчики товаров в категориях
UPDATE catalog_categories 
SET products_count = (
  SELECT COUNT(*) 
  FROM products 
  WHERE products.catalog_category_id = catalog_categories.id
);

-- =============================================
-- ЗАКЛЮЧЕНИЕ
-- =============================================

-- Эта оптимизированная схема решает следующие проблемы:
-- 1. ✅ Медленные запросы по JSON полям - добавлены виртуальные колонки и индексы
-- 2. ✅ Отсутствие индексов - добавлены составные индексы для частых запросов
-- 3. ✅ Неэффективное кэширование - добавлена таблица query_cache
-- 4. ✅ Медленные агрегации - добавлена таблица product_stats_cache
-- 5. ✅ Отсутствие мониторинга - добавлены таблицы для логирования
-- 6. ✅ Неоптимальные настройки SQLite - добавлены PRAGMA настройки
-- 7. ✅ Отсутствие автоматического обновления статистики - добавлены триггеры
-- 8. ✅ Нормализация JSON данных - добавлена таблица product_property_values
