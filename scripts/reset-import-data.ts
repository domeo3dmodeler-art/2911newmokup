/**
 * Полная очистка данных импорта final_filled перед "чистой" сверкой.
 *
 * Удаляет:
 * - все товары в категориях:
 *   «Межкомнатные двери», «Наличники», «Комплекты фурнитуры», «Ручки и завертки», «Ограничители»
 * - все PropertyPhoto категории «Межкомнатные двери»
 *
 * Запуск:
 *   npx tsx scripts/reset-import-data.ts --dry-run
 *   npx tsx scripts/reset-import-data.ts --yes
 */
import { PrismaClient } from '@prisma/client';
import { getCategoryIdByName } from '../lib/catalog-categories';

const prisma = new PrismaClient();

const CATEGORY_NAMES = [
  'Межкомнатные двери',
  'Наличники',
  'Комплекты фурнитуры',
  'Ручки и завертки',
  'Ограничители',
] as const;

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const yes = process.argv.includes('--yes');

  if (!dryRun && !yes) {
    console.error('Операция потенциально разрушительная.');
    console.error('Используйте --dry-run для просмотра или --yes для подтверждения удаления.');
    process.exit(1);
  }

  const categoryIds: Record<string, string> = {};
  for (const name of CATEGORY_NAMES) {
    const id = await getCategoryIdByName(name);
    if (id) categoryIds[name] = id;
  }

  const existingCategoryIds = Object.values(categoryIds);
  const doorsCatId = categoryIds['Межкомнатные двери'];

  if (existingCategoryIds.length === 0) {
    console.log('Категории не найдены. Очищать нечего.');
    return;
  }

  const [productsCount, photosCount] = await Promise.all([
    prisma.product.count({
      where: { catalog_category_id: { in: existingCategoryIds } },
    }),
    doorsCatId ? prisma.propertyPhoto.count({ where: { categoryId: doorsCatId } }) : 0,
  ]);

  console.log('Категории для очистки:');
  for (const name of CATEGORY_NAMES) {
    console.log(`- ${name}: ${categoryIds[name] ? 'найдена' : 'не найдена'}`);
  }
  console.log(`\nБудет удалено товаров: ${productsCount}`);
  console.log(`Будет удалено PropertyPhoto (двери): ${photosCount}`);

  if (dryRun) {
    console.log('\n--dry-run: удаление не выполнялось.');
    return;
  }

  // Сначала фото, затем товары.
  if (doorsCatId) {
    const deletedPhotos = await prisma.propertyPhoto.deleteMany({ where: { categoryId: doorsCatId } });
    console.log(`Удалено PropertyPhoto: ${deletedPhotos.count}`);
  }

  const deletedProducts = await prisma.product.deleteMany({
    where: { catalog_category_id: { in: existingCategoryIds } },
  });
  console.log(`Удалено Product: ${deletedProducts.count}`);

  console.log('\nОчистка завершена.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

