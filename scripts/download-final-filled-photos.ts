/**
 * Скачивание всех фото из final_filled 30.01.xlsx (и из БД) в public/uploads/products.
 * Обновляет ProductImage.url и PropertyPhoto.photoPath на локальные пути.
 *
 * Для ссылок Яндекс.Диск / 360 пробует получить прямую ссылку через Cloud API.
 *
 * Запуск: npx tsx scripts/download-final-filled-photos.ts [--dry-run] [--from-db-only]
 *   --dry-run       только показать URL и пути, не качать и не обновлять БД
 *   --from-db-only   не читать Excel, только пройти по ProductImage/PropertyPhoto с http(s) URL
 */
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as https from 'https';
import * as http from 'http';

const prisma = new PrismaClient();

const FILE_PATH = path.join(__dirname, '..', '1002', 'final_filled 30.01.xlsx');
const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads', 'products', 'final_filled');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const DELAY_MS = 400;
const MAX_RETRIES = 2;

function collectUrlsFromExcel(): string[] {
  const urls: string[] = [];
  if (!fs.existsSync(FILE_PATH)) return urls;

  const workbook = XLSX.readFile(FILE_PATH, { cellDates: true, raw: false });
  const toJson = (sheetName: string): Record<string, unknown>[] => {
    const ws = workbook.Sheets[sheetName];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: false });
  };

  const add = (v: unknown) => {
    const s = typeof v === 'string' ? v.trim() : '';
    if (s.startsWith('http://') || s.startsWith('https://')) urls.push(s);
  };

  for (const row of toJson('Наличники')) {
    add(row['Наличник: Фото (ссылка)']);
  }
  for (const row of toJson('Цвет')) {
    add(row['Ссылка на обложку']);
    const gallery = String(row['Ссылки на галерею (через ;)'] ?? '');
    gallery.split(';').forEach((s: string) => add(s.trim()));
  }
  for (const row of toJson('04 Ручки Завертки')) {
    add(row['Фото (ссылка)']);
    add(row['Фото завертки (ссылка)']);
  }
  for (const row of toJson('05 Ограничители')) {
    add(row['Фото (путь)']);
  }

  return [...new Set(urls)].filter(Boolean);
}

function getExtensionFromContentType(ct: string): string {
  const m: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  };
  const base = (ct || '').split(';')[0].trim().toLowerCase();
  return m[base] || 'jpg';
}

function getExtensionFromUrl(url: string): string {
  try {
    const p = new URL(url).pathname.toLowerCase();
    if (p.endsWith('.png')) return 'png';
    if (p.endsWith('.gif')) return 'gif';
    if (p.endsWith('.webp')) return 'webp';
  } catch {
    // ignore
  }
  return 'jpg';
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Получить прямую ссылку на скачивание для Яндекс.Диск / 360 */
async function getYandexDirectUrl(shareUrl: string): Promise<string | null> {
  const apiUrl = `https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=${encodeURIComponent(shareUrl)}`;
  return new Promise((resolve) => {
    const req = https.get(
      apiUrl,
      {
        timeout: 15000,
        headers: { 'Accept': 'application/json', 'User-Agent': USER_AGENT },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            if (json.href && typeof json.href === 'string') resolve(json.href);
            else resolve(null);
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on('error', () => resolve(null));
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
  });
}

function isYandexDiskUrl(url: string): boolean {
  return /disk\.360\.yandex\.ru|disk\.yandex\.(ru|com)|yadi\.sk/i.test(url);
}

function downloadUrl(
  url: string,
  options?: { followRedirect?: boolean }
): Promise<{ buffer: Buffer; contentType: string; finalUrl: string }> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(
      url,
      {
        timeout: 20000,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'image/*,*/*',
        },
        ...(options?.followRedirect !== false ? {} : {}),
      },
      (res) => {
        const loc = res.headers.location;
        if (loc && [301, 302, 307, 308].includes(res.statusCode || 0)) {
          downloadUrl(loc.startsWith('http') ? loc : new URL(loc, url).href, options)
            .then(resolve)
            .catch(reject);
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const contentType = res.headers['content-type'] || '';
          resolve({ buffer, contentType, finalUrl: url });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

/** Минимальный размер в байтах — меньше считаем заглушкой (иконка «Я» и т.п.) */
const MIN_REAL_IMAGE_BYTES = 100 * 1024;
/** PNG с обеими сторонами меньше этого — считаем иконкой/заглушкой */
const MIN_IMAGE_DIMENSION = 300;

function isImageResponse(buffer: Buffer, contentType: string): boolean {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('image/')) return true;
  if (buffer.length < 12) return false;
  const magic = buffer.slice(0, 12);
  if (magic[0] === 0xff && magic[1] === 0xd8) return true;
  if (magic.toString('ascii', 0, 8) === '\x89PNG\r\n\x1a\n') return true;
  if (magic[0] === 0x47 && magic[1] === 0x49 && magic[2] === 0x46) return true;
  if (buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') return true;
  return false;
}

/** Размеры PNG из IHDR (width 4 bytes @ 16, height 4 bytes @ 20, big-endian) */
function getPngDimensions(buffer: Buffer): { w: number; h: number } | null {
  if (buffer.length < 24 || buffer.toString('ascii', 0, 8) !== '\x89PNG\r\n\x1a\n') return null;
  const w = buffer.readUInt32BE(16);
  const h = buffer.readUInt32BE(20);
  return { w, h };
}

/** Заглушка Яндекса (иконка «Я» на оранжевом): маленький размер или мелкий PNG. */
function isYandexPlaceholder(buffer: Buffer): boolean {
  if (buffer.length < MIN_REAL_IMAGE_BYTES) return true;
  const dim = getPngDimensions(buffer);
  if (dim && (dim.w < MIN_IMAGE_DIMENSION || dim.h < MIN_IMAGE_DIMENSION)) return true;
  return false;
}

/** Из HTML страницы попытаться вытащить URL картинки (data-src, src с .jpg/.png и т.д.) */
function extractImageUrlFromHtml(html: Buffer): string | null {
  const s = html.toString('utf8');
  const m = s.match(/"(https?:\/\/[^"]+\.(?:jpe?g|png|gif|webp)[^"]*)"/i)
    || s.match(/"(https?:\/\/[^"]*\/[^"]*\.(?:jpe?g|png|gif|webp)(?:\?[^"]*)?)"/i)
    || s.match(/data-src="(https?:\/\/[^"]+)"/i)
    || s.match(/src="(https?:\/\/[^"]+\.(?:jpe?g|png|gif|webp)[^"]*)"/i);
  return m ? m[1] : null;
}

function safeFilename(url: string, ext: string): string {
  const hash = crypto.createHash('sha256').update(url).digest('hex').slice(0, 16);
  return `${hash}.${ext}`;
}

async function fetchImageUrl(url: string): Promise<string> {
  if (isYandexDiskUrl(url)) {
    const direct = await getYandexDirectUrl(url);
    if (direct) return direct;
  }
  return url;
}

async function downloadOne(
  url: string,
  urlToLocalPath: Map<string, string>,
  failed: string[]
): Promise<number> {
  const ext = getExtensionFromUrl(url);
  const filename = safeFilename(url, ext);
  const fullPath = path.join(UPLOAD_DIR, filename);
  const localPath = `/uploads/products/final_filled/${filename}`;

  if (urlToLocalPath.has(url)) return 0;
  if (fs.existsSync(fullPath)) {
    try {
      const existing = fs.readFileSync(fullPath);
      if (isYandexPlaceholder(existing)) {
        fs.unlinkSync(fullPath);
        console.warn(`[del] удалена заглушка: ${filename}`);
      } else {
        urlToLocalPath.set(url, localPath);
      }
    } catch {
      urlToLocalPath.set(url, localPath);
    }
    return 0;
  }

  let effectiveUrl = url;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) await sleep(DELAY_MS * attempt);
      effectiveUrl = await fetchImageUrl(url);
      const { buffer, contentType } = await downloadUrl(effectiveUrl);

      if (isImageResponse(buffer, contentType)) {
        if (isYandexPlaceholder(buffer)) {
          console.warn(`[skip] заглушка (${(buffer.length / 1024).toFixed(1)} KB): ${url.slice(0, 80)}...`);
          continue;
        }
        const finalExt = getExtensionFromContentType(contentType);
        const finalFilename = safeFilename(url, finalExt);
        const finalPath = path.join(UPLOAD_DIR, finalFilename);
        const finalLocal = `/uploads/products/final_filled/${finalFilename}`;
        fs.writeFileSync(finalPath, buffer);
        urlToLocalPath.set(url, finalLocal);
        return 1;
      }

      const htmlStr = buffer.toString('utf8', 0, 2048);
      if (htmlStr.includes('<!DOCTYPE') || htmlStr.includes('<html')) {
        const imgUrl = extractImageUrlFromHtml(buffer);
        if (imgUrl) {
          const { buffer: imgBuffer, contentType: imgCt } = await downloadUrl(imgUrl);
          if (isImageResponse(imgBuffer, imgCt) && !isYandexPlaceholder(imgBuffer)) {
            const finalExt = getExtensionFromContentType(imgCt);
            const finalFilename = safeFilename(url, finalExt);
            const finalPath = path.join(UPLOAD_DIR, finalFilename);
            const finalLocal = `/uploads/products/final_filled/${finalFilename}`;
            fs.writeFileSync(finalPath, imgBuffer);
            urlToLocalPath.set(url, finalLocal);
            return 1;
          }
        }
      }
    } catch {
      // retry
    }
  }
  failed.push(url);
  return 0;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const fromDbOnly = process.argv.includes('--from-db-only');

  const urlsToProcess = new Set<string>();

  if (!fromDbOnly) {
    const fromExcel = collectUrlsFromExcel();
    fromExcel.forEach((u) => urlsToProcess.add(u));
    console.log('URL из Excel:', fromExcel.length);
  }

  const productImages = await prisma.productImage.findMany({
    where: { url: { startsWith: 'http' } },
    select: { id: true, url: true },
  });
  const propertyPhotos = await prisma.propertyPhoto.findMany({
    where: { photoPath: { startsWith: 'http' } },
    select: { id: true, photoPath: true },
  });

  productImages.forEach((i) => urlsToProcess.add(i.url));
  propertyPhotos.forEach((p) => urlsToProcess.add(p.photoPath));
  console.log('URL из БД (ProductImage с http):', productImages.length);
  console.log('URL из БД (PropertyPhoto с http):', propertyPhotos.length);
  console.log('Уникальных URL всего:', urlsToProcess.size);

  if (!fs.existsSync(UPLOAD_DIR) && !dryRun) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }

  // Удаляем уже сохранённые заглушки (маленькие файлы или мелкие PNG)
  if (!dryRun && fs.existsSync(UPLOAD_DIR)) {
    const files = fs.readdirSync(UPLOAD_DIR);
    let removed = 0;
    for (const f of files) {
      const full = path.join(UPLOAD_DIR, f);
      try {
        const buf = fs.readFileSync(full);
        if (isYandexPlaceholder(buf)) {
          fs.unlinkSync(full);
          removed++;
        }
      } catch {
        /* ignore */
      }
    }
    if (removed) console.log('Удалено заглушек в папке:', removed);
  }

  const urlToLocalPath = new Map<string, string>();
  const failed: string[] = [];
  let downloaded = 0;
  const urls = Array.from(urlsToProcess);

  if (dryRun) {
    urls.forEach((url) => console.log('Would download:', url.slice(0, 90) + (url.length > 90 ? '...' : '')));
    console.log('Done (dry-run).');
    return;
  }

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    downloaded += await downloadOne(url, urlToLocalPath, failed);
    if ((i + 1) % 20 === 0) console.log(`Обработано ${i + 1}/${urls.length}, скачано: ${downloaded}`);
    await sleep(DELAY_MS);
  }

  console.log('Скачано:', downloaded);
  if (failed.length) console.log('Не удалось скачать:', failed.length);

  if (urlToLocalPath.size === 0) {
    console.log('Нет новых файлов для обновления в БД.');
    return;
  }

  let updatedPi = 0;
  let updatedPp = 0;
  for (const img of productImages) {
    const local = urlToLocalPath.get(img.url);
    if (!local) continue;
    await prisma.productImage.update({
      where: { id: img.id },
      data: { url: local },
    });
    updatedPi++;
  }
  for (const ph of propertyPhotos) {
    const local = urlToLocalPath.get(ph.photoPath);
    if (!local) continue;
    await prisma.propertyPhoto.update({
      where: { id: ph.id },
      data: { photoPath: local },
    });
    updatedPp++;
  }
  console.log('Обновлено в БД: ProductImage:', updatedPi, ', PropertyPhoto:', updatedPp);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
