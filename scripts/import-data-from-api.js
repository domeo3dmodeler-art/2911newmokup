/**
 * Импорт данных через API с тестовой ВМ
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STAGING_API_URL = 'http://130.193.40.35:3001';

async function importData() {
  console.log('========================================');
  console.log('ИМПОРТ ДАННЫХ ЧЕРЕЗ API');
  console.log('========================================');
  console.log('');

  try {
    await prisma.$connect();
    console.log('✅ Подключение к локальной БД установлено');
    console.log('');

    // Проверяем доступность API
    console.log('Проверка доступности API...');
    try {
      const response = await fetch(`${STAGING_API_URL}/api/health`);
      if (response.ok) {
        console.log('✅ API доступен');
      } else {
        console.log('⚠️  API недоступен или требует авторизации');
      }
    } catch (error) {
      console.log('❌ API недоступен:', error.message);
      console.log('');
      console.log('Альтернативные варианты:');
      console.log('1. Настроить SSH туннель для доступа к БД');
      console.log('2. Использовать прямой экспорт из PostgreSQL');
      console.log('3. Синхронизировать через Git (если данные в репозитории)');
      await prisma.$disconnect();
      return;
    }

    console.log('');
    console.log('Для импорта данных нужно:');
    console.log('1. Авторизоваться на тестовой ВМ');
    console.log('2. Получить токен доступа');
    console.log('3. Использовать API endpoints для экспорта данных');
    console.log('');

    // Здесь можно добавить логику импорта через API
    // Но для этого нужен токен авторизации

    await prisma.$disconnect();
  } catch (error) {
    console.error('Ошибка:', error.message);
    process.exit(1);
  }
}

importData();

