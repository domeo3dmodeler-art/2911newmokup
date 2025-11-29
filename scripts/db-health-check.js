const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function healthCheck() {
  console.log('========================================');
  console.log('ПРОВЕРКА ЗДОРОВЬЯ БД');
  console.log('========================================');
  console.log('');

  const issues = [];
  const warnings = [];

  try {
    await prisma.$connect();
    console.log('✅ Подключение к БД: OK');
    console.log('');

    // Проверка 1: Категория дверей
    const DOORS_CATEGORY_ID = 'cmg50xcgs001cv7mn0tdyk1wo';
    const doorsCategory = await prisma.catalogCategory.findUnique({
      where: { id: DOORS_CATEGORY_ID }
    });

    if (!doorsCategory) {
      issues.push('КРИТИЧНО: Категория дверей не найдена');
    } else {
      console.log('✅ Категория дверей: найдена');
      console.log(`   Название: "${doorsCategory.name}"`);
      console.log(`   Активна: ${doorsCategory.is_active}`);
    }
    console.log('');

    // Проверка 2: Товары в категории
    const productsCount = await prisma.product.count({
      where: {
        catalog_category_id: DOORS_CATEGORY_ID,
        is_active: true
      }
    });

    if (productsCount === 0) {
      issues.push('КРИТИЧНО: Нет товаров в категории дверей');
    } else {
      console.log(`✅ Товары в категории: ${productsCount} шт.`);
      
      if (productsCount < 10) {
        warnings.push(`Мало товаров в категории: ${productsCount}`);
      }
    }
    console.log('');

    // Проверка 3: Структура данных
    const sampleProduct = await prisma.product.findFirst({
      where: {
        catalog_category_id: DOORS_CATEGORY_ID,
        is_active: true
      },
      select: {
        id: true,
        name: true,
        properties_data: true
      }
    });

    if (sampleProduct) {
      try {
        let properties = {};
        if (typeof sampleProduct.properties_data === 'string') {
          properties = JSON.parse(sampleProduct.properties_data);
        } else if (sampleProduct.properties_data) {
          properties = sampleProduct.properties_data;
        }

        const requiredFields = [
          'Domeo_Название модели для Web',
          'Domeo_Стиль Web',
          'Артикул поставщика'
        ];

        const missingFields = requiredFields.filter(f => !properties[f]);
        
        if (missingFields.length > 0) {
          warnings.push(`Отсутствуют поля в properties_data: ${missingFields.join(', ')}`);
        } else {
          console.log('✅ Структура properties_data: OK');
          console.log(`   Модель: ${properties['Domeo_Название модели для Web']}`);
          console.log(`   Стиль: ${properties['Domeo_Стиль Web']}`);
        }
      } catch (e) {
        issues.push(`Ошибка парсинга properties_data: ${e.message}`);
      }
    }
    console.log('');

    // Проверка 4: Разнообразие данных
    const allProducts = await prisma.product.findMany({
      where: {
        catalog_category_id: DOORS_CATEGORY_ID,
        is_active: true
      },
      select: {
        properties_data: true
      }
    });

    const styles = new Set();
    const models = new Set();

    allProducts.forEach(p => {
      try {
        let props = {};
        if (typeof p.properties_data === 'string') {
          props = JSON.parse(p.properties_data);
        } else if (p.properties_data) {
          props = p.properties_data;
        }

        if (props['Domeo_Название модели для Web']) {
          models.add(props['Domeo_Название модели для Web']);
        }
        if (props['Domeo_Стиль Web']) {
          styles.add(props['Domeo_Стиль Web']);
        }
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
    });

    console.log(`✅ Уникальных стилей: ${styles.size}`);
    if (styles.size === 0) {
      issues.push('КРИТИЧНО: Нет стилей в данных');
    } else if (styles.size === 1) {
      warnings.push(`Только один стиль в данных: ${Array.from(styles)[0]}`);
    }

    console.log(`✅ Уникальных моделей: ${models.size}`);
    if (models.size === 0) {
      issues.push('КРИТИЧНО: Нет моделей в данных');
    } else if (models.size === 1) {
      warnings.push(`Только одна модель в данных: ${Array.from(models)[0]}`);
    }
    console.log('');

    // Проверка 5: Связи данных
    const invalidProducts = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) as count 
      FROM products p 
      LEFT JOIN catalog_categories c ON p.catalog_category_id = c.id 
      WHERE c.id IS NULL
    `);

    const invalidCount = invalidProducts[0]?.count || 0;
    if (invalidCount > 0) {
      issues.push(`Товаров с несуществующими категориями: ${invalidCount}`);
    } else {
      console.log('✅ Целостность связей: OK');
    }
    console.log('');

    // Итоговый отчет
    console.log('========================================');
    console.log('ИТОГОВЫЙ ОТЧЕТ');
    console.log('========================================');
    console.log('');

    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ Все проверки пройдены успешно!');
    } else {
      if (issues.length > 0) {
        console.log('❌ КРИТИЧЕСКИЕ ПРОБЛЕМЫ:');
        issues.forEach(issue => {
          console.log(`   - ${issue}`);
        });
        console.log('');
      }

      if (warnings.length > 0) {
        console.log('⚠️  ПРЕДУПРЕЖДЕНИЯ:');
        warnings.forEach(warning => {
          console.log(`   - ${warning}`);
        });
        console.log('');
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Ошибка проверки:', error.message);
    process.exit(1);
  }
}

healthCheck();

