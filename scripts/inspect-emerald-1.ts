import { PrismaClient } from '@prisma/client';
import { getDoorsCategoryId } from '../lib/catalog-categories';
import { DOOR_COLOR_PROPERTY } from '../lib/property-photos';

const prisma = new PrismaClient();

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
  const doorsCategoryId = await getDoorsCategoryId();
  if (!doorsCategoryId) throw new Error('doors category not found');

  const code = 'DomeoDoors_Emerald_1';
  const products = await prisma.product.findMany({
    where: { catalog_category_id: doorsCategoryId },
    select: { id: true, sku: true, properties_data: true },
  });

  const matches = products.filter((p) => {
    const props = parseProps(p.properties_data);
    return String(props['Код модели Domeo (Web)'] ?? '').trim() === code;
  });

  const modelNames = Array.from(
    new Set(
      matches.map((p) => {
        const props = parseProps(p.properties_data);
        return String(props['Название модели'] ?? '').trim();
      }),
    ),
  ).filter(Boolean);

  const webNames = Array.from(
    new Set(
      matches.map((p) => {
        const props = parseProps(p.properties_data);
        return String(props['Domeo_Название модели для Web'] ?? '').trim();
      }),
    ),
  ).filter(Boolean);

  const ppByCode = await prisma.propertyPhoto.findMany({
    where: {
      categoryId: doorsCategoryId,
      propertyName: 'Артикул поставщика',
      propertyValue: { startsWith: code.toLowerCase() },
    },
    select: { propertyValue: true, photoType: true, photoPath: true },
    orderBy: [{ propertyValue: 'asc' }, { photoType: 'asc' }],
  });

  const ppColorByCode = await prisma.propertyPhoto.findMany({
    where: {
      categoryId: doorsCategoryId,
      propertyName: DOOR_COLOR_PROPERTY,
      propertyValue: { startsWith: `${code}|` },
    },
    select: { propertyValue: true, photoType: true, photoPath: true },
    orderBy: [{ propertyValue: 'asc' }, { photoType: 'asc' }],
  });

  const ppColorByNames = await prisma.propertyPhoto.findMany({
    where: {
      categoryId: doorsCategoryId,
      propertyName: DOOR_COLOR_PROPERTY,
      OR: modelNames.map((name) => ({ propertyValue: { startsWith: `${name}|` } })),
    },
    select: { propertyValue: true, photoType: true, photoPath: true },
    orderBy: [{ propertyValue: 'asc' }, { photoType: 'asc' }],
  });

  console.log('code', code);
  console.log('products_count', matches.length);
  console.log('modelNames', modelNames);
  console.log('webNames', webNames);
  console.log('ppByCode_count', ppByCode.length);
  console.log('ppByCode_sample', ppByCode.slice(0, 5));
  console.log('ppColorByCode_count', ppColorByCode.length);
  console.log('ppColorByCode_sample', ppColorByCode.slice(0, 5));
  console.log('ppColorByNames_count', ppColorByNames.length);
  console.log('ppColorByNames_sample', ppColorByNames.slice(0, 8));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
