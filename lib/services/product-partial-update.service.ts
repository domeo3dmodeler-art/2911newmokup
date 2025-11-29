import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';
import { 
  CANONICAL_PROPERTIES, 
  normalizeProperties, 
  normalizePropertyName,
  PartialUpdateOptions,
  UPDATE_MODES,
  CanonicalPropertyValue 
} from './canonical-properties';

export interface ProductUpdateResult {
  success: boolean;
  updated: number;
  errors: string[];
  warnings: string[];
  details: {
    productId: string;
    sku: string;
    updatedProperties: string[];
    skippedProperties: string[];
  }[];
}

export class ProductPartialUpdateService {
  
  /**
   * Частичное обновление товаров из Excel файла
   * @param fileBuffer - Buffer Excel файла
   * @param options - Опции обновления
   */
  async updateFromExcel(
    fileBuffer: Buffer,
    options: PartialUpdateOptions = {
      updateMode: UPDATE_MODES.MERGE,
      skipEmptyValues: true,
      validateBeforeUpdate: true
    }
  ): Promise<ProductUpdateResult> {
    try {
      const XLSX = require('xlsx');
      
      // Читаем Excel файл
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        return {
          success: false,
          updated: 0,
          errors: ['Файл пустой или не содержит данных'],
          warnings: [],
          details: []
        };
      }
      
      // Первая строка - заголовки
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];
      
      logger.debug('Заголовки Excel', 'product-partial-update-service', { headers, rowsCount: rows.length });
      
      // Нормализуем заголовки
      const normalizedHeaders = headers.map(header => ({
        original: header,
        canonical: normalizePropertyName(header),
        index: headers.indexOf(header)
      }));
      
      logger.debug('Нормализованные заголовки', 'product-partial-update-service', { normalizedHeaders });
      
      // Определяем ключевые поля для поиска товаров
      const skuIndex = normalizedHeaders.findIndex(h => 
        h.canonical === CANONICAL_PROPERTIES.SKU || 
        h.canonical === CANONICAL_PROPERTIES.SUPPLIER_SKU
      );
      
      if (skuIndex === -1) {
        return {
          success: false,
          updated: 0,
          errors: ['Не найден столбец с артикулом товара (SKU или Артикул поставщика)'],
          warnings: [],
          details: []
        };
      }
      
      const results: ProductUpdateResult = {
        success: true,
        updated: 0,
        errors: [],
        warnings: [],
        details: []
      };
      
      // Обрабатываем каждую строку
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex];
        
        if (!row || row.length === 0) continue;
        
        try {
          // Извлекаем SKU для поиска товара
          const skuValue = row[skuIndex];
          if (!skuValue) {
            results.warnings.push(`Строка ${rowIndex + 2}: Пустой SKU, пропускаем`);
            continue;
          }
          
          const sku = skuValue.toString().trim();
          logger.debug('Обработка товара с SKU', 'product-partial-update-service', { sku, rowIndex: rowIndex + 2 });
          
          // Ищем товар в БД
          const product = await prisma.product.findFirst({
            where: {
              OR: [
                { sku: sku },
                { 
                  properties_data: {
                    path: ['supplier_sku'],
                    equals: sku
                  }
                },
                {
                  properties_data: {
                    path: ['Артикул поставщика'],
                    equals: sku
                  }
                }
              ]
            }
          });
          
          if (!product) {
            results.warnings.push(`Товар с SKU "${sku}" не найден в БД`);
            continue;
          }
          
          logger.debug('Найден товар', 'product-partial-update-service', { sku, productId: product.id, productName: product.name });
          
          // Собираем обновления
          const updates: Record<string, any> = {};
          const updatedProperties: string[] = [];
          const skippedProperties: string[] = [];
          
          // Обрабатываем каждую колонку
          for (const headerInfo of normalizedHeaders) {
            if (!headerInfo.canonical) {
              skippedProperties.push(headerInfo.original);
              continue;
            }
            
            const value = row[headerInfo.index];
            
            // Пропускаем пустые значения если указано в опциях
            if (options.skipEmptyValues && (!value || value === '')) {
              skippedProperties.push(headerInfo.original);
              continue;
            }
            
            // Пропускаем системные поля
            if (this.isSystemField(headerInfo.canonical)) {
              skippedProperties.push(headerInfo.original);
              continue;
            }
            
            // Обрабатываем значение в зависимости от типа
            const processedValue = this.processValue(value, headerInfo.canonical);
            updates[headerInfo.canonical] = processedValue;
            updatedProperties.push(headerInfo.original);
          }
          
          logger.debug('Обновления для товара', 'product-partial-update-service', { sku, updates, updatedPropertiesCount: updatedProperties.length, skippedPropertiesCount: skippedProperties.length });
          
          // Применяем обновления в зависимости от режима
          let finalPropertiesData = product.properties_data;
          
          if (typeof finalPropertiesData === 'string') {
            try {
              finalPropertiesData = JSON.parse(finalPropertiesData);
            } catch (e) {
              finalPropertiesData = {};
            }
          }
          
          switch (options.updateMode) {
            case UPDATE_MODES.REPLACE:
              finalPropertiesData = updates;
              break;
              
            case UPDATE_MODES.MERGE:
              finalPropertiesData = { ...finalPropertiesData, ...updates };
              break;
              
            case UPDATE_MODES.SELECTIVE:
              if (options.selectedProperties) {
                const selectiveUpdates: Record<string, any> = {};
                options.selectedProperties.forEach(prop => {
                  if (updates[prop] !== undefined) {
                    selectiveUpdates[prop] = updates[prop];
                  }
                });
                finalPropertiesData = { ...finalPropertiesData, ...selectiveUpdates };
              } else {
                finalPropertiesData = { ...finalPropertiesData, ...updates };
              }
              break;
          }
          
          // Обновляем товар в БД
          await prisma.product.update({
            where: { id: product.id },
            data: {
              properties_data: JSON.stringify(finalPropertiesData),
              updated_at: new Date()
            }
          });
          
          results.updated++;
          results.details.push({
            productId: product.id,
            sku: sku,
            updatedProperties: updatedProperties,
            skippedProperties: skippedProperties
          });
          
          logger.debug('Товар успешно обновлен', 'product-partial-update-service', { sku });
          
        } catch (error) {
          const errorMsg = `Ошибка при обработке строки ${rowIndex + 2}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
          results.errors.push(errorMsg);
          logger.error('Ошибка при обработке строки', 'product-partial-update-service', error instanceof Error ? { error: error.message, stack: error.stack, rowIndex: rowIndex + 2 } : { error: String(error), rowIndex: rowIndex + 2 });
        }
      }
      
      logger.info('Итоги обновления', 'product-partial-update-service', { updated: results.updated, errorsCount: results.errors.length, warningsCount: results.warnings.length });
      
      return results;
      
    } catch (error) {
      logger.error('Критическая ошибка при обновлении товаров', 'product-partial-update-service', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      return {
        success: false,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Неизвестная ошибка'],
        warnings: [],
        details: []
      };
    }
  }
  
  /**
   * Проверяет, является ли поле системным
   */
  private isSystemField(canonicalName: CanonicalPropertyValue): boolean {
    const systemFields = [
      CANONICAL_PROPERTIES.CREATED_AT,
      CANONICAL_PROPERTIES.UPDATED_AT,
      CANONICAL_PROPERTIES.IS_ACTIVE
    ];
    
    return systemFields.includes(canonicalName);
  }
  
  /**
   * Обрабатывает значение в зависимости от типа поля
   */
  private processValue(value: any, canonicalName: CanonicalPropertyValue): any {
    if (value === null || value === undefined) {
      return null;
    }
    
    const stringValue = value.toString().trim();
    
    // Числовые поля
    const numericFields = [
      CANONICAL_PROPERTIES.BASE_PRICE,
      CANONICAL_PROPERTIES.RETAIL_PRICE,
      CANONICAL_PROPERTIES.WHOLESALE_PRICE,
      CANONICAL_PROPERTIES.STOCK_QUANTITY,
      CANONICAL_PROPERTIES.WIDTH,
      CANONICAL_PROPERTIES.HEIGHT,
      CANONICAL_PROPERTIES.THICKNESS,
      CANONICAL_PROPERTIES.WEIGHT,
      CANONICAL_PROPERTIES.DEPTH
    ];
    
    if (numericFields.includes(canonicalName)) {
      const numValue = parseFloat(stringValue.replace(/[^\d.,]/g, '').replace(',', '.'));
      return isNaN(numValue) ? 0 : numValue;
    }
    
    // Булевы поля
    const booleanFields = [
      CANONICAL_PROPERTIES.IS_ACTIVE,
      CANONICAL_PROPERTIES.GLASS,
      CANONICAL_PROPERTIES.EDGE,
      CANONICAL_PROPERTIES.MOLDING
    ];
    
    if (booleanFields.includes(canonicalName)) {
      const lowerValue = stringValue.toLowerCase();
      return lowerValue === 'да' || lowerValue === 'yes' || lowerValue === 'true' || lowerValue === '1';
    }
    
    // Поля с датами
    const dateFields = [
      CANONICAL_PROPERTIES.VALID_FROM,
      CANONICAL_PROPERTIES.VALID_TO,
      CANONICAL_PROPERTIES.CREATED_AT,
      CANONICAL_PROPERTIES.UPDATED_AT
    ];
    
    if (dateFields.includes(canonicalName)) {
      try {
        return new Date(stringValue).toISOString();
      } catch {
        return stringValue;
      }
    }
    
    // Массивы (например, фото)
    if (canonicalName === CANONICAL_PROPERTIES.PHOTOS) {
      if (typeof stringValue === 'string' && stringValue.includes(',')) {
        return stringValue.split(',').map((url: string) => url.trim()).filter(Boolean);
      }
      return [stringValue];
    }
    
    // Остальные поля как строки
    return stringValue;
  }
  
  /**
   * Создает шаблон Excel для частичного обновления
   */
  async createUpdateTemplate(
    categoryId: string,
    selectedProperties: CanonicalPropertyValue[] = []
  ): Promise<Buffer> {
    try {
      const XLSX = require('xlsx');
      
      // Получаем товары из категории для примера
      const products = await prisma.product.findMany({
        where: {
          catalog_category_id: categoryId,
          is_active: true
        },
        take: 5,
        select: {
          sku: true,
          properties_data: true
        }
      });
      
      // Определяем свойства для шаблона
      const templateProperties = selectedProperties.length > 0 
        ? selectedProperties 
        : [
            CANONICAL_PROPERTIES.SKU,
            CANONICAL_PROPERTIES.SUPPLIER_SKU,
            CANONICAL_PROPERTIES.BASE_PRICE,
            CANONICAL_PROPERTIES.RETAIL_PRICE,
            CANONICAL_PROPERTIES.STOCK_QUANTITY,
            CANONICAL_PROPERTIES.STYLE,
            CANONICAL_PROPERTIES.COATING_TYPE,
            CANONICAL_PROPERTIES.COATING_COLOR,
            CANONICAL_PROPERTIES.WIDTH,
            CANONICAL_PROPERTIES.HEIGHT
          ];
      
      // Создаем заголовки
      const headers = templateProperties.map(prop => {
        const displayName = this.getDisplayName(prop);
        return `${displayName} (${prop})`;
      });
      
      // Создаем данные для примера
      const data = [headers];
      
      products.forEach(product => {
        const properties = typeof product.properties_data === 'string' 
          ? JSON.parse(product.properties_data) 
          : product.properties_data;
        
        const row = templateProperties.map(prop => {
          return properties[prop] || '';
        });
        
        data.push(row);
      });
      
      // Создаем Excel файл
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Обновление товаров');
      
      // Конвертируем в Buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      return buffer;
      
    } catch (error) {
      logger.error('Ошибка при создании шаблона', 'product-partial-update-service', error instanceof Error ? { error: error.message, stack: error.stack, categoryId } : { error: String(error), categoryId });
      throw error;
    }
  }
  
  /**
   * Получает отображаемое название свойства
   */
  private getDisplayName(canonicalName: CanonicalPropertyValue): string {
    const displayNames: Record<CanonicalPropertyValue, string> = {
      [CANONICAL_PROPERTIES.SKU]: 'Артикул',
      [CANONICAL_PROPERTIES.SUPPLIER_SKU]: 'Артикул поставщика',
      [CANONICAL_PROPERTIES.BASE_PRICE]: 'Базовая цена',
      [CANONICAL_PROPERTIES.RETAIL_PRICE]: 'Розничная цена',
      [CANONICAL_PROPERTIES.STOCK_QUANTITY]: 'Количество на складе',
      [CANONICAL_PROPERTIES.STYLE]: 'Стиль',
      [CANONICAL_PROPERTIES.COATING_TYPE]: 'Тип покрытия',
      [CANONICAL_PROPERTIES.COATING_COLOR]: 'Цвет покрытия',
      [CANONICAL_PROPERTIES.WIDTH]: 'Ширина (мм)',
      [CANONICAL_PROPERTIES.HEIGHT]: 'Высота (мм)'
    };
    
    return displayNames[canonicalName] || canonicalName;
  }
}

// Экспортируем экземпляр сервиса
export const productPartialUpdateService = new ProductPartialUpdateService();
