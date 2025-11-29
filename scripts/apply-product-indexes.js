const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyIndexes() {
  try {
    console.log('🔧 Применяем индексы для оптимизации калькулятора дверей...');
    
    // Читаем SQL файл миграции
    const migrationPath = path.join(__dirname, '../prisma/migrations/add_product_indexes.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Выполняем SQL команды
    const commands = sql.split(';').filter(cmd => cmd.trim());
    
    for (const command of commands) {
      if (command.trim()) {
        console.log(`📝 Выполняем: ${command.trim().substring(0, 50)}...`);
        await prisma.$executeRawUnsafe(command.trim());
      }
    }
    
    console.log('✅ Индексы успешно применены!');
    
    // Проверяем созданные индексы
    const indexes = await prisma.$queryRaw`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND tbl_name='products' 
      AND name LIKE 'idx_%'
    `;
    
    console.log('📊 Созданные индексы:');
    indexes.forEach(idx => console.log(`  - ${idx.name}`));
    
  } catch (error) {
    console.error('❌ Ошибка применения индексов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyIndexes();
