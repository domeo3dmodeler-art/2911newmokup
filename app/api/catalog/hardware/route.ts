import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';
import { getLoggingContextFromRequest } from '@/lib/auth/logging-context';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { requireAuth } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';

async function getHandler(
  request: NextRequest
): Promise<NextResponse> {
  const loggingContext = getLoggingContextFromRequest(request);
  const url = new URL(request.url);
  const type = url.searchParams.get('type'); // 'kits' или 'handles'

  logger.debug('Загрузка данных фурнитуры', 'catalog/hardware/GET', { type }, loggingContext);

  if (type === 'kits') {
    // Получаем комплекты фурнитуры
    const kits = await prisma.product.findMany({
      where: {
        catalog_category_id: 'cmg50xchh0024v7mn2b5ri4qy', // ID категории "Комплекты фурнитуры"
      },
      select: {
        id: true,
        name: true,
        properties_data: true,
      },
    });

    const formattedKits = kits.map(kit => {
      let props: Record<string, unknown>;
      try {
        props = typeof kit.properties_data === 'string' 
          ? JSON.parse(kit.properties_data) 
          : kit.properties_data || {};
      } catch (parseError) {
        logger.warn('Ошибка парсинга свойств комплекта', 'catalog/hardware/GET', { kitId: kit.id, error: parseError }, loggingContext);
        props = {};
      }
      return {
        id: kit.id,
        name: (props['Наименование для Web'] as string) || kit.name,
        description: (props['Описание комплекта для Web'] as string) || '',
        price: parseFloat((props['Группа_цена'] as string) || '0'),
        priceGroup: (props['Ценовая группа'] as string) || '',
        isBasic: (props['Ценовая группа'] as string) === 'Базовый',
      };
    });

    return apiSuccess(formattedKits);
  }

  if (type === 'handles') {
    // Получаем ручки
    const handles = await prisma.product.findMany({
      where: {
        catalog_category_id: 'cmg50xchb001wv7mnbzhw5y9r', // ID категории "Ручки"
      },
      select: {
        id: true,
        name: true,
        properties_data: true,
      },
    });

    const formattedHandles = handles.map(handle => {
      let props: Record<string, unknown>;
      try {
        props = typeof handle.properties_data === 'string' 
          ? JSON.parse(handle.properties_data) 
          : handle.properties_data || {};
      } catch (parseError) {
        logger.warn('Ошибка парсинга свойств ручки', 'catalog/hardware/GET', { handleId: handle.id, error: parseError }, loggingContext);
        props = {};
      }
      
      // Получаем фотографии из properties_data
      let photos: (string | null)[] = [];
      
      // Проверяем разные форматы хранения фото
      if (props.photos) {
        if (typeof props.photos === 'object' && props.photos !== null && 'cover' in props.photos) {
          // Формат { cover: "...", gallery: [...] }
          const photosObj = props.photos as { cover?: string; gallery?: string[] };
          const coverPhoto = photosObj.cover;
          const galleryPhotos = photosObj.gallery || [];
          
          // Нормализуем пути к фото
          const normalizePhoto = (photo: string | null | undefined): string | null => {
            if (!photo) return null;
            // Если путь начинается с "products/", добавляем "/uploads/"
            if (photo.startsWith('products/')) {
              return `/uploads/${photo}`;
            }
            // Если уже начинается с "/uploads/", возвращаем как есть
            if (photo.startsWith('/uploads/')) {
              return photo;
            }
            // Если не начинается с "/", добавляем префикс
            if (!photo.startsWith('/')) {
              return `/uploads/products/${photo}`;
            }
            return photo;
          };
          
          photos = [
            normalizePhoto(coverPhoto),
            ...galleryPhotos.map(normalizePhoto)
          ].filter((photo): photo is string => photo !== null);
        } else if (Array.isArray(props.photos)) {
          // Массив фото - нормализуем каждый
          photos = (props.photos as string[]).map((photo: string) => {
            if (!photo) return null;
            if (photo.startsWith('products/')) {
              return `/uploads/${photo}`;
            }
            if (photo.startsWith('/uploads/')) {
              return photo;
            }
            if (!photo.startsWith('/')) {
              return `/uploads/products/${photo}`;
            }
            return photo;
          }).filter((photo): photo is string => photo !== null);
        }
      }
      
      return {
        id: handle.id,
        name: (props['Domeo_наименование для Web'] as string) || 
          (props['Domeo_наименование ручки_1С'] as string) || 
          handle.name,
        group: (props['Группа'] as string) || 'Без группы',
        price: parseFloat((props['Domeo_цена группы Web'] as string) || '0'),
        isBasic: (props['Группа'] as string) === 'Базовый',
        showroom: (props['Наличие в шоуруме'] as string) === 'да' || 
          (props['Наличие в шоуруме'] as string) === 'Да',
        supplier: (props['Поставщик'] as string) || '',
        article: (props['Фабрика_артикул'] as string) || '',
        factoryName: (props['Фабрика_наименование'] as string) || '',
        photos: photos,
      };
    });

    // Группируем ручки по группам
    const groupedHandles = formattedHandles.reduce((acc, handle) => {
      const group = handle.group || 'Без группы';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(handle);
      return acc;
    }, {} as Record<string, typeof formattedHandles>);

    return apiSuccess(groupedHandles);
  }

  return apiError(
    ApiErrorCode.VALIDATION_ERROR,
    'Неверный параметр type. Используйте "kits" или "handles"',
    400
  );
}

// Публичный API - каталог фурнитуры доступен всем
export const GET = withErrorHandling(
  getHandler,
  'catalog/hardware/GET'
);
