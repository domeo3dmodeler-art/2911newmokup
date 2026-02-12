/**
 * Выборочная проверка ссылок на фото из PropertyPhoto (лист «Цвет»).
 * Проверяет, отдают ли URL реальные изображения (HTTP 200 и image/*).
 *
 * Запуск: npx tsx scripts/check-photo-links.ts
 */
import { PrismaClient } from '@prisma/client';
import { getDoorsCategoryId } from '../lib/catalog-categories';
import { DOOR_COLOR_PROPERTY } from '../lib/property-photos';

const prisma = new PrismaClient();

function looksLikeUrl(path: string): boolean {
  const t = path.trim();
  return t.startsWith('http://') || t.startsWith('https://');
}

function looksLikeTextNotFile(path: string): boolean {
  const t = path.trim();
  return t.includes(' ') && !/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(t);
}

async function checkUrl(url: string): Promise<{ ok: boolean; status?: number; contentType?: string; error?: string }> {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    const contentType = res.headers.get('content-type') || '';
    const ok = res.ok && (contentType.startsWith('image/') || contentType.includes('octet-stream'));
    return { ok, status: res.status, contentType };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function main() {
  const doorsCatId = await getDoorsCategoryId();
  if (!doorsCatId) {
    console.error('Категория "Межкомнатные двери" не найдена.');
    return;
  }

  const photos = await prisma.propertyPhoto.findMany({
    where: {
      categoryId: doorsCatId,
      propertyName: DOOR_COLOR_PROPERTY,
      photoType: 'cover',
    },
    select: { photoPath: true, propertyValue: true },
    take: 200,
  });

  const byPath = new Map<string, string>();
  for (const p of photos) {
    const path = (p.photoPath || '').trim();
    if (!path) continue;
    if (looksLikeTextNotFile(path)) continue;
    if (!byPath.has(path)) byPath.set(path, p.propertyValue);
  }

  const toCheck: string[] = [];
  for (const path of byPath.keys()) {
    if (looksLikeUrl(path)) toCheck.push(path);
  }

  const sample = toCheck.slice(0, 15);
  if (sample.length === 0) {
    console.log('Нет внешних URL (http/https) в выборке. Проверяем первые 10 путей из БД:\n');
    const paths = Array.from(byPath.keys()).slice(0, 10);
    for (const path of paths) {
      const short = path.length > 80 ? path.slice(0, 77) + '...' : path;
      console.log('  -', short);
      console.log('    (локальный путь — проверка по HTTP не выполняется)');
    }
    return;
  }

  console.log('Проверка выборочных ссылок на фото (HEAD запрос):\n');
  let okCount = 0;
  let failCount = 0;
  for (const url of sample) {
    const label = byPath.get(url) || '';
    const short = url.length > 70 ? url.slice(0, 67) + '...' : url;
    process.stdout.write(`${short} ... `);
    const result = await checkUrl(url);
    if (result.ok) {
      okCount++;
      console.log('OK', result.contentType || '');
    } else {
      failCount++;
      console.log('FAIL', result.status ?? result.error, result.contentType || '');
    }
    if (label) console.log('    propertyValue:', label.slice(0, 60) + (label.length > 60 ? '...' : ''));
  }
  console.log('\n--- Итог ---');
  console.log(`Проверено: ${sample.length}. Отдают картинку (image/*): ${okCount}. Страница/ошибка: ${failCount}.`);
  if (failCount > 0) {
    console.log('\nЕсли ссылки ведут на Яндекс.Диск/облако — это страницы, а не прямые URL файла.');
    console.log('В «Ссылка на обложку» нужны прямые ссылки на изображение (например, получать «Прямую ссылку» в облаке).');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
