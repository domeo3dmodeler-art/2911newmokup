/**
 * Единый слой отображения фото в конфигураторе дверей.
 * Источники данных: API complete-data (модели, покрытия), API hardware (ручки, наличники, ограничители).
 * Пути из API: /uploads/..., http(s)://...; локальные раздаются через /api/uploads/.
 */

/** Допустимые расширения для распознавания URL как картинки */
const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i;
const DIRECT_YANDEX = /downloader\.disk\.yandex|get\.disk\.yandex/i;
const CLOUD_PAGE = /360\.yandex\.ru|\/client\/disk\//i;

/**
 * Нормализует путь из API в валидный URL для запроса.
 * - Пустой / не строка → ''
 * - http(s) — отдаём как есть, кроме страниц облака (360.yandex.ru и т.п.) → ''
 * - Строка с пробелом и без расширения картинки → ''
 * - Путь, начинающийся с / → как есть (далее toDisplayUrl переведёт /uploads/ в /api/uploads/)
 */
export function resolveImagePath(path: string | null | undefined): string {
  if (path == null || typeof path !== 'string') return '';
  const t = path.trim();
  if (!t) return '';
  if (t.startsWith('http://') || t.startsWith('https://')) {
    if (t.includes(' ') && !IMAGE_EXT.test(t)) return '';
    // Cloud URLs can still point to an image file; block only non-image cloud pages.
    if (CLOUD_PAGE.test(t) && !DIRECT_YANDEX.test(t) && !IMAGE_EXT.test(t)) return '';
    return t;
  }
  if (t.includes(' ') && !IMAGE_EXT.test(t)) return '';
  if (t.startsWith('/')) return t;
  return `/${t.replace(/^\//, '')}`;
}

/**
 * Возвращает URL для подстановки в <img src>.
 * Пути /uploads/... отдаём через /api/uploads/... (раздача из public/uploads).
 */
export function toDisplayUrl(resolvedPath: string): string {
  if (!resolvedPath) return '';
  if (resolvedPath.startsWith('/uploads/')) return '/api/uploads/' + resolvedPath.slice(9);
  return resolvedPath;
}

/**
 * Один вызов: путь из API → URL для <img src>.
 */
export function getImageSrc(path: string | null | undefined): string {
  return toDisplayUrl(resolveImagePath(path));
}

/**
 * Плейсхолдер в виде data URL (SVG) при отсутствии фото.
 */
export function createPlaceholderSvgDataUrl(
  width: number,
  height: number,
  bgColor: string,
  textColor: string,
  text: string
): string {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${bgColor}"/>
    <text x="${width / 2}" y="${height / 2}" font-family="Arial,sans-serif" font-size="${Math.min(width, height) * 0.1}" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${escapeXml(text)}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * URL для отображения с запасным плейсхолдером.
 * Если path даёт пустой src — подставляется placeholder (обычно data URL от createPlaceholderSvgDataUrl).
 */
export function getImageSrcWithPlaceholder(
  path: string | null | undefined,
  placeholder: string
): string {
  const src = getImageSrc(path);
  return src || placeholder;
}

/** Базовый путь к mockup-фото ручек (если в каталоге нет фото) */
const HANDLE_MOCKUP_BASE = '/data/mockups/ruchki';

/**
 * URL фото ручки: приоритет — путь из API (ProductImage / properties), иначе mockup по имени.
 */
export function getHandleImageSrc(photoPath: string | undefined, handleName?: string): string {
  const fromApi = getImageSrc(photoPath);
  if (fromApi) return fromApi;
  if (handleName) {
    const name = handleName.trim().replace(/\s+/g, '_');
    if (name) return `${HANDLE_MOCKUP_BASE}/${name}.png`;
  }
  if (photoPath) {
    const fileName = photoPath.split('/').pop()?.replace(/\.[^/.]+$/, '');
    if (fileName) return `${HANDLE_MOCKUP_BASE}/${fileName.trim().replace(/\s+/g, '_')}.png`;
  }
  return '';
}
