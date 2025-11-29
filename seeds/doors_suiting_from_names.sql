-- Привязываем suiting к существующим ID на основе имён

-- KIT: «Комплект Soft» → для PG Base 1 / Нанотекс / Распашная, габариты 700–900 × 1900–2100
INSERT INTO kit_suiting (kit_id, model, finish, type, width_min, width_max, height_min, height_max)
SELECT k.id, 'PG Base 1', 'Нанотекс', 'Распашная', 700, 900, 1900, 2100
FROM kits k
WHERE k.name ILIKE '%Комплект%Soft%' OR k.name ILIKE '%Soft%Комплект%'
ON CONFLICT (kit_id, model, finish, type) DO NOTHING;

-- KIT: второй вариант — любой «Комплект» для PG Base 2 / Распашная (без ограничений габаритов)
INSERT INTO kit_suiting (kit_id, model, finish, type, width_min, width_max, height_min, height_max)
SELECT k.id, 'PG Base 2', NULL, 'Распашная', NULL, NULL, NULL, NULL
FROM kits k
WHERE k.name ILIKE '%Комплект%'
ON CONFLICT (kit_id, model, finish, type) DO NOTHING;

-- KIT: «Invisible» для скрытых дверей
INSERT INTO kit_suiting (kit_id, model, finish, type, width_min, width_max, height_min, height_max)
SELECT k.id, NULL, NULL, 'Скрытая', 700, 1000, 2000, 2300
FROM kits k
WHERE k.name ILIKE '%Invisible%' OR k.name ILIKE '%Инвизибл%' OR k.name ILIKE '%невид%'
ON CONFLICT (kit_id, model, finish, type) DO NOTHING;

-- HANDLE: «Ручка A» → для PG Base 1 / Нанотекс / Распашная
INSERT INTO handle_suiting (handle_id, model, finish, type, width_min, width_max, height_min, height_max)
SELECT h.id, 'PG Base 1', 'Нанотекс', 'Распашная', NULL, NULL, NULL, NULL
FROM handles h
WHERE h.name ILIKE '%Ручка% A%' OR h.name = 'Ручка A'
ON CONFLICT (handle_id, model, finish, type) DO NOTHING;

-- HANDLE: любые ручки для Распашная (общий случай)
INSERT INTO handle_suiting (handle_id, model, finish, type, width_min, width_max, height_min, height_max)
SELECT h.id, NULL, NULL, 'Распашная', NULL, NULL, NULL, NULL
FROM handles h
ON CONFLICT (handle_id, model, finish, type) DO NOTHING;

-- HANDLE: для Скрытая — оставим любые ручки (если есть спец.названия — можно сузить)
INSERT INTO handle_suiting (handle_id, model, finish, type, width_min, width_max, height_min, height_max)
SELECT h.id, NULL, NULL, 'Скрытая', NULL, NULL, NULL, NULL
FROM handles h
ON CONFLICT (handle_id, model, finish, type) DO NOTHING;
