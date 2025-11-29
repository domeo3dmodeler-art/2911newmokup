-- Products
INSERT INTO products (id, model, finish, color, type, width, height, rrc_price, currency) VALUES
('DR-001','PG Base 1','Нанотекс','Белый','Распашная',700,2000,20000,'RUB'),
('DR-002','PG Base 1','Нанотекс','Белый','Распашная',800,2000,21000,'RUB'),
('DR-003','PG Base 1','Эмаль','Белый','Распашная',700,2000,22000,'RUB'),
('DR-004','PG Base 1','Эмаль','Белый','Распашная',800,2000,23000,'RUB'),
('DR-005','PG Base 2','Нанотекс','Серый','Распашная',700,2000,19000,'RUB'),
('DR-006','PG Base 2','Нанотекс','Серый','Распашная',800,2000,20000,'RUB'),
('DR-007','PG Base 2','Эмаль','Белый','Распашная',700,2000,20500,'RUB'),
('DR-008','PG Base 2','Эмаль','Белый','Распашная',800,2000,21500,'RUB'),
('DR-009','PG Pro','Нанотекс','Белый','Скрытая',800,2100,28000,'RUB'),
('DR-010','PG Pro','Нанотекс','Белый','Скрытая',900,2100,29500,'RUB'),
('DR-011','PG Pro','Эмаль','Графит','Скрытая',800,2100,30000,'RUB'),
('DR-012','PG Pro','Эмаль','Графит','Скрытая',900,2100,31500,'RUB')
ON CONFLICT (id) DO NOTHING;

-- Kits
INSERT INTO kits (id, name, price_rrc, currency) VALUES
('KIT-001','Комплект Standard',1500,'RUB'),
('KIT-002','Комплект SoftClose',2500,'RUB'),
('KIT-003','Комплект Invisible',3500,'RUB')
ON CONFLICT (id) DO NOTHING;

-- Handles
INSERT INTO handles (id, name, price_opt, price_group_multiplier, currency) VALUES
('HND-001','Ручка A',500,1.2,'RUB'),
('HND-002','Ручка B',800,1.1,'RUB'),
('HND-003','Ручка C',1200,1.15,'RUB')
ON CONFLICT (id) DO NOTHING;
