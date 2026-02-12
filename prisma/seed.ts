// prisma/seed.ts
// Seed файл для создания тестовых пользователей
// Пароль для всех тестовых пользователей: Test2025!

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Test2025!';

async function main() {
  try {
    console.log('🌱 Создаем тестовых пользователей...');

    // Создаем администратора
    console.log('👑 Создаем администратора...');
    const adminPasswordHash = await bcrypt.hash(TEST_PASSWORD, 12);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@domeo.ru' },
      update: { password_hash: adminPasswordHash },
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
    const complectatorPasswordHash = await bcrypt.hash(TEST_PASSWORD, 12);

    const complectator = await prisma.user.upsert({
      where: { email: 'complectator@domeo.ru' },
      update: { password_hash: complectatorPasswordHash },
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
    const executorPasswordHash = await bcrypt.hash(TEST_PASSWORD, 12);

    const executor = await prisma.user.upsert({
      where: { email: 'executor@domeo.ru' },
      update: { password_hash: executorPasswordHash },
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

    console.log('🎉 Тестовые пользователи созданы!');
    console.log('');
    console.log('📋 Данные для входа (пароль для всех: ' + TEST_PASSWORD + '):');
    console.log('👑 Администратор: admin@domeo.ru');
    console.log('📋 Комплектатор: complectator@domeo.ru');
    console.log('⚙️ Исполнитель: executor@domeo.ru');

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