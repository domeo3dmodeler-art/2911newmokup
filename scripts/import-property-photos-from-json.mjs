/**
 * Импорт PropertyPhoto (Domeo_Модель_Цвет) из JSON на ВМ.
 * Запуск на ВМ: node scripts/import-property-photos-from-json.mjs [path/to/file.json]
 * По умолчанию: scripts/output/property-photos-door-colors.json
 */
import { config } from 'dotenv';
config({ path: '.env' });

import { readFile } from 'fs/promises';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PROPERTY_NAME = 'Domeo_Модель_Цвет';

async function getDoorsCategoryId() {
  const cat = await prisma.catalogCategory.findFirst({
    where: { name: 'Межкомнатные двери' },
    select: { id: true },
  });
  return cat?.id ?? null;
}

async function main() {
  const jsonPath = process.argv[2] || 'scripts/output/property-photos-door-colors.json';
  const dryRun = process.argv.includes('--dry-run');

  const raw = await readFile(jsonPath, 'utf8').catch((e) => {
    console.error('Файл не найден:', jsonPath, e.message);
    process.exit(1);
  });
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    console.error('JSON должен быть массивом записей { propertyValue, photoPath, photoType? }');
    process.exit(1);
  }

  const categoryId = await getDoorsCategoryId();
  if (!categoryId) {
    console.error('Категория «Межкомнатные двери» не найдена.');
    process.exit(1);
  }

  console.log('Категория:', categoryId);
  console.log('Записей в файле:', data.length);
  if (dryRun) {
    console.log('--dry-run: импорт не выполняется.');
    await prisma.$disconnect();
    return;
  }

  let ok = 0;
  for (const row of data) {
    const propertyValue = row.propertyValue;
    const photoPath = row.photoPath;
    const photoType = row.photoType || 'cover';
    if (!propertyValue || !photoPath) continue;
    await prisma.propertyPhoto.upsert({
      where: {
        categoryId_propertyName_propertyValue_photoType: {
          categoryId,
          propertyName: PROPERTY_NAME,
          propertyValue,
          photoType,
        },
      },
      update: { photoPath, updatedAt: new Date() },
      create: {
        categoryId,
        propertyName: PROPERTY_NAME,
        propertyValue,
        photoPath,
        photoType,
      },
    });
    ok++;
  }
  console.log('Импортировано:', ok);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
