// prisma/seed.ts
// Seed файл для создания реальных пользователей

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Создаем реальных пользователей...');

    // Создаем администратора
    console.log('👑 Создаем администратора...');
    const adminPasswordHash = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@domeo.ru' },
      update: {},
      create: {
        email: 'admin@domeo.ru',
        password_hash: adminPasswordHash,
        first_name: 'Петр',
        last_name: 'Иванов',
        middle_name: 'Владимирович',
        role: 'ADMIN',
        is_active: true
      }
    });

    console.log('✅ Администратор создан:', admin.email);

    // Создаем комплектатора
    console.log('📋 Создаем комплектатора...');
    const complectatorPasswordHash = await bcrypt.hash('complectator123', 12);
    
    const complectator = await prisma.user.upsert({
      where: { email: 'complectator@domeo.ru' },
      update: {},
      create: {
        email: 'complectator@domeo.ru',
        password_hash: complectatorPasswordHash,
        first_name: 'Иван',
        last_name: 'Петров',
        middle_name: 'Сергеевич',
        role: 'COMPLECTATOR',
        is_active: true
      }
    });

    console.log('✅ Комплектатор создан:', complectator.email);

    // Создаем исполнителя
    console.log('⚙️ Создаем исполнителя...');
    const executorPasswordHash = await bcrypt.hash('executor123', 12);
    
    const executor = await prisma.user.upsert({
      where: { email: 'executor@domeo.ru' },
      update: {},
      create: {
        email: 'executor@domeo.ru',
        password_hash: executorPasswordHash,
        first_name: 'Алексей',
        last_name: 'Сидоров',
        middle_name: 'Михайлович',
        role: 'EXECUTOR',
        is_active: true
      }
    });

    console.log('✅ Исполнитель создан:', executor.email);

    console.log('🎉 Пользователи успешно созданы!');
    console.log('');
    console.log('📋 Данные для входа:');
    console.log('👑 Администратор: admin@domeo.ru / admin123');
    console.log('📋 Комплектатор: complectator@domeo.ru / complectator123');
    console.log('⚙️ Исполнитель: executor@domeo.ru / executor123');

  } catch (error) {
    console.error('❌ Ошибка при создании пользователей:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем seed
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });