/**
 * Скачивание фото с Яндекс.Диска через браузер (без токена, без публичной ссылки).
 * Открывает disk.360.yandex.ru в вашем браузере — использует вашу сессию (вы должны быть залогинены).
 *
 * Запуск:
 *   npx tsx scripts/download-yandex-disk-browser.ts "https://disk.360.yandex.ru/..."
 *
 * Опции:
 *   --out-dir=DIR   папка сохранения (по умолчанию public/uploads/yandex-disk)
 *   --dry-run       только показать найденные URL, не качать
 *   --wait-login    пауза 60 сек после открытия страницы (успеете войти в аккаунт)
 *   --headed        показать окно браузера (по умолчанию true)
 *   --headless      запустить без окна
 */
import * as path from 'path';
import * as fs from 'fs';

const OUT_DIR_DEFAULT = path.join(__dirname, '..', 'public', 'uploads', 'yandex-disk');

function parseArgs(): {
  url: string;
  outDir: string;
  dryRun: boolean;
  waitLogin: boolean;
  headed: boolean;
} {
  const args = process.argv.slice(2);
  let url = '';
  let outDir = OUT_DIR_DEFAULT;
  let dryRun = false;
  let waitLogin = false;
  let headed = true;

  for (const a of args) {
    if (a === '--dry-run') dryRun = true;
    else if (a === '--wait-login') waitLogin = true;
    else if (a === '--headed') headed = true;
    else if (a === '--headless') headed = false;
    else if (a.startsWith('--out-dir=')) outDir = a.slice('--out-dir='.length).trim();
    else if (!a.startsWith('--') && a.startsWith('http')) url = a;
  }

  if (!url) {
    console.error('Укажите URL страницы Яндекс.Диска (disk.360.yandex.ru или yadi.sk).');
    process.exit(1);
  }
  return { url, outDir, dryRun, waitLogin, headed };
}

/** Скачать по URL с cookie/заголовками из браузера не делаем — делаем простой GET; для 360 нужен браузерный контекст */
async function downloadWithPuppeteer(
  page: { goto: (url: string, opts?: { waitUntil: string }) => Promise<unknown>; evaluate: <T>(fn: () => T) => Promise<T> },
  imageUrl: string,
  filePath: string
): Promise<void> {
  const response = await page.goto(imageUrl, { waitUntil: 'networkidle0' }) as { buffer: () => Promise<Buffer> } | null;
  if (!response) throw new Error(`Не удалось загрузить: ${imageUrl}`);
  const buf = await response.buffer();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buf);
}

function safeFileName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').slice(0, 200);
}

async function main(): Promise<void> {
  const { url, outDir, dryRun, waitLogin, headed } = parseArgs();

  // динамический импорт, чтобы при отсутствии puppeteer вывести понятную ошибку
  let puppeteer: typeof import('puppeteer');
  try {
    puppeteer = await import('puppeteer');
  } catch {
    console.error('Установите puppeteer: npm i puppeteer');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: !headed,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('Открываю:', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    if (waitLogin) {
      console.log('Ожидание 60 сек — войдите в аккаунт при необходимости...');
      await new Promise((r) => setTimeout(r, 60000));
    }

    // Собираем URL картинок: превью и полноразмерные (типичные домены Яндекса)
    const imageUrls = await page.evaluate(() => {
      const out: string[] = [];
      const seen = new Set<string>();

      document.querySelectorAll<HTMLImageElement>('img[src]').forEach((img) => {
        let src = img.src || '';
        if (!src || src.startsWith('data:')) return;
        // убираем параметры размера превью, чтобы по возможности получить большой вариант
        try {
          const u = new URL(src);
          if (
            u.hostname.includes('yandex') ||
            u.hostname.includes('avatars') ||
            u.hostname.includes('storage.yandex')
          ) {
            u.searchParams.delete('size');
            u.searchParams.delete('width');
            u.searchParams.delete('height');
            const s = u.toString();
            if (!seen.has(s)) {
              seen.add(s);
              out.push(s);
            }
          }
        } catch {
          // ignore
        }
      });

      // ссылки на скачивание / прямые файлы
      document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
        const href = a.href || '';
        if (!href) return;
        try {
          const u = new URL(href);
          const isYandex = u.hostname.includes('yandex') || u.hostname.includes('yadi.sk');
          const looksLikeFile = /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(u.pathname + u.search);
          if (isYandex && (looksLikeFile || u.pathname.includes('download'))) {
            if (!seen.has(href)) {
              seen.add(href);
              out.push(href);
            }
          }
        } catch {
          // ignore
        }
      });

      return out;
    });

    console.log('Найдено URL:', imageUrls.length);
    if (imageUrls.length === 0) {
      console.log('Подсказка: откройте папку с файлами или один файл в просмотре. Возможно, нужна авторизация (--wait-login).');
    }

    if (dryRun) {
      imageUrls.forEach((u, i) => console.log(`${i + 1}. ${u}`));
      return;
    }

    fs.mkdirSync(outDir, { recursive: true });
    let saved = 0;
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
      const base = safeFileName(`img_${i + 1}${ext}`);
      const filePath = path.join(outDir, base);
      try {
        await downloadWithPuppeteer(page, imageUrl, filePath);
        console.log('Сохранено:', filePath);
        saved++;
      } catch (e) {
        console.warn('Пропуск:', imageUrl, (e as Error).message);
      }
    }
    console.log('Готово. Сохранено файлов:', saved, 'в', outDir);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
