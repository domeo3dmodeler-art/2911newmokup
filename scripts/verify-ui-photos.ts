/**
 * Проверка: что API отдают пути к фото и что файлы существуют в public/.
 * Запуск: npx tsx scripts/verify-ui-photos.ts
 * Перед запуском: npm run dev (или подставьте BASE_URL).
 */
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.VERIFY_BASE_URL || 'http://localhost:3000';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function fileExists(photoPath: string): boolean {
  if (!photoPath || photoPath.startsWith('http')) return false;
  const p = photoPath.replace(/^\//, '').split('?')[0];
  const full = path.join(PUBLIC_DIR, p);
  try {
    return fs.existsSync(full) && fs.statSync(full).isFile();
  } catch {
    return false;
  }
}

async function main() {
  console.log('BASE_URL:', BASE_URL);
  console.log('');

  let completeData: any = null;
  let hardwareHandles: any = null;

  try {
    const r1 = await fetch(`${BASE_URL}/api/catalog/doors/complete-data`);
    if (!r1.ok) throw new Error(`complete-data: ${r1.status}`);
    const j1 = await r1.json();
    completeData = j1?.data ?? j1;
  } catch (e) {
    console.error('Не удалось загрузить complete-data. Запустите dev: npm run dev');
    console.error(e);
    process.exit(1);
  }

  try {
    const r2 = await fetch(`${BASE_URL}/api/catalog/hardware?type=handles`);
    if (!r2.ok) throw new Error(`hardware: ${r2.status}`);
    const j2 = await r2.json();
    hardwareHandles = j2?.data ?? j2;
  } catch (e) {
    console.error('Не удалось загрузить hardware?type=handles:', e);
  }

  let modelsWithPhoto = 0;
  let modelsWithoutPhoto = 0;
  let colorSlotsWithPhoto = 0;
  let colorSlotsWithoutPhoto = 0;
  let colorPathsExist = 0;
  let colorPathsMissing = 0;
  let handlesWithPhoto = 0;
  let handlesWithoutPhoto = 0;
  let handlePathsExist = 0;
  let handlePathsMissing = 0;

  const models = completeData?.models ?? [];
  for (const m of models) {
    const photo = m.photo ?? m.photos?.cover ?? null;
    if (photo && (photo.startsWith('/uploads/') || photo.startsWith('http'))) {
      modelsWithPhoto++;
    } else {
      modelsWithoutPhoto++;
    }
    const coatings = m.coatings ?? [];
    for (const c of coatings) {
      const pp = c.photo_path ?? null;
      if (pp && (pp.startsWith('/uploads/') || pp.startsWith('http'))) {
        colorSlotsWithPhoto++;
        if (pp.startsWith('/uploads/')) {
          if (fileExists(pp)) colorPathsExist++;
          else colorPathsMissing++;
        }
      } else {
        colorSlotsWithoutPhoto++;
      }
    }
  }

  if (hardwareHandles && typeof hardwareHandles === 'object') {
    const flat: Array<{ photos?: string[] }> = [];
    for (const group of Object.values(hardwareHandles)) {
      if (Array.isArray(group)) flat.push(...group);
    }
    for (const h of flat) {
      const photo = (h.photos && h.photos[0]) ? h.photos[0] : null;
      if (photo && (photo.startsWith('/uploads/') || photo.startsWith('http'))) {
        handlesWithPhoto++;
        if (photo.startsWith('/uploads/')) {
          if (fileExists(photo)) handlePathsExist++;
          else handlePathsMissing++;
        }
      } else {
        handlesWithoutPhoto++;
      }
    }
  }

  console.log('=== complete-data (модели и цвета) ===');
  console.log('Моделей всего:', models.length);
  console.log('  С путём к фото:', modelsWithPhoto, '| Без фото:', modelsWithoutPhoto);
  console.log('Слотов цветов (покрытие+цвет) с photo_path:', colorSlotsWithPhoto, '| без:', colorSlotsWithoutPhoto);
  console.log('  Файл по пути есть на диске:', colorPathsExist, '| нет файла:', colorPathsMissing);
  console.log('');
  console.log('=== hardware?type=handles ===');
  console.log('Ручек с путём к фото:', handlesWithPhoto, '| без:', handlesWithoutPhoto);
  console.log('  Файл по пути есть на диске:', handlePathsExist, '| нет файла:', handlePathsMissing);
  console.log('');
  if (colorPathsMissing > 0 || handlePathsMissing > 0) {
    console.log('Рекомендация: пути в БД есть, но файлов нет — проверьте public/uploads/final-filled/');
  } else if (colorPathsExist > 0 || handlePathsExist > 0) {
    console.log('Фото в API присутствуют и файлы на диске есть — в UI должны отображаться.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
