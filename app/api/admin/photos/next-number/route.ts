import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthAndPermission } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { ValidationError } from '@/lib/api/errors';
import { logger } from '@/lib/logging/logger';

// Импортируем функции напрямую для совместимости
function parsePhotoFileName(fileName: string) {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  
  // Проверяем, есть ли номер в конце (_1, _2, etc.)
  const match = nameWithoutExt.match(/^(.+)_(\d+)$/);
  
  if (match) {
    return {
      fileName,
      isCover: false,
      number: parseInt(match[2]),
      baseName: match[1]
    };
  } else {
    return {
      fileName,
      isCover: true,
      number: null,
      baseName: nameWithoutExt
    };
  }
}

function getNextPhotoNumber(existingPhotos: string[], baseName: string): number {
  const galleryNumbers = existingPhotos
    .map(photo => parsePhotoFileName(photo))
    .filter(info => !info.isCover && info.baseName === baseName)
    .map(info => info.number!)
    .sort((a, b) => a - b);
  
  // Находим первый пропущенный номер или следующий после максимального
  let nextNumber = 1;
  for (const num of galleryNumbers) {
    if (num === nextNumber) {
      nextNumber++;
    } else {
      break;
    }
  }
  
  return nextNumber;
}

// GET /api/admin/photos/next-number - Получить следующий доступный номер для фото
async function getHandler(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const mappingProperty = searchParams.get('mapping_property');
    const propertyValue = searchParams.get('property_value');

    if (!category) {
      throw new ValidationError('Не указана категория');
    }

    if (!mappingProperty) {
      throw new ValidationError('Не указано свойство для привязки');
    }

    if (!propertyValue) {
      throw new ValidationError('Не указано значение свойства');
    }

    logger.info('Получение следующего номера фото', 'admin/photos/next-number', { 
      userId: user.userId, 
      category, 
      mappingProperty, 
      propertyValue 
    });

    // Получаем товары с указанным значением свойства
    const products = await prisma.product.findMany({
      where: {
        catalog_category_id: category
      },
      select: {
        id: true,
        sku: true,
        properties_data: true
      }
    });

    // Находим товары с совпадающим значением свойства
    const matchingProducts = products.filter(product => {
      try {
        const properties = JSON.parse(product.properties_data || '{}');
        
        // Ищем по всем возможным ключам свойств
        const possibleKeys = [
          mappingProperty,
          'Артикул поставщика',
          'Артикул',
          'SKU',
          'sku',
          'Артикул_поставщика',
          'Артикул поставщика',
          'Supplier SKU',
          'Supplier_sku'
        ];
        
        // Также ищем по всем ключам, которые содержат "артикул" или "sku"
        const allKeys = Object.keys(properties);
        allKeys.forEach(key => {
          if (key.toLowerCase().includes('артикул') || 
              key.toLowerCase().includes('sku') ||
              key.toLowerCase().includes('supplier')) {
            possibleKeys.push(key);
          }
        });
        
        // Убираем дубликаты
        const uniqueKeys = [...new Set(possibleKeys)];
        
        for (const key of uniqueKeys) {
          const propertyValueFromDB = properties[key];
          if (propertyValueFromDB && propertyValueFromDB.toString().trim() === propertyValue.trim()) {
            return true;
          }
        }
        
        return false;
      } catch (error) {
        logger.error('Ошибка парсинга свойств товара', 'admin/photos/next-number', error instanceof Error ? { error: error.message } : { error: String(error) });
        return false;
      }
    });

    logger.info(`Найдено ${matchingProducts.length} товаров с значением "${propertyValue}"`, 'admin/photos/next-number', { matchingProductsCount: matchingProducts.length });

    if (matchingProducts.length === 0) {
      logger.warn('Товары с указанным значением не найдены', 'admin/photos/next-number', { propertyValue });
      return apiSuccess({
        message: `Товары с значением "${propertyValue}" не найдены`,
        nextNumber: 1
      });
    }

    // Собираем все существующие фото для этих товаров
    const allExistingPhotos: string[] = [];
    
    matchingProducts.forEach(product => {
      try {
        const properties = JSON.parse(product.properties_data || '{}');
        if (properties.photos && Array.isArray(properties.photos)) {
          allExistingPhotos.push(...properties.photos);
        }
      } catch (error) {
        logger.error(`Ошибка парсинга фото товара ${product.sku}`, 'admin/photos/next-number', error instanceof Error ? { error: error.message } : { error: String(error) });
      }
    });

    // Получаем следующий номер для базового имени
    const nextNumber = getNextPhotoNumber(allExistingPhotos, propertyValue);

    logger.info(`Следующий номер для "${propertyValue}": ${nextNumber}`, 'admin/photos/next-number', { nextNumber, existingPhotosCount: allExistingPhotos.length });

    return apiSuccess({
      nextNumber: nextNumber,
      baseName: propertyValue,
      existingPhotos: allExistingPhotos.length,
      matchingProducts: matchingProducts.length
    });

  } catch (error) {
    logger.error('Ошибка при получении следующего номера фото', 'admin/photos/next-number', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    if (error instanceof ValidationError) {
      throw error;
    }
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка сервера', 500);
  }
}

export const GET = withErrorHandling(
  requireAuthAndPermission(getHandler, 'ADMIN'),
  'admin/photos/next-number/GET'
);
