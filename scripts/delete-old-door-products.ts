/**
 * Удаляет из категории «Межкомнатные двери» товары со старым форматом SKU:
 * door_код_ширина_высота (без суффикса типа покрытия).
 * Новый формат: door_код_ширина_высота_покрытие.
 *
 * Запуск: npx tsx scripts/delete-old-door-products.ts [--dry-run]
 */
import { PrismaClient } from '@prisma/client';
import { getDoorsCategoryId } from '../lib/catalog-categories';

const prisma = new PrismaClient();

/** Старый SKU: заканчивается на _число_число, без суффикса покрытия. */
const OLD_SKU_REGEX = /^door_.+_\d+_\d+$/;

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const doorsCatId = await getDoorsCategoryId();
  if (!doorsCatId) {
    console.error('Категория «Межкомнатные двери» не найдена.');
    process.exit(1);
  }

  const products = await prisma.product.findMany({
    where: { catalog_category_id: doorsCatId },
    select: { id: true, sku: true },
  });

  const oldProducts = products.filter((p) => OLD_SKU_REGEX.test(p.sku));
  console.log(
    `Товаров в категории: ${products.length}. Со старым SKU (без покрытия): ${oldProducts.length}`
  );

  if (oldProducts.length === 0) {
    console.log('Удалять нечего.');
    return;
  }

  if (dryRun) {
    console.log('--dry-run: примеры SKU к удалению:', oldProducts.slice(0, 5).map((p) => p.sku));
    return;
  }

  const ids = oldProducts.map((p) => p.id);
  const result = await prisma.product.deleteMany({
    where: { id: { in: ids } },
  });
  console.log('Удалено записей:', result.count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
