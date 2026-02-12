/**
 * Читает Excel final_filled 30.01.xlsx и выводит все записи с фото в JSON.
 * Используется перед загрузкой через MCP-браузер: ссылки открываются в браузере,
 * URL картинки забирается со страницы, затем скачивается и привязывается к БД.
 *
 * Запуск:
 *   npx tsx scripts/collect-photo-entries.ts [--file=PATH] [--out=photo-entries.json]
 *
 * Выводит: photo-entries.json (массив записей) и список уникальных URL для обхода.
 */
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const FILE_PATH_DEFAULT = path.join(__dirname, '..', '1002', 'final_filled 30.01.xlsx');
const OUT_DEFAULT = path.join(__dirname, 'photo-entries.json');

function getColumn(row: Record<string, unknown>, logicalName: string): string {
  const need = logicalName.replace(/\s+/g, ' ').trim();
  for (const k of Object.keys(row)) {
    if (k.replace(/\s+/g, ' ').trim() === need) return String(row[k] ?? '').trim();
  }
  return String(row[logicalName] ?? '').trim();
}

function slug(str: string): string {
  return String(str)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\wа-яё_-]/gi, '')
    .slice(0, 80) || 'item';
}

function safeDirName(str: string): string {
  return String(str).replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').slice(0, 120) || 'item';
}

function isHttpUrl(s: string): boolean {
  const t = s.trim();
  return t.startsWith('http://') || t.startsWith('https://');
}

export function isYandexDiskPageUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h.includes('yandex') && (h.includes('360') || h.includes('disk'));
  } catch {
    return false;
  }
}

export interface PhotoEntry {
  sheet: string;
  productKey: string;
  photoType: string;
  url: string;
  propertyValue?: string;
}

function collectPhotoEntries(workbook: XLSX.WorkBook): PhotoEntry[] {
  const entries: PhotoEntry[] = [];
  const toJson = (sheetName: string) => {
    const ws = workbook.Sheets[sheetName];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: false });
  };

  for (const row of toJson('Наличники')) {
    const name = getColumn(row, 'Наличник: Название');
    const photoUrl = String(row['Наличник: Фото (ссылка)'] ?? '').trim();
    if (!name || !photoUrl || !isHttpUrl(photoUrl)) continue;
    entries.push({ sheet: 'Наличники', productKey: `nal_${slug(name)}`, photoType: 'cover', url: photoUrl });
  }

  for (const row of toJson('Цвет')) {
    const modelName = getColumn(row, 'Название модели');
    const coatingType = String(row['Тип покрытия'] ?? '').trim();
    const colorName = String(row['Цвет/отделка'] ?? '').trim();
    const propertyValue = `${modelName}|${coatingType}|${colorName}`;
    const coverUrl = String(row['Ссылка на обложку'] ?? '').trim();
    if (coverUrl && isHttpUrl(coverUrl)) {
      entries.push({ sheet: 'Цвет', productKey: propertyValue, photoType: 'cover', url: coverUrl, propertyValue });
    }
    const galleryStr = String(row['Ссылки на галерею (через ;)'] ?? '').trim();
    const galleryUrls = galleryStr ? galleryStr.split(';').map((s: string) => s.trim()).filter(isHttpUrl) : [];
    galleryUrls.forEach((url, i) => {
      entries.push({ sheet: 'Цвет', productKey: propertyValue, photoType: `gallery_${i + 1}`, url, propertyValue });
    });
  }

  for (const row of toJson('04 Ручки Завертки')) {
    const name = String(row['Название (Domeo_наименование для Web)'] ?? '').trim();
    if (!name) continue;
    const key = `handle_${slug(name)}`;
    const photoUrl = String(row['Фото (ссылка)'] ?? '').trim();
    if (photoUrl && isHttpUrl(photoUrl)) entries.push({ sheet: '04 Ручки Завертки', productKey: key, photoType: 'main', url: photoUrl });
    const photoZav = String(row['Фото завертки (ссылка)'] ?? '').trim();
    if (photoZav && isHttpUrl(photoZav)) entries.push({ sheet: '04 Ручки Завертки', productKey: key, photoType: 'zaverтка', url: photoZav });
  }

  for (const row of toJson('05 Ограничители')) {
    const name = String(row['Название'] ?? '').trim();
    const photoUrl = String(row['Фото (путь)'] ?? '').trim();
    if (!name || !photoUrl || !isHttpUrl(photoUrl)) continue;
    entries.push({ sheet: '05 Ограничители', productKey: `lim_${slug(name)}`, photoType: 'cover', url: photoUrl });
  }

  return entries;
}

function main() {
  const fileArg = process.argv.find((a) => a.startsWith('--file='));
  const outArg = process.argv.find((a) => a.startsWith('--out='));
  const filePath = fileArg ? path.resolve(fileArg.slice('--file='.length).trim()) : FILE_PATH_DEFAULT;
  const outPath = outArg ? path.resolve(outArg.slice('--out='.length).trim()) : OUT_DEFAULT;

  if (!fs.existsSync(filePath)) {
    console.error('Файл не найден:', filePath);
    process.exit(1);
  }

  const workbook = XLSX.readFile(filePath, { cellDates: true, raw: false });
  const entries = collectPhotoEntries(workbook);

  const uniqueUrls = [...new Set(entries.map((e) => e.url))];
  const yandexUrls = uniqueUrls.filter(isYandexDiskPageUrl);

  // Для каждого URL — относительный путь сохранения (первая подходящая запись)
  const urlToRelPath: Record<string, string> = {};
  const seen = new Set<string>();
  for (const e of entries) {
    if (seen.has(e.url)) continue;
    seen.add(e.url);
    const subDir = safeDirName(e.sheet);
    const baseName = safeDirName(e.productKey) + '_' + e.photoType + '.jpg';
    urlToRelPath[e.url] = subDir + '/' + baseName;
  }

  const output = {
    entries,
    uniqueUrls,
    yandexUrls,
    urlToRelPath,
    summary: {
      totalEntries: entries.length,
      uniqueUrls: uniqueUrls.length,
      yandexPageUrls: yandexUrls.length,
    },
  };

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.log('Записано:', outPath);
  console.log('Записей с фото:', entries.length);
  console.log('Уникальных URL:', uniqueUrls.length);
  console.log('Из них страницы Яндекс.Диска (360):', yandexUrls.length);
}

main();
