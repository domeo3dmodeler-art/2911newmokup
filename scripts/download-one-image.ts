/**
 * Скачивает одно изображение по URL в указанный файл.
 * Используется после извлечения URL картинки со страницы Яндекс.Диска в MCP-браузере.
 *
 * Запуск:
 *   npx tsx scripts/download-one-image.ts <imageUrl> <destPath>
 *
 * Код выхода: 0 — успех, 1 — ошибка или ответ не изображение.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function getExtFromContentType(ct: string): string {
  const m = ct.match(/image\/(jpeg|jpg|png|gif|webp|bmp)/i);
  if (m) return m[1].toLowerCase().replace('jpeg', 'jpg');
  return 'jpg';
}

function downloadToFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const u = new URL(url);
    const protocol = u.protocol === 'https:' ? https : http;
    const req = protocol.get(
      url,
      { headers: { 'User-Agent': USER_AGENT }, maxRedirects: 5 },
      (res) => {
        const code = res.statusCode || 0;
        if (code === 301 || code === 302) {
          const loc = res.headers.location;
          if (loc) return downloadToFile(loc, destPath).then(resolve);
        }
        const ct = (res.headers['content-type'] || '').toLowerCase();
        if (!ct.includes('image/')) {
          resolve(false);
          return;
        }
        const ext = getExtFromContentType(ct);
        let finalPath = destPath;
        if (!path.extname(destPath) || path.extname(destPath).toLowerCase() !== '.' + ext) {
          finalPath = destPath.replace(/\.[^.]+$/, '') + '.' + ext;
        }
        const dir = path.dirname(finalPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const file = fs.createWriteStream(finalPath);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
        file.on('error', () => {
          try { fs.unlinkSync(finalPath); } catch {}
          resolve(false);
        });
      }
    );
    req.on('error', () => resolve(false));
    req.setTimeout(20000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const imageUrl = process.argv[2];
  const destPath = process.argv[3];
  if (!imageUrl || !destPath) {
    console.error('Usage: npx tsx scripts/download-one-image.ts <imageUrl> <destPath>');
    process.exit(1);
  }
  const ok = await downloadToFile(imageUrl, destPath);
  process.exit(ok ? 0 : 1);
}

main();
