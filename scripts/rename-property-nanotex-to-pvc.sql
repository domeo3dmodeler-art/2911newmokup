-- Скрипт для переименования свойства товара "Нанотекс" на "ПВХ" в категории "Двери"
-- Обновляет свойство "Тип покрытия" для всех товаров категории "Двери"

-- Сначала найдем категорию "Двери" (Межкомнатные двери)
-- ID категории: cmg50xcgs001cv7mn0tdyk1wo

-- Обновляем товары, где свойство "Тип покрытия" = "Нанотекс" на "ПВХ"
UPDATE products
SET 
  properties_data = jsonb_set(
    properties_data,
    '{Тип покрытия}',
    '"ПВХ"'
  ),
  specifications = jsonb_set(
    specifications::jsonb,
    '{Тип покрытия}',
    '"ПВХ"'
  ),
  updated_at = NOW()
WHERE 
  catalog_category_id = 'cmg50xcgs001cv7mn0tdyk1wo'
  AND (
    properties_data::jsonb->>'Тип покрытия' = 'Нанотекс'
    OR properties_data::jsonb->>'Тип покрытия' = 'нанотекс'
    OR properties_data::jsonb->>'Тип покрытия' = 'НАНОТЕКС'
  );

-- Также обновляем поле "Общее_Тип покрытия", если оно есть
UPDATE products
SET 
  properties_data = jsonb_set(
    properties_data,
    '{Общее_Тип покрытия}',
    '"ПВХ"'
  ),
  specifications = jsonb_set(
    specifications::jsonb,
    '{Общее_Тип покрытия}',
    '"ПВХ"'
  ),
  updated_at = NOW()
WHERE 
  catalog_category_id = 'cmg50xcgs001cv7mn0tdyk1wo'
  AND (
    properties_data::jsonb->>'Общее_Тип покрытия' = 'Нанотекс'
    OR properties_data::jsonb->>'Общее_Тип покрытия' = 'нанотекс'
    OR properties_data::jsonb->>'Общее_Тип покрытия' = 'НАНОТЕКС'
  );

-- Выводим статистику обновления
SELECT 
  COUNT(*) as total_updated,
  'Тип покрытия' as property_name
FROM products
WHERE 
  catalog_category_id = 'cmg50xcgs001cv7mn0tdyk1wo'
  AND properties_data::jsonb->>'Тип покрытия' = 'ПВХ'

UNION ALL

SELECT 
  COUNT(*) as total_updated,
  'Общее_Тип покрытия' as property_name
FROM products
WHERE 
  catalog_category_id = 'cmg50xcgs001cv7mn0tdyk1wo'
  AND properties_data::jsonb->>'Общее_Тип покрытия' = 'ПВХ';

