/**
 * Проверка: все ли фото из БД отображаются.
 * 1) Записи с http — не отображаются (resolveImagePath отфильтрует 360/облако).
 * 2) Записи с /uploads/... — проверяем наличие файла в public/uploads.
 *
 * Запуск: npx tsx scripts/verify-all-photos-display.ts [--fix-http-to-empty]
 *   --fix-http-to-empty  заменить оставшиеся http в photoPath/url на пустую строку (на фронте будет placeholder).
 */
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();
const PUBLIC_UPLOADS = path.join(process.cwd(), 'public', 'uploads');

function toFilePath(webPath: string): string {
  const p = webPath.replace(/^\/uploads\//, '');
  return path.join(PUBLIC_UPLOADS, ...p.split('/'));
}

async function main() {
  const fixHttp = process.argv.includes('--fix-http-to-empty');
  console.log('=== Проверка: все фото отображаются ===\n');

  const ppAll = await prisma.propertyPhoto.findMany({
    select: { id: true, photoPath: true, propertyName: true },
  });
  const piAll = await prisma.productImage.findMany({
    select: { id: true, url: true },
  });

  let ppHttp = 0,
    ppLocal = 0,
    ppMissing = 0;
  const ppMissingPaths: string[] = [];
  for (const p of ppAll) {
    const pathStr = (p.photoPath || '').trim();
    if (!pathStr) continue;
    if (pathStr.startsWith('http')) {
      ppHttp++;
      continue;
    }
    if (pathStr.startsWith('/uploads/')) {
      ppLocal++;
      const filePath = toFilePath(pathStr);
      if (!fs.existsSync(filePath)) {
        ppMissing++;
        if (ppMissingPaths.length < 15) ppMissingPaths.push(pathStr);
      }
    }
  }

  let piHttp = 0,
    piLocal = 0,
    piMissing = 0;
  const piMissingPaths: string[] = [];
  for (const p of piAll) {
    const pathStr = (p.url || '').trim();
    if (!pathStr) continue;
    if (pathStr.startsWith('http')) {
      piHttp++;
      continue;
    }
    if (pathStr.startsWith('/uploads/')) {
      piLocal++;
      const filePath = toFilePath(pathStr);
      if (!fs.existsSync(filePath)) {
        piMissing++;
        if (piMissingPaths.length < 15) piMissingPaths.push(pathStr);
      }
    }
  }

  console.log('PropertyPhoto:');
  console.log('  всего:', ppAll.length);
  console.log('  с http (не отображаются на фронте):', ppHttp);
  console.log('  с локальным путём:', ppLocal);
  console.log('  из них файл отсутствует:', ppMissing);
  if (ppMissingPaths.length) {
    console.log('  примеры отсутствующих:');
    ppMissingPaths.forEach((p) => console.log('   ', p));
  }

  console.log('\nProductImage:');
  console.log('  всего:', piAll.length);
  console.log('  с http:', piHttp);
  console.log('  с локальным путём:', piLocal);
  console.log('  из них файл отсутствует:', piMissing);
  if (piMissingPaths.length) {
    console.log('  примеры отсутствующих:');
    piMissingPaths.forEach((p) => console.log('   ', p));
  }

  if (fixHttp && (ppHttp > 0 || piHttp > 0)) {
    const ppIds = ppAll.filter((p) => (p.photoPath || '').trim().startsWith('http')).map((p) => p.id);
    const piIds = piAll.filter((p) => (p.url || '').trim().startsWith('http')).map((p) => p.id);
    for (const id of ppIds) {
      await prisma.propertyPhoto.update({ where: { id }, data: { photoPath: '' } });
    }
    for (const id of piIds) {
      await prisma.productImage.update({ where: { id }, data: { url: '' } });
    }
    console.log('\nОбновлено: PropertyPhoto', ppIds.length, ', ProductImage', piIds.length, '(http → пусто, на фронте placeholder).');
  }

  // Очистить photoPath, которые не путь и не http (например текст «пока не добавляем»)
  const invalidPp = ppAll.filter((p) => {
    const s = (p.photoPath || '').trim();
    return s.length > 0 && !s.startsWith('http') && !s.startsWith('/');
  });
  if (fixHttp && invalidPp.length > 0) {
    for (const p of invalidPp) {
      await prisma.propertyPhoto.update({ where: { id: p.id }, data: { photoPath: '' } });
    }
    console.log('Очищено некорректных photoPath (текст вместо пути):', invalidPp.length);
  }

  const totalBroken = ppHttp + ppMissing + piHttp + piMissing;
  console.log('\n--- Итог ---');
  if (totalBroken === 0) {
    console.log('Все фото имеют локальный путь и файлы на диске — отображение возможно для всех.');
  } else {
    console.log('Записей, которые не отобразятся или 404:', totalBroken);
    if (ppHttp + piHttp > 0) console.log('  — заменить оставшиеся http: npx tsx scripts/verify-all-photos-display.ts --fix-http-to-empty');
    if (ppMissing + piMissing > 0) console.log('  — добавить отсутствующие файлы в public/uploads или поправить пути в БД.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
