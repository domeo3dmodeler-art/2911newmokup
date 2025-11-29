/**
 * Утилиты для работы со строками и решения проблем с кодировкой
 */

/**
 * Нормализует строку для сравнения (убирает лишние пробелы, приводит к нижнему регистру)
 */
export function normalizeString(str: string): string {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Проверяет, совпадают ли две строки с учетом возможных проблем с кодировкой
 */
export function fuzzyMatch(str1: string, str2: string): boolean {
  // 1. Точное совпадение
  if (str1 === str2) return true;
  
  // 2. Нормализованное совпадение
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);
  if (norm1 === norm2) return true;
  
  // 3. Частичное совпадение (содержит)
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // 4. Совпадение по ключевым словам (минимум 2 символа для кириллицы)
  const keywords1 = norm1.split(/[\s_-]+/).filter(word => word.length >= 2);
  const keywords2 = norm2.split(/[\s_-]+/).filter(word => word.length >= 2);
  
  // Проверяем, есть ли совпадения по ключевым словам
  const hasCommonKeywords = keywords1.some(keyword => 
    keywords2.some(keyKeyword => 
      keyword.includes(keyKeyword) || keyKeyword.includes(keyword)
    )
  );
  
  // 5. Дополнительная проверка для кириллицы - ищем общие символы
  const commonChars = norm1.split('').filter(char => norm2.includes(char));
  if (commonChars.length >= Math.min(norm1.length, norm2.length) * 0.6) {
    return true;
  }
  
  return hasCommonKeywords;
}

/**
 * Находит значение свойства в объекте по имени с учетом возможных проблем с кодировкой
 */
export function findPropertyValue(propertyName: string, data: Record<string, unknown>): unknown {
  // 1. Пробуем точное совпадение
  if (data[propertyName] !== undefined) {
    return data[propertyName];
  }
  
  // 2. Пробуем найти по fuzzy match
  for (const key in data) {
    if (fuzzyMatch(key, propertyName)) {
      return data[key];
    }
  }
  
  return undefined;
}

/**
 * Извлекает уникальные значения свойства из массива товаров
 */
export async function extractUniquePropertyValues(
  products: Array<Record<string, unknown>>,
  propertyName: string
): Promise<Array<{ value: unknown; label: string }>> {
  const uniqueValues = new Set<unknown>();
  
  // Используем logger если доступен, иначе console.log
  const log = typeof window === 'undefined' ? (() => {
    try {
      const { logger } = require('./logging/logger');
      return (msg: string, data?: Record<string, unknown>) => logger.debug(msg, 'string-utils', data);
    } catch {
      return console.log;
    }
  })() : console.log;
  
  log(`Extracting values for property "${propertyName}" from ${products.length} products`, { propertyName, productsCount: products.length });
  
  // Обрабатываем товары батчами для оптимизации
  const batchSize = 100;
  let processedCount = 0;
  
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    
    for (let batchIndex = 0; batchIndex < batch.length; batchIndex++) {
      const product = batch[batchIndex];
      const globalIndex = i + batchIndex;
      
      if (product.properties_data) {
        try {
          const propsData = typeof product.properties_data === 'string' 
            ? JSON.parse(product.properties_data) 
            : product.properties_data;
          
          const propertyValue = findPropertyValue(propertyName, propsData);
          
          if (propertyValue !== undefined && propertyValue !== null && propertyValue !== '') {
            // Приводим к строке для корректного сравнения
            const valueStr = String(propertyValue).trim();
            if (valueStr) {
              uniqueValues.add(valueStr);
              
              // Логируем первые 5 и каждый 100-й товар для отладки
              if (globalIndex < 5 || globalIndex % 100 === 0) {
                log(`Product ${globalIndex}: property "${propertyName}" = "${valueStr}"`, { globalIndex, propertyName, value: valueStr });
              }
            }
          }
        } catch (error) {
          const logError = typeof window === 'undefined' ? (() => {
            try {
              const { logger } = require('./logging/logger');
              return (msg: string, data?: Record<string, unknown>) => logger.error(msg, 'string-utils', data);
            } catch {
              return console.error;
            }
          })() : console.error;
          logError(`Error parsing properties_data for product ${globalIndex}`, { error: error instanceof Error ? error.message : String(error), globalIndex, propertyName });
        }
      }
    }
    
    processedCount += batch.length;
    
    // Показываем прогресс каждые 500 товаров
    if (processedCount % 500 === 0 || processedCount === products.length) {
      log(`Processed ${processedCount}/${products.length} products, found ${uniqueValues.size} unique values so far`, { processedCount, total: products.length, uniqueValuesCount: uniqueValues.size });
    }
    
    // Даем браузеру время на обработку других задач
    if (i % (batchSize * 5) === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  log(`Found ${uniqueValues.size} unique values for "${propertyName}"`, { propertyName, uniqueValuesCount: uniqueValues.size, uniqueValues: Array.from(uniqueValues) });
  
  // Преобразуем Set в массив опций и сортируем для удобства
  return Array.from(uniqueValues)
    .sort((a, b) => String(a).localeCompare(String(b)))
    .map((value) => ({
      value: value,
      label: String(value)
    }));
}

