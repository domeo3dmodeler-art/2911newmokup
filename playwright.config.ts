import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright конфигурация для E2E тестов
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Максимальное время для одного теста */
  timeout: 30 * 1000,
  
  /* Ожидание между тестами */
  expect: {
    timeout: 5000,
  },
  
  /* Запуск тестов в параллель */
  fullyParallel: true,
  
  /* Не запускать тесты при наличии ошибок компиляции */
  forbidOnly: !!process.env.CI,
  
  /* Повторные попытки только в CI */
  retries: process.env.CI ? 2 : 0,
  
  /* Количество воркеров в CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Репортер для результатов */
  reporter: 'html',
  
  /* Настройки для использования */
  use: {
    /* Базовый URL для тестов */
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    
    /* Скриншоты при ошибках */
    screenshot: 'only-on-failure',
    
    /* Видео при ошибках */
    video: 'retain-on-failure',
    
    /* Trace при ошибках */
    trace: 'on-first-retry',
    
    /* Заголовки для всех запросов */
    extraHTTPHeaders: {
      'Accept-Language': 'ru-RU,ru;q=0.9',
    },
  },

  /* Конфигурация проектов для разных браузеров */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Можно добавить другие браузеры
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Сервер для запуска dev сервера перед тестами */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

