/**
 * Скачивание фото с Яндекс.Диска по ссылкам или по пути. Нужен OAuth-токен.
 *
 * Как получить токен: https://oauth.yandex.com → приложение → cloud_api: disk.read
 * Затем: https://oauth.yandex.ru/authorize?response_type=token&client_id=<ClientID>
 *
 * Режимы:
 * 1) Файл со ссылками (страницы просмотра disk.360.yandex.ru/...?idDialog=.../file.png)
 *    По каждой ссылке из idDialog извлекается путь к файлу, по API получается прямая ссылка и файл качается.
 *    YANDEX_DISK_TOKEN=... npx tsx scripts/download-yandex-disk-folder.ts --urls-file=links.txt
 *
 * 2) Одна ссылка на папку или путь на диске
 *    YANDEX_DISK_TOKEN=... npx tsx scripts/download-yandex-disk-folder.ts "https://disk.360.yandex.ru/...?idDialog=..."
 *    YANDEX_DISK_TOKEN=... npx tsx scripts/download-yandex-disk-folder.ts "ДВЕРИ. Вся инфа/Модели дверей/..."
 *
 * Опции: --dry-run  только список; --out-dir=DIR  папка сохранения
 */
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';

const API_BASE = 'https://cloud-api.yandex.net/v1/disk';
const OUT_DIR_DEFAULT = path.join(__dirname, '..', 'public', 'uploads', 'yandex-disk');

function getToken(): string {
  const t = process.env.YANDEX_DISK_TOKEN?.trim();
  if (!t) {
    console.error('Задайте переменную окружения YANDEX_DISK_TOKEN (OAuth-токен Яндекс.Диска).');
    process.exit(1);
  }
  return t;
}

/** Из ссылки вида disk.360.yandex.ru/...?idDialog=%2Fdisk%2F... извлекаем путь на диске (файл или папка) */
function parsePathFromPageUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const idDialog = u.searchParams.get('idDialog');
    if (idDialog) {
      const decoded = decodeURIComponent(idDialog);
      if (decoded.startsWith('/disk/')) return decoded.slice(6).replace(/^\//, '');
      return decoded.replace(/^\//, '');
    }
    const pathMatch = url.match(/\/client\/disk\/([^?]+)/);
    if (pathMatch) return decodeURIComponent(pathMatch[1].replace(/%2F/g, '/'));
  } catch {
    // не URL
  }
  return null;
}

const parseFolderPathFromPageUrl = parsePathFromPageUrl;

function apiRequest(token: string, method: string, pathname: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + pathname);
    const opts: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        Authorization: `OAuth ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
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

/** Список содержимого папки (limit 1000) */
async function listFolder(token: string, diskPath: string): Promise<{ path: string; name: string; type: string }[]> {
  const encoded = encodeURIComponent('disk:/' + diskPath.replace(/^\//, ''));
  const { status, body } = await apiRequest(token, 'GET', `/resources?path=${encoded}&limit=1000`);
  if (status !== 200) {
    throw new Error(`API listFolder ${status}: ${body}`);
  }
  const data = JSON.parse(body);
  const items = data._embedded?.items || [];
  return items.map((i: { path: string; name: string; type: string }) => ({
    path: i.path,
    name: i.name,
    type: i.type,
  }));
}

/** Получить URL для скачивания файла */
async function getDownloadLink(token: string, diskFilePath: string): Promise<string> {
  const encoded = encodeURIComponent(diskFilePath.startsWith('disk:') ? diskFilePath : 'disk:' + diskFilePath);
  const { status, body } = await apiRequest(token, 'GET', `/resources/download?path=${encoded}`);
  if (status !== 200) throw new Error(`API download link ${status}: ${body}`);
  const data = JSON.parse(body);
  if (!data.href) throw new Error('No href in response');
  return data.href;
}

/** Скачать файл по URL (с тем же токеном в заголовке не нужен — ссылка временная) */
function downloadToFile(downloadUrl: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const u = new URL(downloadUrl);
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

async function collectAllFiles(
  token: string,
  diskPath: string,
  acc: { path: string; name: string; type: string }[] = []
): Promise<{ path: string; name: string; type: string }[]> {
  const items = await listFolder(token, diskPath);
  for (const item of items) {
    const relPath = item.path.replace(/^disk:\//, '');
    if (item.type === 'dir') {
      await collectAllFiles(token, relPath, acc);
    } else {
      acc.push(item);
    }
  }
  return acc;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const dryRun = process.argv.includes('--dry-run');
  const outDirArg = process.argv.find((a) => a.startsWith('--out-dir='));
  const outDir = outDirArg ? outDirArg.slice('--out-dir='.length) : OUT_DIR_DEFAULT;
  const urlsFileArg = process.argv.find((a) => a.startsWith('--urls-file='));

  // Режим: файл со ссылками на просмотр (disk.360.yandex.ru/...?idDialog=.../file.png)
  if (urlsFileArg) {
    const filePath = urlsFileArg.slice('--urls-file='.length).trim();
    if (!fs.existsSync(filePath)) {
      console.error('Файл не найден:', filePath);
      process.exit(1);
    }
    const token = getToken();
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const imageExt = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i;
    const filePaths: string[] = [];
    const seen = new Set<string>();
    for (const line of lines) {
      const diskPath = parsePathFromPageUrl(line);
      if (!diskPath) continue;
      if (!imageExt.test(diskPath)) continue;
      const norm = diskPath.replace(/\\/g, '/');
      if (seen.has(norm)) continue;
      seen.add(norm);
      filePaths.push(diskPath);
    }
    console.log('Ссылок в файле:', lines.length, '→ путей к изображениям:', filePaths.length);
    if (filePaths.length === 0) {
      console.log('Нет подходящих ссылок (нужны URL с idDialog до файла с расширением .jpg/.png и т.д.).');
      return;
    }
    if (dryRun) {
      filePaths.forEach((p, i) => console.log(`${i + 1}. ${p}`));
      return;
    }
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const baseDir = path.join(outDir, 'from-urls-file');
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
    const results: { diskPath: string; localPath: string }[] = [];
    const usedNames = new Set<string>();
    for (let i = 0; i < filePaths.length; i++) {
      const diskPath = filePaths[i];
      let name = path.basename(diskPath.replace(/\//g, path.sep));
      name = sanitizeFileName(name) || `file_${i + 1}.png`;
      let fileName = name;
      let n = 1;
      while (usedNames.has(fileName)) {
        const ext = path.extname(name);
        const base = path.basename(name, ext);
        fileName = base + '_' + n + ext;
        n++;
      }
      usedNames.add(fileName);
      const localPath = path.join(baseDir, fileName);
      process.stdout.write(`[${i + 1}/${filePaths.length}] ${name} ... `);
      try {
        const apiPath = diskPath.startsWith('disk:') ? diskPath : 'disk:/' + diskPath.replace(/^\//, '');
        const href = await getDownloadLink(token, apiPath);
        await downloadToFile(href, localPath);
        const relativePath = path.relative(path.join(__dirname, '..', 'public'), localPath).replace(/\\/g, '/');
        results.push({ diskPath, localPath: '/' + relativePath });
        console.log('OK');
      } catch (e) {
        console.log('FAIL', e instanceof Error ? e.message : e);
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    const mappingPath = path.join(baseDir, '_mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(results, null, 2), 'utf8');
    console.log('\nСохранено в', baseDir);
    return;
  }

  if (args.length === 0) {
    console.log(`
Использование:
  Файл со ссылками (страницы просмотра disk.360.yandex.ru):
    YANDEX_DISK_TOKEN=... npx tsx scripts/download-yandex-disk-folder.ts --urls-file=links.txt

  Одна папка (ссылка или путь на диске):
    YANDEX_DISK_TOKEN=... npx tsx scripts/download-yandex-disk-folder.ts "https://disk.360.yandex.ru/...?idDialog=..."
    YANDEX_DISK_TOKEN=... npx tsx scripts/download-yandex-disk-folder.ts "ДВЕРИ. Вся инфа/Модели дверей/..."

Опции:
  --dry-run       только вывести список файлов, не скачивать
  --out-dir=DIR   папка для сохранения (по умолчанию public/uploads/yandex-disk)
`);
    process.exit(1);
  }

  const input = args[0];
  const token = getToken();

  let folderPath: string;
  const fromUrl = parseFolderPathFromPageUrl(input);
  if (fromUrl) {
    folderPath = fromUrl;
    console.log('Путь из ссылки:', folderPath);
  } else {
    folderPath = input;
    console.log('Путь к папке:', folderPath);
  }
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(folderPath)) {
    folderPath = path.dirname(folderPath).replace(/\\/g, '/');
    console.log('Указан файл, используем папку:', folderPath);
  }

  console.log('Получение списка файлов...');
  const files = await collectAllFiles(token, folderPath);
  const imageExt = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i;
  const images = files.filter((f) => imageExt.test(f.name));
  console.log(`Найдено файлов: ${files.length}, изображений: ${images.length}`);

  if (images.length === 0) {
    console.log('Нет изображений в папке.');
    return;
  }

  if (dryRun) {
    images.forEach((f, i) => console.log(`${i + 1}. ${f.path}`));
    return;
  }

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const baseDir = path.join(outDir, sanitizeFileName(folderPath.replace(/\//g, '_')));
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

  const results: { diskPath: string; localPath: string }[] = [];
  for (let i = 0; i < images.length; i++) {
    const file = images[i];
    const fileName = sanitizeFileName(file.name);
    const localPath = path.join(baseDir, fileName);
    process.stdout.write(`[${i + 1}/${images.length}] ${file.name} ... `);
    try {
      const href = await getDownloadLink(token, file.path);
      await downloadToFile(href, localPath);
      const relativePath = path.relative(path.join(__dirname, '..', 'public'), localPath).replace(/\\/g, '/');
      results.push({ diskPath: file.path, localPath: '/' + relativePath });
      console.log('OK');
    } catch (e) {
      console.log('FAIL', e instanceof Error ? e.message : e);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  const mappingPath = path.join(baseDir, '_mapping.json');
  fs.writeFileSync(mappingPath, JSON.stringify(results, null, 2), 'utf8');
  console.log('\nСохранено в', baseDir);
  console.log('Маппинг (disk path -> local path):', mappingPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
