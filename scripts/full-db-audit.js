const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fullAudit() {
  console.log('========================================');
  console.log('ПОЛНЫЙ АУДИТ БАЗЫ ДАННЫХ');
  console.log('========================================');
  console.log('');

  try {
    await prisma.$connect();
    console.log('✅ Подключение к БД установлено');
    console.log('');

    // 1. Проверка схемы
    console.log('1. ПРОВЕРКА СХЕМЫ БД');
    console.log('----------------------------------------');
    
    const tables = [
      'users', 'clients', 'orders', 'products', 'catalog_categories',
      'notifications', 'invoices', 'quotes', 'product_images'
    ];

    for (const table of tables) {
      try {
        const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table}`);
        const countValue = count[0]?.count || 0;
        console.log(`  ${table.padEnd(25)}: ${countValue} записей`);
      } catch (error) {
        console.log(`  ${table.padEnd(25)}: ❌ Ошибка - ${error.message}`);
      }
    }
    console.log('');

    // 2. Проверка категорий дверей
    console.log('2. ПРОВЕРКА КАТЕГОРИЙ ДВЕРЕЙ');
    console.log('----------------------------------------');
    
    const doorsCategoryId = 'cmg50xcgs001cv7mn0tdyk1wo';
    const doorsCategory = await prisma.catalogCategory.findUnique({
      where: { id: doorsCategoryId }
    });

    if (doorsCategory) {
      console.log(`  ✅ Категория найдена: "${doorsCategory.name}"`);
      console.log(`     ID: ${doorsCategory.id}`);
      console.log(`     Путь: ${doorsCategory.path}`);
      console.log(`     Уровень: ${doorsCategory.level}`);
      console.log(`     Активна: ${doorsCategory.is_active}`);
    } else {
      console.log(`  ❌ Категория с ID ${doorsCategoryId} не найдена!`);
      
      // Ищем категории с "двер" в названии
      const doorCategories = await prisma.catalogCategory.findMany({
        where: {
          name: {
            contains: 'двер'
          }
        },
        take: 5
      });
      
      if (doorCategories.length > 0) {
        console.log('  Найдены категории с "двер":');
        doorCategories.forEach(cat => {
          console.log(`    - "${cat.name}" (id: ${cat.id})`);
        });
      }
    }
    console.log('');

    // 3. Проверка товаров в категории дверей
    console.log('3. ПРОВЕРКА ТОВАРОВ В КАТЕГОРИИ ДВЕРЕЙ');
    console.log('----------------------------------------');
    
    if (doorsCategory) {
      const productsCount = await prisma.product.count({
        where: {
          catalog_category_id: doorsCategoryId,
          is_active: true
        }
      });
      
      console.log(`  Товаров в категории: ${productsCount}`);
      
      if (productsCount === 0) {
        console.log('  ⚠️  Товаров нет! Проверяю все товары...');
        const allProducts = await prisma.product.findMany({
          take: 5,
          select: {
            id: true,
            name: true,
            catalog_category_id: true,
            is_active: true
          }
        });
        
        console.log(`  Всего товаров в БД: ${await prisma.product.count()}`);
        console.log('  Примеры товаров:');
        allProducts.forEach(p => {
          console.log(`    - ${p.name} (категория: ${p.catalog_category_id}, активен: ${p.is_active})`);
        });
      } else {
        // Проверяем структуру properties_data
        const sampleProducts = await prisma.product.findMany({
          where: {
            catalog_category_id: doorsCategoryId,
            is_active: true
          },
          take: 3,
          select: {
            id: true,
            name: true,
            properties_data: true
          }
        });

        console.log('  Проверка структуры данных:');
        sampleProducts.forEach((p, i) => {
          console.log(`    Товар ${i + 1}: ${p.name}`);
          
          try {
            let properties = {};
            if (typeof p.properties_data === 'string') {
              properties = JSON.parse(p.properties_data);
            } else if (p.properties_data) {
              properties = p.properties_data;
            }

            const model = properties['Domeo_Название модели для Web'];
            const style = properties['Domeo_Стиль Web'];
            const supplierSku = properties['Артикул поставщика'];

            console.log(`      Модель: ${model || 'не указана'}`);
            console.log(`      Стиль: ${style || 'не указан'}`);
            console.log(`      Артикул: ${supplierSku || 'не указан'}`);
            console.log(`      Ключей в properties_data: ${Object.keys(properties).length}`);
          } catch (e) {
            console.log(`      ❌ Ошибка парсинга: ${e.message}`);
          }
        });
      }
    }
    console.log('');

    // 4. Проверка стилей и моделей
    console.log('4. ПРОВЕРКА СТИЛЕЙ И МОДЕЛЕЙ');
    console.log('----------------------------------------');
    
    if (doorsCategory) {
      const allProducts = await prisma.product.findMany({
        where: {
          catalog_category_id: doorsCategoryId,
          is_active: true
        },
        select: {
          properties_data: true
        }
      });

      const styles = new Set();
      const models = new Set();
      const modelStyleMap = new Map();
      let parseErrors = 0;

      allProducts.forEach(product => {
        try {
          let properties = {};
          if (typeof product.properties_data === 'string') {
            properties = JSON.parse(product.properties_data);
          } else if (product.properties_data) {
            properties = product.properties_data;
          }

          const model = properties['Domeo_Название модели для Web'];
          const style = properties['Domeo_Стиль Web'];

          if (model) models.add(model);
          if (style) styles.add(style);
          if (model && style) modelStyleMap.set(model, style);
        } catch (e) {
          parseErrors++;
        }
      });

      console.log(`  Уникальных стилей: ${styles.size}`);
      if (styles.size > 0) {
        console.log('  Стили:');
        Array.from(styles).sort().forEach(s => {
          const modelsInStyle = Array.from(modelStyleMap.entries())
            .filter(([_, style]) => style === s)
            .map(([model]) => model);
          console.log(`    - "${s}" (${modelsInStyle.length} моделей)`);
        });
      }

      console.log(`  Уникальных моделей: ${models.size}`);
      if (models.size > 0) {
        console.log('  Модели:');
        Array.from(models).sort().slice(0, 10).forEach(m => {
          const style = modelStyleMap.get(m);
          console.log(`    - "${m}" (стиль: "${style || 'не указан'}")`);
        });
        if (models.size > 10) {
          console.log(`    ... и еще ${models.size - 10} моделей`);
        }
      }

      if (parseErrors > 0) {
        console.log(`  ⚠️  Ошибок парсинга: ${parseErrors}`);
      }
    }
    console.log('');

    // 5. Проверка связей
    console.log('5. ПРОВЕРКА СВЯЗЕЙ ДАННЫХ');
    console.log('----------------------------------------');
    
    // Проверяем, есть ли товары с несуществующими категориями
    const productsWithInvalidCategory = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count 
      FROM products p 
      LEFT JOIN catalog_categories c ON p.catalog_category_id = c.id 
      WHERE c.id IS NULL
    `);
    
    const invalidCount = productsWithInvalidCategory[0]?.count || 0;
    if (invalidCount > 0) {
      console.log(`  ⚠️  Товаров с несуществующими категориями: ${invalidCount}`);
    } else {
      console.log(`  ✅ Все товары имеют валидные категории`);
    }

    // Проверяем заказы с несуществующими клиентами
    const ordersWithInvalidClient = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count 
      FROM orders o 
      LEFT JOIN clients c ON o.client_id = c.id 
      WHERE c.id IS NULL AND o.client_id IS NOT NULL
    `);
    
    const invalidOrdersCount = ordersWithInvalidClient[0]?.count || 0;
    if (invalidOrdersCount > 0) {
      console.log(`  ⚠️  Заказов с несуществующими клиентами: ${invalidOrdersCount}`);
    } else {
      console.log(`  ✅ Все заказы имеют валидных клиентов`);
    }
    console.log('');

    // 6. Проверка индексов
    console.log('6. ПРОВЕРКА ИНДЕКСОВ');
    console.log('----------------------------------------');
    
    try {
      const indexes = await prisma.$queryRawUnsafe(`
        SELECT name, tbl_name 
        FROM sqlite_master 
        WHERE type = 'index' AND tbl_name IN ('products', 'catalog_categories', 'clients', 'orders')
        ORDER BY tbl_name, name
      `);
      
      if (indexes.length > 0) {
        console.log(`  Найдено индексов: ${indexes.length}`);
        indexes.slice(0, 10).forEach(idx => {
          console.log(`    - ${idx.name} (таблица: ${idx.tbl_name})`);
        });
      } else {
        console.log('  ⚠️  Индексы не найдены');
      }
    } catch (e) {
      console.log(`  ⚠️  Ошибка проверки индексов: ${e.message}`);
    }
    console.log('');

    // 7. Итоговая статистика
    console.log('7. ИТОГОВАЯ СТАТИСТИКА');
    console.log('----------------------------------------');
    
    const stats = {
      users: await prisma.user.count(),
      clients: await prisma.client.count(),
      orders: await prisma.order.count(),
      products: await prisma.product.count(),
      categories: await prisma.catalogCategory.count(),
      activeProducts: await prisma.product.count({ where: { is_active: true } }),
      doorsProducts: doorsCategory ? await prisma.product.count({
        where: {
          catalog_category_id: doorsCategoryId,
          is_active: true
        }
      }) : 0
    };

    console.log('  Пользователей:', stats.users);
    console.log('  Клиентов:', stats.clients);
    console.log('  Заказов:', stats.orders);
    console.log('  Товаров всего:', stats.products);
    console.log('  Товаров активных:', stats.activeProducts);
    console.log('  Категорий:', stats.categories);
    console.log('  Товаров в категории дверей:', stats.doorsProducts);
    console.log('');

    // 8. Рекомендации
    console.log('8. РЕКОМЕНДАЦИИ');
    console.log('----------------------------------------');
    
    if (!doorsCategory) {
      console.log('  ❌ КРИТИЧНО: Категория дверей не найдена!');
      console.log('     Нужно создать категорию или обновить ID в коде');
    }
    
    if (stats.doorsProducts === 0) {
      console.log('  ❌ КРИТИЧНО: Нет товаров в категории дверей!');
      console.log('     Нужно импортировать товары или проверить категорию');
    }
    
    if (stats.doorsProducts > 0 && stats.doorsProducts < 10) {
      console.log('  ⚠️  ВНИМАНИЕ: Мало товаров в категории дверей');
      console.log('     Рекомендуется импортировать больше данных');
    }

    if (invalidCount > 0 || invalidOrdersCount > 0) {
      console.log('  ⚠️  ВНИМАНИЕ: Найдены нарушения целостности данных');
      console.log('     Рекомендуется проверить и исправить связи');
    }

    console.log('');

    await prisma.$disconnect();
    console.log('✅ Аудит завершен');
    
  } catch (error) {
    console.error('❌ Ошибка аудита:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fullAudit();

