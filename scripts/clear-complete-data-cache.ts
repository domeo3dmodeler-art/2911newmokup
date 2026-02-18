/**
 * Очистка кэша complete-data через GET /api/catalog/doors/complete-data/refresh.
 * Запускать при включённом приложении (npm run dev или next start).
 *
 * Запуск: npx tsx scripts/clear-complete-data-cache.ts [BASE_URL]
 * По умолчанию BASE_URL = http://localhost:3000
 */
const BASE_URL = process.argv[2] || process.env.BASE_URL || 'http://localhost:3000';
const url = `${BASE_URL}/api/catalog/doors/complete-data/refresh`;

async function main() {
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    console.error('Ошибка:', res.status, text);
    process.exit(1);
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  console.log('Кэш complete-data очищен:', data);
}

main().catch((e) => {
  console.error(e);
  console.error('Убедитесь, что приложение запущено (npm run dev или next start).');
  process.exit(1);
});
