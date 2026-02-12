/**
 * Проверка: 1) что скачалось по категориям (файлы на диске vs ожидание из Excel);
 *           2) связь фото с товарами в БД и отображение в интерфейсе.
 *
 * Запуск: npx tsx scripts/verify-photo-download-and-binding.ts
 */
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();
const FILE_PATH = path.join(__dirname, '..', '1002', 'final_filled 30.01.xlsx');
const OUT_DIR = path.join(__dirname, '..', 'public', 'uploads', 'final-filled');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

function getColumn(row: Record<string, unknown>, logicalName: string): string {
  const need = logicalName.replace(/\s+/g, ' ').trim();
  for (const k of Object.keys(row)) {
    if (k.replace(/\s+/g, ' ').trim() === need) return String(row[k] ?? '').trim();
  }
  return String(row[logicalName] ?? '').trim();
}

function isHttpUrl(s: string): boolean {
  const t = (s || '').trim();
  return t.startsWith('http://') || t.startsWith('https://');
}

function countExpectedFromExcel(): Record<string, number> {
  const out: Record<string, number> = { Наличники: 0, Цвет: 0, '04 Ручки Завертки': 0, '05 Ограничители': 0 };
  if (!fs.existsSync(FILE_PATH)) return out;
  const wb = XLSX.readFile(FILE_PATH, { raw: false });
  const toJson = (name: string) => {
    const ws = wb.Sheets[name];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
  };
  for (const row of toJson('Наличники')) {
    if (getColumn(row, 'Наличник: Название') && isHttpUrl(String(row['Наличник: Фото (ссылка)'] ?? ''))) out['Наличники']++;
  }
  for (const row of toJson('Цвет')) {
    if (isHttpUrl(String(row['Ссылка на обложку'] ?? ''))) out['Цвет']++;
    const g = String(row['Ссылки на галерею (через ;)'] ?? '');
    g.split(';').forEach((s) => { if (isHttpUrl(s.trim())) out['Цвет']++; });
  }
  for (const row of toJson('04 Ручки Завертки')) {
    if (isHttpUrl(String(row['Фото (ссылка)'] ?? ''))) out['04 Ручки Завертки']++;
    if (isHttpUrl(String(row['Фото завертки (ссылка)'] ?? ''))) out['04 Ручки Завертки']++;
  }
  for (const row of toJson('05 Ограничители')) {
    if (getColumn(row, 'Название') && isHttpUrl(String(row['Фото (путь)'] ?? ''))) out['05 Ограничители']++;
  }
  return out;
}

function safeDirName(sheet: string): string {
  return String(sheet).replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').slice(0, 120) || 'item';
}

function countOnDisk(): Record<string, number> {
  const out: Record<string, number> = {};
  if (!fs.existsSync(OUT_DIR)) return out;
  const dirs = fs.readdirSync(OUT_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  for (const d of dirs) {
    const full = path.join(OUT_DIR, d.name);
    const files = fs.readdirSync(full, { recursive: true }).filter((f) => {
      const p = path.join(full, f);
      return fs.statSync(p).isFile();
    });
    out[d.name] = files.length;
  }
  return out;
}

/** Проверить, что по пути /uploads/... файл существует в public/ */
function localPathExists(url: string): boolean {
  if (!url || !url.startsWith('/')) return false;
  const filePath = path.join(PUBLIC_DIR, url.replace(/^\//, '').split('?')[0]);
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

async function main() {
  console.log('=== 1. СТАТУС СКАЧИВАНИЯ (по ссылкам из Excel) ===\n');
  const expected = countExpectedFromExcel();
  const onDisk = countOnDisk();
  const sheetToDir: Record<string, string> = {
    'Наличники': safeDirName('Наличники'),
    'Цвет': safeDirName('Цвет'),
    '04 Ручки Завертки': safeDirName('04 Ручки Завертки'),
    '05 Ограничители': safeDirName('05 Ограничители'),
  };
  let totalExpected = 0;
  let totalOnDisk = 0;
  for (const [sheet, exp] of Object.entries(expected)) {
    const dirName = sheetToDir[sheet] || sheet;
    const disk = onDisk[dirName] ?? 0;
    totalExpected += exp;
    totalOnDisk += disk;
    const status = exp === 0 ? '-' : disk >= exp ? 'OK' : `не хватает ${exp - disk}`;
    console.log(`${sheet}: ожидалось ${exp}, на диске ${disk} — ${status}`);
  }
  console.log(`\nИтого: ожидалось ${totalExpected}, на диске ${totalOnDisk}\n`);

  console.log('=== 2. СВЯЗЬ В БД И ОТОБРАЖЕНИЕ В ИНТЕРФЕЙСЕ ===\n');
  const doorsCat = await prisma.catalogCategory.findFirst({ where: { name: 'Межкомнатные двери' }, select: { id: true } });
  const nalCat = await prisma.catalogCategory.findFirst({ where: { name: 'Наличники' }, select: { id: true } });
  const handCat = await prisma.catalogCategory.findFirst({ where: { name: 'Ручки и завертки' }, select: { id: true } });
  const limCat = await prisma.catalogCategory.findFirst({ where: { name: 'Ограничители' }, select: { id: true } });

  const propertyPhotos = doorsCat
    ? await prisma.propertyPhoto.count({ where: { categoryId: doorsCat.id, propertyName: 'Domeo_Модель_Цвет' } })
    : 0;
  const withLocalPath = doorsCat
    ? await prisma.propertyPhoto.count({
        where: {
          categoryId: doorsCat.id,
          propertyName: 'Domeo_Модель_Цвет',
          photoPath: { not: { startsWith: 'http' } },
        },
      })
    : 0;
  console.log(`PropertyPhoto (Цвет): всего ${propertyPhotos}, с локальным путём (/uploads/...): ${withLocalPath}`);

  if (nalCat) {
    const productsWithImage = await prisma.productImage.count({ where: { product: { catalog_category_id: nalCat.id } } });
    const nalProducts = await prisma.product.count({ where: { catalog_category_id: nalCat.id } });
    const localNal = await prisma.productImage.count({
      where: { product: { catalog_category_id: nalCat.id }, url: { startsWith: '/uploads/' } },
    });
    console.log(`Наличники: товаров ${nalProducts}, с фото в ProductImage ${productsWithImage}, из них локальные ${localNal}`);
  }
  if (handCat) {
    const productsWithImage = await prisma.productImage.count({ where: { product: { catalog_category_id: handCat.id } } });
    const handProducts = await prisma.product.count({ where: { catalog_category_id: handCat.id } });
    const localHand = await prisma.productImage.count({
      where: { product: { catalog_category_id: handCat.id }, url: { startsWith: '/uploads/' } },
    });
    console.log(`Ручки: товаров ${handProducts}, записей ProductImage ${productsWithImage}, из них локальные ${localHand}`);
  }
  if (limCat) {
    const productsWithImage = await prisma.productImage.count({ where: { product: { catalog_category_id: limCat.id } } });
    const limProducts = await prisma.product.count({ where: { catalog_category_id: limCat.id } });
    const localLim = await prisma.productImage.count({
      where: { product: { catalog_category_id: limCat.id }, url: { startsWith: '/uploads/' } },
    });
    console.log(`Ограничители: товаров ${limProducts}, с фото ${productsWithImage}, из них локальные ${localLim}`);
  }

  console.log('\n=== 3. НАЛИЧИЕ ФАЙЛОВ НА ДИСКЕ ДЛЯ ПРИВЯЗАННЫХ ПУТЕЙ ===\n');
  let localPathsChecked = 0;
  let localPathsExist = 0;
  const missingPaths: string[] = [];
  if (doorsCat) {
    const rows = await prisma.propertyPhoto.findMany({
      where: { categoryId: doorsCat.id, propertyName: 'Domeo_Модель_Цвет', photoPath: { not: { startsWith: 'http' } } },
      select: { photoPath: true },
    });
    for (const r of rows) {
      if (r.photoPath) {
        localPathsChecked++;
        if (localPathExists(r.photoPath)) localPathsExist++; else missingPaths.push('[PropertyPhoto Цвет] ' + r.photoPath);
      }
    }
  }
  for (const cat of [nalCat, handCat, limCat].filter(Boolean)) {
    if (!cat) continue;
    const rows = await prisma.productImage.findMany({
      where: { product: { catalog_category_id: cat.id }, url: { startsWith: '/uploads/' } },
      select: { url: true },
    });
    for (const r of rows) {
      localPathsChecked++;
      if (localPathExists(r.url)) localPathsExist++; else missingPaths.push('[ProductImage ' + cat.name + '] ' + r.url);
    }
  }

  console.log(`Локальных путей в БД: ${localPathsChecked}, файл существует на диске: ${localPathsExist}`);
  if (localPathsChecked > 0 && localPathsExist < localPathsChecked) {
    console.log(`  ⚠ Нет файла на диске для ${localPathsChecked - localPathsExist} записей (в UI будет заглушка или 404).`);
    missingPaths.slice(0, 15).forEach((p) => console.log('     ', p));
    if (missingPaths.length > 15) console.log('     ... и ещё', missingPaths.length - 15);
  }

  console.log('\n=== 4. ИТОГ И ОТОБРАЖЕНИЕ В UI ===\n');
  const downloadOk = totalExpected === 0 || totalOnDisk >= totalExpected;
  const bindOk = localPathsChecked > 0;
  const filesOk = localPathsChecked === 0 || localPathsExist === localPathsChecked;
  console.log(`1) Скачано по ссылкам из Excel: ${totalOnDisk}/${totalExpected} ${downloadOk ? '✓' : '— не хватает файлов'}`);
  console.log(`2) Привязано к товарам/свойствам (локальные пути в БД): ${localPathsChecked} записей ${bindOk ? '✓' : ''}`);
  console.log(`3) Файлы по путям из БД существуют на диске: ${localPathsExist}/${localPathsChecked} ${filesOk ? '✓' : '— часть путей ведёт в никуда'}`);
  console.log('\nВ UI фото отображаются так:');
  console.log('  • Цвета дверей: /api/catalog/doors/complete-data → PropertyPhoto.photoPath → картинка из public/');
  console.log('  • Наличники/ручки/ограничители: ProductImage.url → photo_path в конфигураторе (/doors)');
  if (!filesOk && localPathsChecked > 0) {
    console.log('\n  ⚠ Часть привязанных путей не имеет файлов — докачайте фото или обновите привязку.');
  }
  if (doorsCat && withLocalPath < propertyPhotos / 2) {
    console.log('\n  💡 Чтобы подтянуть локальные фото в UI, очистите кэш: DELETE /api/catalog/doors/complete-data или перезапуск сервера.');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
