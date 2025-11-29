-- kits suiting
INSERT INTO kit_suiting (kit_id, model, finish, type, width_min, width_max, height_min, height_max) VALUES
('KIT-001','PG Base 1','Нанотекс','Распашная',700,900,1900,2100),
('KIT-002','PG Base 2',NULL,'Распашная',NULL,NULL,NULL,NULL),
('KIT-003',NULL,NULL,'Скрытая',700,1000,2000,2300)
ON CONFLICT (kit_id, model, finish, type) DO NOTHING;

-- handles suiting
INSERT INTO handle_suiting (handle_id, model, finish, type, width_min, width_max, height_min, height_max) VALUES
('HND-001','PG Base 1','Нанотекс','Распашная',NULL,NULL,NULL,NULL),
('HND-002',NULL,NULL,'Распашная',NULL,NULL,NULL,NULL),
('HND-003',NULL,NULL,'Скрытая',NULL,NULL,NULL,NULL)
ON CONFLICT (handle_id, model, finish, type) DO NOTHING;
