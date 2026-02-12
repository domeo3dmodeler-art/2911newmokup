/**
 * Диагностика: почему у моделей дверей нет фото.
 * Проверяет: категория дверей, товары, PropertyPhoto, ProductImage, совпадение ключей.
 * Запуск: npx tsx scripts/diagnose-door-photos.ts
 */
import { PrismaClient } from '@prisma/client';
import { getDoorsCategoryId } from '../lib/catalog-categories';
import { getPropertyPhotos } from '../lib/property-photos';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Диагностика фото моделей дверей ===\n');

  const doorsCategoryId = await getDoorsCategoryId();
  if (!doorsCategoryId) {
    console.log('ОШИБКА: Категория "Межкомнатные двери" не найдена в БД.');
    process.exit(1);
  }
  console.log('1. Категория дверей:', doorsCategoryId);

  const productsCount = await prisma.product.count({
    where: {
      catalog_category_id: doorsCategoryId,
      is_active: true,
    },
  });
  console.log('2. Товаров (двери, активные):', productsCount);

  // Собираем уникальные modelKey из товаров (как в complete-data)
  const products = await prisma.product.findMany({
    where: {
      catalog_category_id: doorsCategoryId,
      is_active: true,
    },
    select: { properties_data: true },
    take: 500,
  });

  const modelKeys = new Set<string>();
  const factoryNames = new Set<string>();
  products.forEach((p) => {
    let props: Record<string, unknown> = {};
    try {
      props = typeof p.properties_data === 'string' ? JSON.parse(p.properties_data) : p.properties_data || {};
    } catch {
      return;
    }
    const domeoCode = String(props['Код модели Domeo (Web)'] ?? '').trim();
    const sku = props['Артикул поставщика'];
    const modelKey = domeoCode || (typeof sku === 'string' ? sku : String(sku || ''));
    if (modelKey && modelKey.trim()) modelKeys.add(modelKey);
    const name = props['Domeo_Название модели для Web'];
    if (typeof name === 'string' && name.trim()) factoryNames.add(name.trim());
  });

  console.log('3. Уникальных кодов моделей (Код модели Domeo / Артикул):', modelKeys.size);
  const sampleKeys = Array.from(modelKeys).slice(0, 5);
  console.log('   Примеры:', sampleKeys.join(', ') || '(нет)');

  console.log('4. Уникальных фабричных названий (Domeo_Название модели для Web):', factoryNames.size);
  const sampleNames = Array.from(factoryNames).slice(0, 3);
  console.log('   Примеры:', sampleNames.join(', ') || '(нет)');

  // PropertyPhoto по категории дверей
  const ppAll = await prisma.propertyPhoto.count({
    where: { categoryId: doorsCategoryId },
  });
  console.log('\n5. PropertyPhoto для категории дверей (всего):', ppAll);

  const ppByArticle = await prisma.propertyPhoto.count({
    where: {
      categoryId: doorsCategoryId,
      propertyName: 'Артикул поставщика',
    },
  });
  const ppByModelName = await prisma.propertyPhoto.count({
    where: {
      categoryId: doorsCategoryId,
      propertyName: 'Domeo_Название модели для Web',
    },
  });
  const ppByColor = await prisma.propertyPhoto.count({
    where: {
      categoryId: doorsCategoryId,
      propertyName: 'Domeo_Модель_Цвет',
    },
  });
  console.log('   - propertyName "Артикул поставщика":', ppByArticle);
  console.log('   - propertyName "Domeo_Название модели для Web":', ppByModelName);
  console.log('   - propertyName "Domeo_Модель_Цвет":', ppByColor);

  if (ppByColor > 0) {
    const sampleColor = await prisma.propertyPhoto.findMany({
      where: {
        categoryId: doorsCategoryId,
        propertyName: 'Domeo_Модель_Цвет',
      },
      take: 5,
      select: { propertyValue: true, photoType: true },
    });
    console.log('   Примеры Domeo_Модель_Цвет (propertyValue):', sampleColor.map((r) => r.propertyValue));
  }

  if (ppByArticle > 0 || ppByModelName > 0) {
    const sample = await prisma.propertyPhoto.findMany({
      where: {
        categoryId: doorsCategoryId,
        propertyName: { in: ['Артикул поставщика', 'Domeo_Название модели для Web'] },
      },
      take: 5,
      select: { propertyValue: true, propertyName: true, photoPath: true },
    });
    console.log('   Примеры записей:', JSON.stringify(sample, null, 0));
  }

  // Совпадение: есть ли в PropertyPhoto значение, совпадающее с нашим modelKey?
  let searchFound = 0;
  if (sampleKeys.length > 0) {
    const firstKey = sampleKeys[0];
    const normalized = firstKey.toLowerCase();
    const found = await getPropertyPhotos(doorsCategoryId, 'Артикул поставщика', normalized);
    searchFound = found.length;
    console.log('\n6. Поиск фото для первой модели (Артикул поставщика =', JSON.stringify(normalized), '): найдено записей:', found.length);
    if (found.length > 0) console.log('   photoPath:', found[0].photoPath);
  }

  // ProductImage для товаров дверей
  const doorProductIds = await prisma.product.findMany({
    where: {
      catalog_category_id: doorsCategoryId,
      is_active: true,
    },
    select: { id: true },
    take: 1000,
  });
  const ids = doorProductIds.map((p) => p.id);
  const imageCount = await prisma.productImage.count({
    where: { product_id: { in: ids } },
  });
  console.log('\n7. ProductImage для товаров дверей (по первым', ids.length, 'товарам):', imageCount);

  if (imageCount > 0) {
    const sampleImg = await prisma.productImage.findFirst({
      where: { product_id: { in: ids } },
      select: { url: true, product_id: true },
    });
    console.log('   Пример url:', sampleImg?.url);
  }

  // Итог
  console.log('\n=== Итог ===');
  if (ppAll === 0 && imageCount === 0) {
    console.log('ПРИЧИНА: В БД нет ни записей PropertyPhoto для категории дверей, ни ProductImage у товаров дверей.');
    console.log('Действия: импортировать/привязать фото (PropertyPhoto по артикулу или названию модели, либо ProductImage у товаров) и положить файлы в public/uploads/');
  } else if (ppByArticle === 0 && ppByModelName === 0 && imageCount === 0) {
    console.log('ПРИЧИНА: Есть только PropertyPhoto с propertyName "Domeo_Модель_Цвет" (цвета). Обложка модели берётся из "Артикул поставщика" или "Domeo_Название модели для Web" или ProductImage — их нет.');
    console.log('Действия: добавить привязку фото по артикулу/названию модели или загрузить изображения к товарам (ProductImage).');
  } else if (sampleKeys.length > 0 && searchFound === 0 && ppByArticle > 0) {
    console.log('ПРИЧИНА: В PropertyPhoto есть записи "Артикул поставщика", но propertyValue не совпадает с кодами моделей из товаров (сравнение без учёта регистра).');
    console.log('Проверьте: в товарах Код модели Domeo (Web) / Артикул =', sampleKeys[0], '; в PropertyPhoto ищется', sampleKeys[0].toLowerCase());
  }
  if (ppByColor > 0 && ppByArticle === 0 && sampleKeys.length > 0) {
    console.log('\nФОРМАТ ДАННЫХ: В Domeo_Модель_Цвет префикс в БД (например "Дверное полотно A-Line 1 ПО") не совпадает с кодами моделей в товарах (DomeoDoors_Base_1) и с фабричными названиями. Обложка модели не подставляется из цветов.');
    console.log('РЕКОМЕНДАЦИЯ: Добавить фото по коду модели: заполнить PropertyPhoto с propertyName="Артикул поставщика", propertyValue=domeodoors_base_1 (lowercase), photoType=cover, photoPath=путь к файлу. Либо загрузить изображения к товарам (ProductImage).');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
