import { test, expect } from '@playwright/test';

/**
 * Тесты health check endpoint
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test.describe('Health Check', () => {
  
  test('Health check возвращает корректный ответ', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    
    // Проверка структуры ответа
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('checks');
    expect(body.checks).toHaveProperty('database');
    
    // Проверка статуса БД
    expect(body.checks.database).toHaveProperty('status');
    expect(['ok', 'error']).toContain(body.checks.database.status);
    
    // Если БД работает, проверяем время ответа
    if (body.checks.database.status === 'ok') {
      expect(body.checks.database).toHaveProperty('responseTime');
      expect(typeof body.checks.database.responseTime).toBe('number');
    }
  });

  test('Health check проверяет подключение к БД', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);
    const body = await response.json();
    
    // БД должна быть доступна
    expect(body.checks.database.status).toBe('ok');
    expect(body.status).toBe('healthy');
  });
});

