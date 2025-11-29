// Скрипт для переименования свойства "Нанотекс" на "ПВХ" в категории "Двери"
// Выполняет запрос через API

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api/admin/products/rename-property';
const CATEGORY_ID = 'cmg50xcgs001cv7mn0tdyk1wo'; // Межкомнатные двери
const PROPERTY_NAME = 'Тип покрытия';
const OLD_VALUE = 'Нанотекс';
const NEW_VALUE = 'ПВХ';

async function renameProperty() {
  try {
    console.log('🔄 Переименование свойства товара...');
    console.log(`  Категория: ${CATEGORY_ID}`);
    console.log(`  Свойство: "${PROPERTY_NAME}"`);
    console.log(`  Старое значение: "${OLD_VALUE}"`);
    console.log(`  Новое значение: "${NEW_VALUE}"`);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        categoryId: CATEGORY_ID,
        propertyName: PROPERTY_NAME,
        oldValue: OLD_VALUE,
        newValue: NEW_VALUE
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Успешно выполнено!');
      console.log(`  Всего товаров: ${result.stats.totalProducts}`);
      console.log(`  Обновлено: ${result.stats.updated}`);
      console.log(`  Ошибок: ${result.stats.errors}`);
    } else {
      console.error('❌ Ошибка:', result.error || result.message);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Ошибка выполнения:', error.message);
    process.exit(1);
  }
}

renameProperty();

