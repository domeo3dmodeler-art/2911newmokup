# E2E Тесты для Domeo

Базовые E2E тесты для критических сценариев работы системы.

## Установка

```bash
npm install --save-dev @playwright/test
npx playwright install
```

## Настройка

Создайте файл `.env.test` или используйте переменные окружения:

```env
TEST_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=complectator@example.com
TEST_USER_PASSWORD=password
TEST_COMPLECTATOR_EMAIL=complectator@example.com
TEST_COMPLECTATOR_PASSWORD=password
TEST_EXECUTOR_EMAIL=executor@example.com
TEST_EXECUTOR_PASSWORD=password
```

## Запуск тестов

```bash
# Все тесты
npm run test:e2e

# Конкретный файл
npx playwright test e2e/auth.spec.ts

# В UI режиме
npx playwright test --ui

# С отчетом
npx playwright test --reporter=html
```

## Структура тестов

- `auth.spec.ts` - Тесты аутентификации (Тесты 1-4)
- `documents.spec.ts` - Тесты работы с документами (Тесты 5-10)
- `health.spec.ts` - Тесты health check

## Критические тесты

### ✅ Реализовано

1. Успешный вход в систему
2. Неуспешный вход с неверными данными
3. Защита защищенных путей
4. Rate limiting на вход
5. Создание клиента
6. Создание КП из корзины
7. Изменение статуса документа
8. Экспорт документа в PDF
9. Health check endpoint

### ⏳ В разработке

- Полный цикл Комплектатора (E2E сценарий 28)
- Полный цикл Исполнителя (E2E сценарий 29)

## Примечания

- Тесты используют реальные данные из базы
- Перед запуском тестов убедитесь, что:
  - Сервер запущен (`npm run dev`)
  - База данных доступна
  - Тестовые пользователи созданы

## CI/CD

Для запуска в CI/CD используйте:

```yaml
- name: Run E2E tests
  run: npx playwright test --reporter=html
```

