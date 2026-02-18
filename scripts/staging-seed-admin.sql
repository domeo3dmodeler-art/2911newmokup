INSERT INTO users (id, email, password_hash, first_name, last_name, middle_name, role, is_active, created_at, updated_at)
VALUES ('seed-admin-id', 'admin@domeo.ru', '$2a$12$q4UnQSGtalR9/i7tyZhHLuulW3sBUkecekRUMNdsutkdRJG6JT7cC', 'Петр', 'Иванов', 'Владимирович', 'ADMIN', true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
