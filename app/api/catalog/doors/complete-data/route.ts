import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';
import { getLoggingContextFromRequest } from '@/lib/auth/logging-context';
import { getPropertyPhotos, structurePropertyPhotos } from '../../../../../lib/property-photos';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { requireAuth } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';

// Кэширование
const completeDataCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 минут

// DELETE - очистка кэша
async function deleteHandler(
  req: NextRequest,
  user: ReturnType<typeof getAuthenticatedUser>
): Promise<NextResponse> {
  const loggingContext = getLoggingContextFromRequest(req);
  completeDataCache.clear();
  logger.info('Кэш complete-data очищен', 'catalog/doors/complete-data/DELETE', {}, loggingContext);
  return apiSuccess({ success: true, message: 'Кэш очищен' });
}

export const DELETE = withErrorHandling(
  requireAuth(deleteHandler),
  'catalog/doors/complete-data/DELETE'
);

async function getHandler(
  req: NextRequest
): Promise<NextResponse> {
  const loggingContext = getLoggingContextFromRequest(req);
  const { searchParams } = new URL(req.url);
  const style = searchParams.get('style');

  const cacheKey = style || 'all';
  
  // Проверяем кэш
  const cached = completeDataCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug('API complete-data - используем кэш', 'catalog/doors/complete-data/GET', { cacheKey }, loggingContext);
    return apiSuccess({
      ok: true,
      ...cached.data,
      cached: true
    });
  }

  logger.info('API complete-data - загрузка данных для стиля', 'catalog/doors/complete-data/GET', { style: style || 'все' }, loggingContext);

  try {
    // Проверяем подключение к БД
    await prisma.$connect();

    // Получаем ВСЕ товары для полного списка моделей
    // Используем ID категории для надежности
    const DOORS_CATEGORY_ID = 'cmg50xcgs001cv7mn0tdyk1wo'; // ID категории "Межкомнатные двери"
    
    const products = await prisma.product.findMany({
      where: {
        catalog_category_id: DOORS_CATEGORY_ID,
        is_active: true
      },
      select: {
        id: true,
        sku: true,
        properties_data: true
      }
    });

  logger.debug(`Загружено ${products.length} товаров из БД`, 'catalog/doors/complete-data/GET', { productsCount: products.length }, loggingContext);

  // Обработка данных
  const models: any[] = [];
  const styles = new Set<string>();

  // Сначала собираем все товары по моделям
  const modelMap = new Map<string, any>();

  products.forEach(product => {
    try {
      const properties = product.properties_data ?
        (typeof product.properties_data === 'string' ? JSON.parse(product.properties_data) : product.properties_data) : {};

      // Используем "Артикул поставщика" как ключ для группировки, но "Domeo_Название модели для Web" как название модели
      const supplierSku = properties['Артикул поставщика'];
      const modelName = properties['Domeo_Название модели для Web'];
      const productStyle = properties['Domeo_Стиль Web'] || 'Классика'; // По умолчанию "Классика"

      // Проверяем, что supplierSku является строкой
      const modelKey = typeof supplierSku === 'string' ? supplierSku : String(supplierSku || '');
      const displayName = typeof modelName === 'string' ? modelName : modelKey; // Используем название модели или fallback к ключу
      const styleString = typeof productStyle === 'string' ? productStyle : String(productStyle || 'Классика');

      if (modelKey && modelKey.trim() !== '') {
        // Фильтруем по стилю если указан
        if (style && styleString !== style) {
          return;
        }

        styles.add(styleString);

        // Проверяем, есть ли уже такая модель
        if (!modelMap.has(modelKey)) {
          modelMap.set(modelKey, {
            model: displayName, // Используем название модели для отображения
            modelKey: modelName, // Сохраняем полное имя модели для поиска фото
            style: styleString,
            products: []
          });
        }

        // Добавляем товар к модели
        const modelData = modelMap.get(modelKey);
        modelData.products.push({
          sku: product.sku,
          properties: properties
        });
      }
    } catch (error) {
      logger.warn(`Ошибка обработки товара`, 'catalog/doors/complete-data/GET', { sku: product.sku, error }, loggingContext);
    }
  });

  // Теперь структурируем фото для каждой модели используя новую логику property_photos
  const modelPromises = Array.from(modelMap.entries()).map(async ([modelKey, modelData]) => {
    logger.debug(`Получаем фото для модели`, 'catalog/doors/complete-data/GET', { model: modelData.model, modelKey }, loggingContext);
    
    // modelKey содержит артикул поставщика (например, "d23")
    // modelData.modelKey содержит полное имя модели (Domeo_Название модели для Web)
    
    let modelPhotos: any[] = [];
    
    // Сначала ищем фото по "Артикул поставщика" (т.к. фото могут быть привязаны по артикулу)
    if (modelKey && typeof modelKey === 'string' && modelKey.trim() !== '') {
      const normalizedArticle = modelKey.toLowerCase();
      
      // Ищем по базовому артикулу
      let propertyPhotos = await getPropertyPhotos(
        'cmg50xcgs001cv7mn0tdyk1wo', // ID категории "Межкомнатные двери"
        'Артикул поставщика',
        normalizedArticle
      );
    
      // Ищем фото для вариантов артикула (d23 → d23_1, d23_2, ...)
      for (let i = 1; i <= 10; i++) {
        const variantArticle = `${normalizedArticle}_${i}`;
        const variantPhotos = await getPropertyPhotos(
          'cmg50xcgs001cv7mn0tdyk1wo',
          'Артикул поставщика',
          variantArticle
        );
        
        if (variantPhotos.length > 0) {
          propertyPhotos.push(...variantPhotos);
        }
      }
      
      modelPhotos = propertyPhotos;
    }
    
    // Если не найдено по артикулу, ищем по названию модели
    if (modelPhotos.length === 0 && modelData.modelKey) {
      modelPhotos = await getPropertyPhotos(
        'cmg50xcgs001cv7mn0tdyk1wo', // ID категории "Межкомнатные двери"
        'Domeo_Название модели для Web',        // Свойство для поиска
        modelData.modelKey                     // Значение свойства (полное название модели)
      );
    }

    const photoStructure = structurePropertyPhotos(modelPhotos);
    const hasGallery = photoStructure.gallery.length > 0;

    // Нормализуем пути к фото: добавляем префикс /uploads/ если его нет
    const normalizePhotoPath = (path: string | null): string | null => {
      if (!path) return null;
      if (path.startsWith('/uploads/')) return path;
      if (path.startsWith('products/')) return `/uploads/${path}`;
      if (path.startsWith('uploads/')) return `/uploads/${path.substring(7)}`;
      return `/uploads/${path}`;
    };

    const normalizedCover = normalizePhotoPath(photoStructure.cover);
    const normalizedGallery = photoStructure.gallery.map(normalizePhotoPath).filter((p): p is string => p !== null);

    logger.debug(`Нормализация путей к фото`, 'catalog/doors/complete-data/GET', { 
      model: modelData.model,
      coverOriginal: photoStructure.cover,
      coverNormalized: normalizedCover,
      galleryOriginal: photoStructure.gallery,
      galleryNormalized: normalizedGallery
    }, loggingContext);

    const result = {
      model: modelData.model,
      modelKey: modelData.modelKey, // Добавляем ключ для поиска фото
      style: modelData.style,
      photo: normalizedCover, // Только обложка для каталога
      photos: {
        cover: normalizedCover,
        gallery: normalizedGallery
      },      // Полная структура для центрального отображения
      hasGallery: hasGallery,      // Флаг наличия галереи
      products: modelData.products, // Добавляем массив товаров
      options: {
        finishes: [],
        colors: [],
        types: [],
        widths: [],
        heights: []
      }
    };
    
    logger.debug(`Возвращаем данные для модели`, 'catalog/doors/complete-data/GET', { 
      model: result.model, 
      modelKey: result.modelKey,
      hasPhoto: !!result.photo,
      photo: result.photo,
      photosCover: result.photos.cover,
      photosGalleryCount: result.photos.gallery.length,
      hasGallery 
    }, loggingContext);
    
    return result;
  });

  const modelResults = await Promise.all(modelPromises);
  models.push(...modelResults);

  const result = {
    models: models.sort((a, b) => {
      const modelA = a.model || '';
      const modelB = b.model || '';
      return modelA.localeCompare(modelB);
    }),
    totalModels: models.length,
    styles: Array.from(styles),
    timestamp: Date.now()
  };

  // Сохраняем в кэш
  completeDataCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });

    logger.info(`API complete-data - найдено моделей`, 'catalog/doors/complete-data/GET', { modelsCount: models.length }, loggingContext);

    return apiSuccess({
      ok: true,
      ...result
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined;
    
    logger.error('Error fetching complete-data', 'catalog/doors/complete-data/GET', { 
      error: errorMessage,
      code: errorCode,
      stack: error instanceof Error ? error.stack : undefined
    }, loggingContext);
    
    // В development возвращаем детали ошибки
    if (process.env.NODE_ENV === 'development') {
      return apiError(
        ApiErrorCode.INTERNAL_SERVER_ERROR,
        'Ошибка при получении данных каталога',
        500,
        {
          message: errorMessage,
          code: errorCode,
          stack: error instanceof Error ? error.stack : undefined,
          prismaMeta: error && typeof error === 'object' && 'meta' in error ? error.meta : undefined,
        }
      );
    }
    
    throw error;
  }
}

// Публичный API - каталог доступен всем
export const GET = withErrorHandling(
  getHandler,
  'catalog/doors/complete-data/GET'
);
