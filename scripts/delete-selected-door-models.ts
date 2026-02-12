import { PrismaClient } from '@prisma/client';
import { getDoorsCategoryId } from '../lib/catalog-categories';
import { DOOR_COLOR_PROPERTY } from '../lib/property-photos';

const prisma = new PrismaClient();

const TARGET_MODEL_NAMES = [
  'Дверное полотно Elegance 1 ПГ иск.п.',
  'Дверное полотно Elegance 2 ПГ иск.п.',
  'Дверное полотно Elegance 3 ПГ иск.п.',
  'Дверь In44 ДГ КП',
  'Дверь In9 invisible box ДГ Универсальное КП',
];

function parseProps(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (typeof value === 'object') return value as Record<string, unknown>;
  return {};
}

async function main() {
  const apply = process.argv.includes('--yes');
  const doorsCategoryId = await getDoorsCategoryId();
  if (!doorsCategoryId) {
    throw new Error('Категория "Межкомнатные двери" не найдена');
  }

  const products = await prisma.product.findMany({
    where: { catalog_category_id: doorsCategoryId },
    select: { id: true, sku: true, properties_data: true },
  });

  const toDeleteProducts = products.filter((p) => {
    const props = parseProps(p.properties_data);
    const modelName = String(props['Название модели'] ?? '').trim();
    return TARGET_MODEL_NAMES.includes(modelName);
  });

  const allColorPhotos = await prisma.propertyPhoto.findMany({
    where: { categoryId: doorsCategoryId, propertyName: DOOR_COLOR_PROPERTY },
    select: { id: true, propertyValue: true },
  });

  const toDeleteColorPhotoIds = allColorPhotos
    .filter((pp) => {
      const pv = String(pp.propertyValue || '');
      return TARGET_MODEL_NAMES.some((name) => pv.startsWith(`${name}|`));
    })
    .map((x) => x.id);

  console.log('Модели к удалению:', TARGET_MODEL_NAMES);
  console.log('Товаров к удалению:', toDeleteProducts.length);
  console.log('Удаление по коду модели: выключено (безопасный режим)');
  console.log('PropertyPhoto (Цвет) к удалению:', toDeleteColorPhotoIds.length);

  if (!apply) {
    console.log('\nDry-run режим. Для удаления запустите:');
    console.log('npx tsx scripts/delete-selected-door-models.ts --yes');
    return;
  }

  const productIds = toDeleteProducts.map((p) => p.id);
  const deletedImages = productIds.length
    ? await prisma.productImage.deleteMany({ where: { product_id: { in: productIds } } })
    : { count: 0 };
  const deletedProducts = productIds.length
    ? await prisma.product.deleteMany({ where: { id: { in: productIds } } })
    : { count: 0 };
  const deletedPhotos = toDeleteColorPhotoIds.length
    ? await prisma.propertyPhoto.deleteMany({ where: { id: { in: toDeleteColorPhotoIds } } })
    : { count: 0 };

  console.log('\nУдаление завершено:');
  console.log('Удалено ProductImage:', deletedImages.count);
  console.log('Удалено Product:', deletedProducts.count);
  console.log('Удалено PropertyPhoto:', deletedPhotos.count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
