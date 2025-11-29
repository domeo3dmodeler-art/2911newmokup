import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { uniqueValuesCache } from '../../../../../lib/cache/unique-values-cache';
import { logger } from '../../../../../lib/logging/logger';

interface ProductWithProperties {
  id: string;
  properties_data: string | Record<string, unknown> | null;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const categoryIdsParam = url.searchParams.getAll('categoryIds');
    const propertyNamesParam = url.searchParams.getAll('propertyNames');
    
    const categoryIds = categoryIdsParam;
    const propertyNames = propertyNamesParam;

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: 'Category IDs are required' },
        { status: 400 }
      );
    }

    if (!propertyNames || !Array.isArray(propertyNames) || propertyNames.length === 0) {
      return NextResponse.json(
        { error: 'Property names are required' },
        { status: 400 }
      );
    }

    logger.debug('Loading unique values for properties (GET)', 'catalog/properties/unique-values', { propertyNames, categoryIds });

    // Проверяем кэш
    const cachedData = uniqueValuesCache.get(categoryIds, propertyNames);
    if (cachedData) {
      logger.debug('Returning cached unique values (GET)', 'catalog/properties/unique-values', { propertyNames, categoryIds });
      return NextResponse.json({
        success: true,
        uniqueValues: cachedData,
        cached: true
      });
    }

    // Загружаем все товары из указанных категорий
    const products = await prisma.product.findMany({
      where: {
        catalog_category_id: { in: categoryIds },
        is_active: true
      },
      select: {
        id: true,
        properties_data: true
      }
    });

    logger.debug('Found products to analyze', 'catalog/properties/unique-values', { productsCount: products.length });

    // Извлекаем уникальные значения для каждого свойства
    const results: Record<string, string[]> = {};
    
    for (const propertyName of propertyNames) {
      const uniqueValues = new Set<string>();
      
      products.forEach((product: ProductWithProperties) => {
        if (product.properties_data) {
          try {
            const propsData = typeof product.properties_data === 'string' 
              ? JSON.parse(product.properties_data) 
              : product.properties_data;
            
            // Ищем свойство по точному имени или fuzzy match
            let propertyValue = propsData[propertyName];
            
            if (propertyValue === undefined) {
              // Пробуем найти по fuzzy match
              for (const key in propsData) {
                if (key.toLowerCase().includes(propertyName.toLowerCase()) || 
                    propertyName.toLowerCase().includes(key.toLowerCase())) {
                  propertyValue = propsData[key];
                  break;
                }
              }
            }
            
            if (propertyValue !== undefined && propertyValue !== null && propertyValue !== '') {
              const valueStr = String(propertyValue).trim();
              if (valueStr) {
                uniqueValues.add(valueStr);
              }
            }
          } catch (error) {
            logger.error('Error parsing properties_data', 'catalog/properties/unique-values', { productId: product.id, error: error instanceof Error ? error.message : String(error) });
          }
        }
      });
      
      results[propertyName] = Array.from(uniqueValues).sort();
    }

    logger.debug('Unique values extracted', 'catalog/properties/unique-values', { results: Object.keys(results).map(key => `${key}: ${results[key].length} values`) });

    // Сохраняем в кэш
    uniqueValuesCache.set(categoryIds, propertyNames, results);

    return NextResponse.json({
      success: true,
      uniqueValues: results,
      cached: false
    });

  } catch (error) {
    logger.error('Error extracting unique property values', 'catalog/properties/unique-values', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { success: false, message: 'Ошибка при извлечении уникальных значений свойств' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { categoryIds, propertyNames } = await request.json();

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: 'Category IDs are required' },
        { status: 400 }
      );
    }

    if (!propertyNames || !Array.isArray(propertyNames) || propertyNames.length === 0) {
      return NextResponse.json(
        { error: 'Property names are required' },
        { status: 400 }
      );
    }

    logger.debug('Loading unique values for properties (POST)', 'catalog/properties/unique-values', { propertyNames, categoryIds });

    // Проверяем кэш
    const cachedData = uniqueValuesCache.get(categoryIds, propertyNames);
    if (cachedData) {
      logger.debug('Returning cached unique values (POST)', 'catalog/properties/unique-values', { propertyNames, categoryIds });
      return NextResponse.json({
        success: true,
        uniqueValues: cachedData,
        cached: true
      });
    }

    // Загружаем все продукты для указанных категорий
    const products = await prisma.product.findMany({
      where: {
        catalog_category_id: {
          in: categoryIds
        },
        is_active: true
      },
      select: {
        id: true,
        properties_data: true
      }
    });

    logger.debug('Found products for categories', 'catalog/properties/unique-values', { productsCount: products.length, categoryIds });

    // Извлекаем уникальные значения для каждого свойства
    const results: Record<string, string[]> = {};
    
    for (const propertyName of propertyNames) {
      const uniqueValues = new Set<string>();
      
      for (const product of products) {
        if (product.properties_data) {
          try {
            const props = typeof product.properties_data === 'string' 
              ? JSON.parse(product.properties_data) 
              : product.properties_data;
            
            if (props && props[propertyName]) {
              const value = props[propertyName];
              if (value && typeof value === 'string' && value.trim()) {
                uniqueValues.add(value.trim());
              }
            }
          } catch (parseError) {
            logger.warn('Error parsing properties for product', 'catalog/properties/unique-values', { productId: product.id, error: parseError instanceof Error ? parseError.message : String(parseError) });
          }
        }
      }
      
      results[propertyName] = Array.from(uniqueValues).sort();
      logger.debug('Property unique values found', 'catalog/properties/unique-values', { propertyName, valuesCount: results[propertyName].length });
    }

    // Кэшируем результаты
    uniqueValuesCache.set(categoryIds, propertyNames, results);

    return NextResponse.json({
      success: true,
      uniqueValues: results,
      cached: false
    });

  } catch (error) {
    logger.error('Error extracting unique property values (POST)', 'catalog/properties/unique-values', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { success: false, message: 'Ошибка при извлечении уникальных значений свойств' },
      { status: 500 }
    );
  }
}
