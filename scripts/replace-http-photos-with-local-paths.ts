/**
 * Заменяет все http(s) ссылки в PropertyPhoto.photoPath и ProductImage.url
 * на локальные пути.
 *
 * Режим 1: --entries-json=PATH (рекомендуется)
 *   Загружает записи из JSON (как в download-and-bind), по ним и файлам в --out-dir
 *   строит соответствие URL → локальный путь и обновляет БД. Подходит для ссылок 360.
 *
 * Режим 2: без --entries-json
 *   Сканирует public/uploads, подбирает файлы по имени из URL (работает только для
 *   прямых ссылок на файл, не для страниц 360).
 *
 * Запуск:
 *   npx tsx scripts/replace-http-photos-with-local-paths.ts --entries-json=scripts/photo-entries.json [--dry-run]
 *   npx tsx scripts/replace-http-photos-with-local-paths.ts [--dry-run]
 */
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

const UPLOADS_ROOT = path.join(__dirname, '..', 'public', 'uploads');
const OUT_DIR_DEFAULT = path.join(__dirname, '..', 'public', 'uploads', 'final-filled');

interface PhotoEntry {
  sheet: string;
  productKey: string;
  photoType: string;
  url: string;
  propertyValue?: string;
}

function safeDirName(str: string): string {
  return String(str).replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').slice(0, 120) || 'item';
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

/** Собирает все файлы в папке рекурсивно. Возвращает пути относительно public (uploads/...) */
function collectFilesUnder(dir: string, relativePrefix: string): string[] {
  const result: string[] = [];
  if (!fs.existsSync(dir)) return result;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const rel = relativePrefix ? `${relativePrefix}/${e.name}` : e.name;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      result.push(...collectFilesUnder(full, rel));
    } else if (e.isFile()) {
      result.push(rel);
    }
  }
  return result;
}

/** Путь для API: /uploads/... */
function toWebPath(relativePath: string): string {
  const normalized = path.posix.join(...relativePath.split(path.sep));
  return normalized.startsWith('uploads/') ? `/${normalized}` : `/uploads/${normalized}`;
}

/** Из URL извлекает имя файла (последний сегмент pathname или idDialog) */
function filenameFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let p = u.pathname;
    const idDialog = u.searchParams.get('idDialog');
    if (idDialog) p = decodeURIComponent(idDialog);
    const decoded = decodeURIComponent(p);
    const segments = decoded.split('/').filter(Boolean);
    const name = segments.pop() || '';
    return name || null;
  } catch {
    return null;
  }
}

function searchNames(filename: string): string[] {
  const names = [filename];
  if (!filename.includes('.')) {
    names.push(filename + '.png', filename + '.jpg', filename + '.webp');
  }
  return names;
}

/** Строит urlToLocalPath по записям из JSON и файлам в outDir (логика как в download-and-bind) */
function buildUrlToLocalPathFromEntries(entries: PhotoEntry[], outDir: string): Map<string, string> {
  const urlToLocalPath = new Map<string, string>();
  for (const e of entries) {
    const ext = getExtFromUrl(e.url);
    const subDir = safeDirName(e.sheet);
    const baseName = safeDirName(e.productKey) + '_' + e.photoType + (ext ? '.' + ext : '.jpg');
    const relPath = path.join(subDir, baseName);
    const destPath = path.join(outDir, relPath);
    if (fs.existsSync(destPath)) {
      urlToLocalPath.set(e.url, '/uploads/final-filled/' + relPath.replace(/\\/g, '/'));
    }
  }
  return urlToLocalPath;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const entriesJsonArg = process.argv.find((a) => a.startsWith('--entries-json='));
  const outDirArg = process.argv.find((a) => a.startsWith('--out-dir='));
  const outDir = outDirArg ? path.resolve(outDirArg.slice('--out-dir='.length).trim()) : OUT_DIR_DEFAULT;

  let urlToLocalPath = new Map<string, string>();

  type ResolveFn = (url: string, preferSubdir?: string) => string | null;
  let resolveByUrl: (url: string, prefer?: string) => string | null = (url) => urlToLocalPath.get(url) ?? null;

  if (entriesJsonArg) {
    const jsonPath = path.resolve(entriesJsonArg.slice('--entries-json='.length).trim());
    if (!fs.existsSync(jsonPath)) {
      console.error('Файл не найден:', jsonPath);
      process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const entries: PhotoEntry[] = Array.isArray(data.entries) ? data.entries : data;
    console.log('Записей из JSON:', entries.length);
    if (!fs.existsSync(outDir)) {
      console.error('Папка не найдена:', outDir);
      process.exit(1);
    }
    urlToLocalPath = buildUrlToLocalPathFromEntries(entries, outDir);
    console.log('URL → локальный путь (файл есть на диске):', urlToLocalPath.size);
  } else {
    if (!fs.existsSync(UPLOADS_ROOT)) {
      console.error('Папка public/uploads не найдена.');
      process.exit(1);
    }
    const relativeFiles = collectFilesUnder(UPLOADS_ROOT, 'uploads');
    console.log('Файлов в public/uploads:', relativeFiles.length);
    const byBasename = new Map<string, string[]>();
    for (const rel of relativeFiles) {
      const base = path.basename(rel);
      const webPath = toWebPath(rel);
      const list = byBasename.get(base) || [];
      list.push(webPath);
      byBasename.set(base, list);
    }
    const resolveLocalPath: ResolveFn = (url: string, preferSubdir?: string) => {
      const filename = filenameFromUrl(url);
      if (!filename) return null;
      for (const name of searchNames(filename)) {
        const paths = byBasename.get(name);
        if (!paths || paths.length === 0) continue;
        if (paths.length === 1) return paths[0];
        if (preferSubdir) {
          const found = paths.find((p) => p.includes(preferSubdir));
          if (found) return found;
        }
        return paths[0];
      }
      return null;
    };
    resolveByUrl = (url, prefer) => resolveLocalPath(url, prefer ?? undefined);
  }

  const propertyPhotos = await prisma.propertyPhoto.findMany({
    where: { photoPath: { startsWith: 'http' } },
    select: { id: true, photoPath: true, propertyName: true },
  });
  const productImages = await prisma.productImage.findMany({
    where: { url: { startsWith: 'http' } },
    select: { id: true, url: true },
  });

  console.log('PropertyPhoto с http:', propertyPhotos.length);
  console.log('ProductImage с http:', productImages.length);

  let updatedPp = 0;
  let updatedPi = 0;
  const notFoundPp: string[] = [];
  const notFoundPi: string[] = [];

  const preferByProperty: Record<string, string> = {
    'Domeo_Модель_Цвет': 'Цвет',
    'Артикул поставщика': 'Цвет',
    'Domeo_Название модели для Web': 'Цвет',
  };

  for (const ph of propertyPhotos) {
    const local = resolveByUrl(ph.photoPath, preferByProperty[ph.propertyName]);
    if (local) {
      if (!dryRun) {
        await prisma.propertyPhoto.update({
          where: { id: ph.id },
          data: { photoPath: local },
        });
      }
      updatedPp++;
    } else {
      notFoundPp.push(ph.photoPath.slice(0, 80) + (ph.photoPath.length > 80 ? '...' : ''));
    }
  }

  for (const img of productImages) {
    const local = resolveByUrl(img.url);
    if (local) {
      if (!dryRun) {
        await prisma.productImage.update({
          where: { id: img.id },
          data: { url: local },
        });
      }
      updatedPi++;
    } else {
      notFoundPi.push(img.url.slice(0, 80) + (img.url.length > 80 ? '...' : ''));
    }
  }

  console.log('');
  console.log('Обновлено PropertyPhoto:', updatedPp);
  console.log('Обновлено ProductImage:', updatedPi);
  if (notFoundPp.length) {
    console.log('PropertyPhoto без совпадения:', notFoundPp.length);
    notFoundPp.slice(0, 5).forEach((u) => console.log('  ', u));
  }
  if (notFoundPi.length) {
    console.log('ProductImage без совпадения:', notFoundPi.length);
    notFoundPi.slice(0, 5).forEach((u) => console.log('  ', u));
  }
  if (dryRun) console.log('\n(dry-run — БД не изменялась)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
