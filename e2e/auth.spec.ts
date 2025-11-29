import { test, expect } from '@playwright/test';

/**
 * Критические тесты аутентификации
 * Тест 1-4 из плана тестирования
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Аутентификация', () => {
  
  test('1. Успешный вход в систему', async ({ page }) => {
    // Переход на страницу входа
    await page.goto(`${BASE_URL}/login`);
    
    // Заполнение формы входа
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'password';
    
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    // Нажатие кнопки входа
    await page.click('button[type="submit"]');
    
    // Ожидание редиректа на dashboard
    await page.waitForURL(/\/(dashboard|admin|complectator|executor)/, { timeout: 10000 });
    
    // Проверка что пользователь авторизован (имя в header)
    const userInfo = page.locator('text=/[А-ЯЁ][а-яё]+ [А-ЯЁ]\\./');
    await expect(userInfo).toBeVisible({ timeout: 5000 });
  });

  test('2. Неуспешный вход с неверными данными', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Ввод неверных данных
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');
    
    // Проверка ошибки
    const errorMessage = page.locator('text=/неверный|ошибка|error/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Проверка что остались на странице входа
    await expect(page).toHaveURL(/\/login/);
  });

  test('3. Защита защищенных путей', async ({ page }) => {
    // Попытка доступа к защищенному пути без авторизации
    await page.goto(`${BASE_URL}/admin`);
    
    // Ожидание редиректа на /login с параметром redirect
    await page.waitForURL(/\/login\?redirect/, { timeout: 5000 });
    
    // Проверка параметра redirect
    const url = page.url();
    expect(url).toContain('redirect=%2Fadmin');
  });

  test('4. Rate limiting на вход', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // 6 попыток входа с неверными данными
    for (let i = 0; i < 6; i++) {
      await page.fill('input[type="email"]', 'wrong@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // Небольшая задержка между попытками
      await page.waitForTimeout(500);
    }
    
    // После 5 попыток должна быть блокировка
    const rateLimitMessage = page.locator('text=/лимит|limit|too many/i');
    await expect(rateLimitMessage).toBeVisible({ timeout: 5000 });
  });
});

