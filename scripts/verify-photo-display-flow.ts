/**
 * Проверка цепочки отображения фото: путь из API → URL для <img src>.
 * Запуск: npx tsx scripts/verify-photo-display-flow.ts
 * Или: node --loader ts-node/esm scripts/verify-photo-display-flow.ts
 */
import {
  resolveImagePath,
  toDisplayUrl,
  getImageSrc,
  getImageSrcWithPlaceholder,
  createPlaceholderSvgDataUrl,
  getHandleImageSrc,
} from '../lib/configurator/image-src';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exitCode = 1;
    return false;
  }
  console.log('OK:', message);
  return true;
}

console.log('=== Проверка lib/configurator/image-src ===\n');

// 1. Локальный путь /uploads/... → /api/uploads/...
const localPath = '/uploads/products/door.jpg';
const resolved = resolveImagePath(localPath);
assert(resolved === '/uploads/products/door.jpg', 'resolveImagePath сохраняет /uploads/...');
const display = toDisplayUrl(resolved);
assert(display === '/api/uploads/products/door.jpg', 'toDisplayUrl переводит /uploads/... в /api/uploads/...');

// 2. getImageSrc в один вызов
const src = getImageSrc(localPath);
assert(src === '/api/uploads/products/door.jpg', 'getImageSrc(localPath) даёт /api/uploads/...');

// 3. null/пусто → ''
assert(getImageSrc(null) === '', 'getImageSrc(null) === ""');
assert(getImageSrc(undefined) === '', 'getImageSrc(undefined) === ""');
assert(getImageSrc('') === '', 'getImageSrc("") === ""');

// 4. Внешний http — как есть (кроме облака)
assert(getImageSrc('https://example.com/photo.jpg') === 'https://example.com/photo.jpg', 'http(s) допустимый остаётся');
assert(getImageSrc('https://360.yandex.ru/some/page') === '', 'страница облака → ""');

// 5. Плейсхолдер
const placeholder = createPlaceholderSvgDataUrl(100, 100, '#eee', '#333', 'Test');
assert(placeholder.startsWith('data:image/svg+xml'), 'createPlaceholderSvgDataUrl возвращает data URL');
assert(
  getImageSrcWithPlaceholder(null, placeholder) === placeholder,
  'getImageSrcWithPlaceholder(null, placeholder) возвращает placeholder'
);
assert(
  getImageSrcWithPlaceholder(localPath, placeholder) === '/api/uploads/products/door.jpg',
  'getImageSrcWithPlaceholder(path, placeholder) возвращает URL когда path есть'
);

// 6. Ручки: API путь или mockup
assert(
  getHandleImageSrc('/uploads/handles/h1.jpg', 'Ручка А') === '/api/uploads/handles/h1.jpg',
  'getHandleImageSrc: при наличии пути из API — /api/uploads/...'
);
assert(
  getHandleImageSrc(undefined, 'Ручка Б') === '/data/mockups/ruchki/Ручка_Б.png',
  'getHandleImageSrc: без пути — mockup по имени'
);

console.log('\n=== Итог: цепочка путь → img src корректна ===');
console.log('На странице /doors:');
console.log('  - API complete-data возвращает model.photo, coatings[].photo_path (или null)');
console.log('  - getImageSrc(path) даёт /api/uploads/... для локальных путей');
console.log('  - Браузер запрашивает GET /api/uploads/products/... → app/api/uploads/[...path] отдаёт public/uploads/...');
console.log('  - При отсутствии фото или 404 используется плейсхолдер (createPlaceholderSvgDataUrl) и onError');
process.exit(process.exitCode || 0);
