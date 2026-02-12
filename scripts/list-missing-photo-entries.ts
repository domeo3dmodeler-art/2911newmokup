/**
 * Список товаров (Цвет, Ручки), для которых по Excel ожидается фото, но файла нет на диске.
 * Запуск: npx tsx scripts/list-missing-photo-entries.ts
 */
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const FILE_PATH = path.join(__dirname, '..', '1002', 'final_filled 30.01.xlsx');
const OUT_DIR = path.join(__dirname, '..', 'public', 'uploads', 'final-filled');

function getColumn(row: Record<string, unknown>, logicalName: string): string {
  const need = logicalName.replace(/\s+/g, ' ').trim();
  for (const k of Object.keys(row)) {
    if (k.replace(/\s+/g, ' ').trim() === need) return String(row[k] ?? '').trim();
  }
  return String(row[logicalName] ?? '').trim();
}

function slug(str: string): string {
  return String(str).trim().replace(/\s+/g, '_').replace(/[^\wа-яё_-]/gi, '').slice(0, 80) || 'item';
}

function safeDirName(str: string): string {
  return String(str).replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').slice(0, 120) || 'item';
}

function isHttpUrl(s: string): boolean {
  const t = (s || '').trim();
  return t.startsWith('http://') || t.startsWith('https://');
}

function getExtFromUrl(url: string): string {
  try {
    const u = new URL(url);
    let p = u.pathname;
    const idDialog = u.searchParams.get('idDialog');
    if (idDialog) p = decodeURIComponent(idDialog);
    const m = p.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i);
    if (m) return m[1].toLowerCase().replace('jpeg', 'jpg');
  } catch {}
  return 'jpg';
}

interface Entry {
  sheet: string;
  productKey: string;
  photoType: string;
  url: string;
  label: string;
  /** для Цвет */
  modelName?: string;
  coatingType?: string;
  colorName?: string;
  /** для Ручки */
  handleName?: string;
}

function collectEntries(workbook: XLSX.WorkBook): Entry[] {
  const entries: Entry[] = [];
  const toJson = (sheetName: string) => {
    const ws = workbook.Sheets[sheetName];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: false });
  };

  for (const row of toJson('Цвет')) {
    const modelName = getColumn(row, 'Название модели');
    const coatingType = String(row['Тип покрытия'] ?? '').trim();
    const colorName = String(row['Цвет/отделка'] ?? '').trim();
    const propertyValue = `${modelName}|${coatingType}|${colorName}`;
    const coverUrl = String(row['Ссылка на обложку'] ?? '').trim();
    if (coverUrl && isHttpUrl(coverUrl)) {
      entries.push({
        sheet: 'Цвет',
        productKey: propertyValue,
        photoType: 'cover',
        url: coverUrl,
        label: `Модель: ${modelName} | Покрытие: ${coatingType} | Цвет: ${colorName}`,
      });
    }
    const galleryStr = String(row['Ссылки на галерею (через ;)'] ?? '').trim();
    const galleryUrls = galleryStr ? galleryStr.split(';').map((s: string) => s.trim()).filter(isHttpUrl) : [];
    galleryUrls.forEach((url, i) => {
      entries.push({
        sheet: 'Цвет',
        productKey: propertyValue,
        photoType: `gallery_${i + 1}`,
        url,
        label: `Модель: ${modelName} | Покрытие: ${coatingType} | Цвет: ${colorName} (галерея ${i + 1})`,
      });
    });
  }

  for (const row of toJson('04 Ручки Завертки')) {
    const name = String(row['Название (Domeo_наименование для Web)'] ?? '').trim();
    if (!name) continue;
    const key = `handle_${slug(name)}`;
    const photoUrl = String(row['Фото (ссылка)'] ?? '').trim();
    if (photoUrl && isHttpUrl(photoUrl)) {
      entries.push({ sheet: '04 Ручки Завертки', productKey: key, photoType: 'main', url: photoUrl, label: `Ручка: ${name}` });
    }
    const photoZav = String(row['Фото завертки (ссылка)'] ?? '').trim();
    if (photoZav && isHttpUrl(photoZav)) {
      entries.push({ sheet: '04 Ручки Завертки', productKey: key, photoType: 'zaverтка', url: photoZav, label: `Ручка: ${name} (завертка)` });
    }
  }

  return entries;
}

function main() {
  if (!fs.existsSync(FILE_PATH)) {
    console.error('Файл не найден:', FILE_PATH);
    process.exit(1);
  }
  const workbook = XLSX.readFile(FILE_PATH, { raw: false });
  const entries = collectEntries(workbook);

  if (!fs.existsSync(OUT_DIR)) {
    console.log('Папка не найдена:', OUT_DIR);
    process.exit(0);
  }

  const missing: Entry[] = [];
  for (const e of entries) {
    const ext = getExtFromUrl(e.url);
    const subDir = safeDirName(e.sheet);
    const baseName = safeDirName(e.productKey) + '_' + e.photoType + (ext ? '.' + ext : '.jpg');
    const destPath = path.join(OUT_DIR, subDir, baseName);
    if (!fs.existsSync(destPath)) {
      missing.push(e);
    }
  }

  const bySheet: Record<string, Entry[]> = {};
  for (const e of missing) {
    if (!bySheet[e.sheet]) bySheet[e.sheet] = [];
    bySheet[e.sheet].push(e);
  }

  console.log('=== Товары без фото на диске ===\n');
  console.log('Всего записей (слотов) без файла:', missing.length, '\n');

  if (bySheet['Цвет']?.length) {
    const list = bySheet['Цвет'];
    const byProduct = new Map<string, string>();
    for (const e of list) {
      if (!byProduct.has(e.productKey)) byProduct.set(e.productKey, e.label.replace(/\s*\(галерея \d+\)\s*$/, '').trim());
    }
    console.log('--- Цвет: уникальных комбинаций (модель + покрытие + цвет) без фото:', byProduct.size, '; записей:', list.length, '---');
    for (const [, label] of byProduct) {
      console.log('  •', label);
    }
    console.log('');
  }

  if (bySheet['04 Ручки Завертки']?.length) {
    const list = bySheet['04 Ручки Завертки'];
    const byHandle = new Map<string, string>();
    for (const e of list) {
      const name = e.label.replace(/^\s*Ручка:\s*|\s*\(завертка\)\s*$/g, '').trim();
      if (!byHandle.has(e.productKey)) byHandle.set(e.productKey, name);
    }
    console.log('--- Ручки: уникальных ручек без фото:', byHandle.size, '; записей (основное фото или завертка):', list.length, '---');
    for (const [, name] of byHandle) {
      console.log('  •', name);
    }
  }
}

main();
