/**
 * Проверка API complete-data после отката к старым товарам (2204).
 * GET /api/catalog/doors/complete-data — без авторизации.
 *
 * Запуск: npx tsx scripts/verify-complete-data-after-rollback.ts [BASE_URL]
 */
const BASE_URL = process.argv[2] || process.env.BASE_URL || 'http://localhost:3000';
const url = `${BASE_URL}/api/catalog/doors/complete-data`;

async function main() {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    console.error('Ошибка:', res.status, await res.text());
    process.exit(1);
  }
  const raw = await res.json();
  const data = raw?.data ?? raw;
  const models = data?.models ?? [];
  const totalModels = data?.totalModels ?? models.length;
  const styles = data?.styles ?? [];

  let totalProducts = 0;
  for (const m of models) {
    const products = m.products ?? m.sizes ?? [];
    totalProducts += Array.isArray(products) ? products.length : 0;
  }
  // Если в ответе нет products (мы убрали из API), считаем по sizes
  if (totalProducts === 0 && models.length > 0) {
    for (const m of models) {
      const sizes = m.sizes ?? [];
      totalProducts += Array.isArray(sizes) ? sizes.length : 0;
    }
  }

  console.log('GET /api/catalog/doors/complete-data');
  console.log('Моделей:', totalModels);
  console.log('Стилей:', styles.length, styles.slice(0, 5).join(', '));
  console.log('Размеров по всем моделям (sizes):', totalProducts);
  if (models.length > 0) {
    const first = models[0];
    console.log('Пример модели:', first.modelKey || first.model, '— sizes:', (first.sizes ?? []).length, ', coatings:', (first.coatings ?? []).length);
  }
  console.log('OK — конфигуратор должен работать со старым набором товаров.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
