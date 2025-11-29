const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Создаем пользователей...');
    
    // Создаем администратора
    const adminHash = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@domeo.ru' },
      update: {},
      create: {
        email: 'admin@domeo.ru',
        password_hash: adminHash,
        first_name: 'Петр',
        last_name: 'Иванов',
        role: 'ADMIN',
        is_active: true
      }
    });
    console.log('✅ Администратор:', admin.email);
    
    // Создаем комплектатора
    const complectatorHash = await bcrypt.hash('complectator123', 12);
    const complectator = await prisma.user.upsert({
      where: { email: 'complectator@domeo.ru' },
      update: {},
      create: {
        email: 'complectator@domeo.ru',
        password_hash: complectatorHash,
        first_name: 'Иван',
        last_name: 'Петров',
        role: 'COMPLECTATOR',
        is_active: true
      }
    });
    console.log('✅ Комплектатор:', complectator.email);
    
    // Создаем исполнителя
    const executorHash = await bcrypt.hash('executor123', 12);
    const executor = await prisma.user.upsert({
      where: { email: 'executor@domeo.ru' },
      update: {},
      create: {
        email: 'executor@domeo.ru',
        password_hash: executorHash,
        first_name: 'Алексей',
        last_name: 'Сидоров',
        role: 'EXECUTOR',
        is_active: true
      }
    });
    console.log('✅ Исполнитель:', executor.email);
    
    console.log('\n📋 Данные для входа:');
    console.log('👑 Администратор: admin@domeo.ru / admin123');
    console.log('📋 Комплектатор: complectator@domeo.ru / complectator123');
    console.log('⚙️ Исполнитель: executor@domeo.ru / executor123');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

