/**
 * Выгрузка из локальной БД всех PropertyPhoto (Domeo_Модель_Цвет) в JSON.
 * Запуск: node scripts/export-property-photos-door-colors.mjs [--out=path]
 * По умолчанию: scripts/output/property-photos-door-colors.json
 */
import { config } from 'dotenv';
config({ path: '.env.postgresql' });
config({ path: '.env.local' });
config({ path: '.env' });

import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

const PROPERTY_NAME = 'Domeo_Модель_Цвет';

async function main() {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  const outArg = process.argv.find((a) => a.startsWith('--out='));
  const outPath = outArg ? outArg.slice('--out='.length) : 'scripts/output/property-photos-door-colors.json';

  const rows = await prisma.propertyPhoto.findMany({
    where: { propertyName: PROPERTY_NAME },
    select: { propertyValue: true, photoPath: true, photoType: true },
  });

  const data = rows.map((r) => ({
    propertyValue: r.propertyValue,
    photoPath: r.photoPath,
    photoType: r.photoType || 'cover',
  }));

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(data, null, 2), 'utf8');

  console.log('Экспорт:', data.length, 'записей ->', outPath);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
