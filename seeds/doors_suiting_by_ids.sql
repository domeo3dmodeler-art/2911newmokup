-- KIT rules по существующим ID
-- KIT_SOFT только для PG Base 1 / Нанотекс / Распашная с габаритами
INSERT INTO kit_suiting (kit_id, model, finish, type, width_min, width_max, height_min, height_max)
VALUES ('KIT_SOFT','PG Base 1','Нанотекс','Распашная',700,900,1900,2100)
ON CONFLICT (kit_id, model, finish, type) DO NOTHING;

-- KIT_STD для PG Base 2 / Распашная без габаритных ограничений
INSERT INTO kit_suiting (kit_id, model, finish, type, width_min, width_max, height_min, height_max)
VALUES ('KIT_STD','PG Base 2',NULL,'Распашная',NULL,NULL,NULL,NULL)
ON CONFLICT (kit_id, model, finish, type) DO NOTHING;

-- Если нужны комплекты для скрытых дверей, можно разморозить блок ниже и привязать к одному из KIT_*
-- INSERT INTO kit_suiting (kit_id, model, finish, type, width_min, width_max, height_min, height_max)
-- VALUES ('KIT_SOFT',NULL,NULL,'Скрытая',700,1000,2000,2300)
-- ON CONFLICT (kit_id, model, finish, type) DO NOTHING;

-- HANDLE rules: общий принцип — разрешить все ручки для типов, плюс конкретика под PG Base 1 / Нанотекс / Распашная

-- Все ручки подходят к Распашная
INSERT INTO handle_suiting (handle_id, model, finish, type, width_min, width_max, height_min, height_max)
SELECT h.id, NULL, NULL, 'Распашная', NULL, NULL, NULL, NULL
FROM handles h
ON CONFLICT (handle_id, model, finish, type) DO NOTHING;

-- Все ручки подходят к Скрытая (если есть таковые)
INSERT INTO handle_suiting (handle_id, model, finish, type, width_min, width_max, height_min, height_max)
SELECT h.id, NULL, NULL, 'Скрытая', NULL, NULL, NULL, NULL
FROM handles h
ON CONFLICT (handle_id, model, finish, type) DO NOTHING;

-- Акцент под конфигурацию из smoke: PG Base 1 + Нанотекс + Распашная
INSERT INTO handle_suiting (handle_id, model, finish, type, width_min, width_max, height_min, height_max)
SELECT h.id, 'PG Base 1', 'Нанотекс', 'Распашная', NULL, NULL, NULL, NULL
FROM handles h
ON CONFLICT (handle_id, model, finish, type) DO NOTHING;
