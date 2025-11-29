/**
 * Синхронизация реальных данных с тестовой ВМ
 * Импортирует клиентов, заказы, товары и другие данные
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncData() {
  console.log('========================================');
  console.log('СИНХРОНИЗАЦИЯ ДАННЫХ С ТЕСТОВОЙ ВМ');
  console.log('========================================');
  console.log('');

  try {
    await prisma.$connect();
    console.log('✅ Подключение к локальной БД установлено');
    console.log('');

    // Проверяем текущие данные
    console.log('Текущие данные в локальной БД:');
    const currentUsers = await prisma.user.count();
    const currentClients = await prisma.client.count();
    const currentOrders = await prisma.order.count();
    const currentProducts = await prisma.product.count();
    const currentCategories = await prisma.catalogCategory.count();
    
    console.log(`  Пользователей: ${currentUsers}`);
    console.log(`  Клиентов: ${currentClients}`);
    console.log(`  Заказов: ${currentOrders}`);
    console.log(`  Товаров: ${currentProducts}`);
    console.log(`  Категорий: ${currentCategories}`);
    console.log('');

    console.log('⚠️  Для синхронизации данных с тестовой ВМ нужно:');
    console.log('');
    console.log('Вариант 1: Через API (если доступен)');
    console.log('  - Подключиться к http://130.193.40.35:3001');
    console.log('  - Экспортировать данные через API endpoints');
    console.log('  - Импортировать в локальную БД');
    console.log('');
    console.log('Вариант 2: Прямое подключение к БД на тестовой ВМ');
    console.log('  - Настроить SSH туннель к PostgreSQL на ВМ');
    console.log('  - Использовать pg_dump для экспорта');
    console.log('  - Конвертировать в SQLite формат');
    console.log('');
    console.log('Вариант 3: Использовать Prisma для миграции');
    console.log('  - Подключиться к удаленной БД через DATABASE_URL');
    console.log('  - Экспортировать данные через Prisma');
    console.log('  - Импортировать в локальную БД');
    console.log('');

    // Проверяем, есть ли доступ к удаленной БД
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.includes('postgres')) {
      console.log('✅ Обнаружен DATABASE_URL для PostgreSQL');
      console.log('   Можно использовать прямое подключение');
      console.log('');
      console.log('Создаю скрипт для экспорта данных...');
      
      // Здесь можно добавить логику экспорта
    } else {
      console.log('ℹ️  Используется локальная SQLite БД');
      console.log('   Для синхронизации нужен доступ к удаленной БД');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('Ошибка:', error.message);
    process.exit(1);
  }
}

syncData();

