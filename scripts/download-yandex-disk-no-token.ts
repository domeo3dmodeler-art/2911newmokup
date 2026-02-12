/**
 * Скачивание фото с Яндекс.Диска БЕЗ OAuth-токена.
 *
 * Вариант 1 — Публичная папка (без токена):
 *   Сделайте папку на Диске публичной (Поделиться → ссылка), скопируйте ссылку вида https://yadi.sk/d/XXXXX
 *   npx tsx scripts/download-yandex-disk-no-token.ts --public "https://yadi.sk/d/XXXXX"
 *
 * Вариант 2 — Файл со списком прямых ссылок (без токена):
 *   В браузере откройте папку на disk.360.yandex.ru, для каждого файла нажмите «Скачать»/«Прямая ссылка»
 *   и сохраните ссылки в текстовый файл (по одной на строку). Затем:
 *   npx tsx scripts/download-yandex-disk-no-token.ts --urls-file urls.txt
 *
 * Опции:
 *   --dry-run       только показать список, не качать
 *   --out-dir=DIR   папка сохранения (по умолчанию public/uploads/yandex-disk)
 */
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';

const API_PUBLIC = 'https://cloud-api.yandex.net/v1/disk/public';
const OUT_DIR_DEFAULT = path.join(__dirname, '..', 'public', 'uploads', 'yandex-disk');

function apiRequestPublic(method: string, pathname: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(API_PUBLIC + pathname);
    const opts: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    };
    const req = https.request(opts, (res) => {
      let body = '';
      res.on('data', (ch) => (body += ch));
      res.on('end', () => resolve({ status: res.statusCode || 0, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

/** Извлечь public_key из ссылки yadi.sk/d/XXX */
function publicKeyFromUrl(url: string): string {
  const m = url.match(/yadi\.sk\/d\/([^/?]+)/i) || url.match(/public_key=([^&]+)/);
  if (m) return m[1];
  return url.trim();
}

/** Список содержимого публичной папки (без токена) */
async function listPublicFolder(publicKey: string, relPath = ''): Promise<{ path: string; name: string; type: string }[]> {
  const q = `public_key=${encodeURIComponent(publicKey)}&limit=1000` + (relPath ? `&path=${encodeURIComponent(relPath)}` : '');
  const { status, body } = await apiRequestPublic('GET', `/resources?${q}`);
  if (status !== 200) throw new Error(`API ${status}: ${body}`);
  const data = JSON.parse(body);
  const items = data._embedded?.items || [];
  const result = items.map((i: { path: string; name: string; type: string }) => ({
    path: i.path,
    name: i.name,
    type: i.type,
  }));
  return result;
}

/** Рекурсивно собрать все файлы из публичной папки */
async function collectPublicFiles(
  publicKey: string,
  relPath: string,
  acc: { path: string; name: string; type: string }[] = []
): Promise<{ path: string; name: string; type: string }[]> {
  const items = await listPublicFolder(publicKey, relPath);
  for (const item of items) {
    if (item.type === 'dir') {
      await collectPublicFiles(publicKey, item.path, acc);
    } else {
      acc.push(item);
    }
  }
  return acc;
}

/** Получить ссылку на скачивание файла из публичной папки (без токена) */
async function getPublicDownloadLink(publicKey: string, filePath: string): Promise<string> {
  const q = `public_key=${encodeURIComponent(publicKey)}&path=${encodeURIComponent(filePath)}`;
  const { status, body } = await apiRequestPublic('GET', `/resources/download?${q}`);
  if (status !== 200) throw new Error(`Download link ${status}: ${body}`);
  const data = JSON.parse(body);
  if (!data.href) throw new Error('No href');
  return data.href;
}

function downloadToFile(downloadUrl: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(downloadUrl, { headers: { 'User-Agent': 'Node-Download/1.0' } }, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          const loc = res.headers.location;
          if (loc) return downloadToFile(loc, destPath).then(resolve).catch(reject);
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
  });
}

function sanitizeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, ' ').trim().slice(0, 200) || 'file';
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const outDirArg = process.argv.find((a) => a.startsWith('--out-dir='));
  const outDir = outDirArg ? outDirArg.slice('--out-dir='.length) : OUT_DIR_DEFAULT;

  const publicArg = process.argv.find((a) => a.startsWith('--public='));
  const urlsFileArg = process.argv.find((a) => a.startsWith('--urls-file='));

  if (urlsFileArg) {
    // Режим: файл со списком URL (каждая строка — прямая ссылка на файл)
    const filePath = urlsFileArg.slice('--urls-file='.length).trim();
    if (!fs.existsSync(filePath)) {
      console.error('Файл не найден:', filePath);
      process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const urls = content
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s && (s.startsWith('http://') || s.startsWith('https://')));
    console.log('Ссылок в файле:', urls.length);
    if (urls.length === 0) {
      console.log('Нет URL для скачивания.');
      return;
    }
    if (dryRun) {
      urls.forEach((u, i) => console.log(`${i + 1}. ${u.slice(0, 80)}...`));
      return;
    }
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const fileName = sanitizeFileName(new URL(url).searchParams.get('filename') || `file_${i + 1}.jpg`);
      const destPath = path.join(outDir, fileName);
      process.stdout.write(`[${i + 1}/${urls.length}] ${fileName} ... `);
      try {
        await downloadToFile(url, destPath);
        console.log('OK');
      } catch (e) {
        console.log('FAIL', e instanceof Error ? e.message : e);
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    console.log('Готово. Папка:', outDir);
    return;
  }

  if (publicArg) {
    // Режим: публичная папка (yadi.sk/d/XXX)
    const publicUrl = publicArg.slice('--public='.length).trim();
    const publicKey = publicKeyFromUrl(publicUrl);
    console.log('Публичная папка (без токена). Получение списка...');
    const files = await collectPublicFiles(publicKey, '');
    const imageExt = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i;
    const images = files.filter((f) => imageExt.test(f.name));
    console.log(`Файлов: ${files.length}, изображений: ${images.length}`);
    if (images.length === 0) {
      console.log('Нет изображений.');
      return;
    }
    if (dryRun) {
      images.forEach((f, i) => console.log(`${i + 1}. ${f.path} ${f.name}`));
      return;
    }
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const baseDir = path.join(outDir, 'public_' + publicKey.slice(0, 12).replace(/[^a-zA-Z0-9]/g, '_'));
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const fileName = sanitizeFileName(file.name);
      const destPath = path.join(baseDir, fileName);
      process.stdout.write(`[${i + 1}/${images.length}] ${file.name} ... `);
      try {
        const href = await getPublicDownloadLink(publicKey, file.path);
        await downloadToFile(href, destPath);
        console.log('OK');
      } catch (e) {
        console.log('FAIL', e instanceof Error ? e.message : e);
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    console.log('Готово. Папка:', baseDir);
    return;
  }

  console.log(`
Скачивание с Яндекс.Диска БЕЗ токена

Вариант 1 — Публичная папка:
  Сделайте папку на Диске публичной (Поделиться → скопировать ссылку вида https://yadi.sk/d/...)
  npx tsx scripts/download-yandex-disk-no-token.ts --public="https://yadi.sk/d/XXXXX"

Вариант 2 — Файл со списком прямых ссылок:
  Сохраните в .txt по одной ссылке на строку (прямые ссылки на файлы, например с downloader.disk.yandex.ru)
  npx tsx scripts/download-yandex-disk-no-token.ts --urls-file=urls.txt

Опции:
  --dry-run         только показать список
  --out-dir=DIR     папка сохранения (по умолчанию public/uploads/yandex-disk)

Если папка приватная (ссылка disk.360.yandex.ru/...) — без токена нельзя.
Либо сделайте папку публичной, либо используйте скрипт с токеном:
  YANDEX_DISK_TOKEN=... npx tsx scripts/download-yandex-disk-folder.ts "<ссылка или путь>"
`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
