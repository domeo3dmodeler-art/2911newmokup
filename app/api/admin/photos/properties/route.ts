import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthAndPermission } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { ValidationError } from '@/lib/api/errors';
import { logger } from '@/lib/logging/logger';

/**
 * GET /api/admin/photos/properties - Получить доступные свойства для загрузки фото
 * Параметры:
 * - category: ID категории
 */
async function getHandler(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
      throw new ValidationError('Не указана категория');
    }

    logger.info('Получение свойств для загрузки фото', 'admin/photos/properties', { userId: user.userId, category });

    // Получаем несколько товаров из категории для анализа свойств
    const products = await prisma.product.findMany({
      where: {
        catalog_category_id: category
      },
      select: {
        properties_data: true
      },
      take: 10 // Берем первые 10 товаров для анализа
    });

    if (products.length === 0) {
      logger.info('Товары в категории не найдены', 'admin/photos/properties', { category });
      return apiSuccess({
        properties: [],
        message: 'Товары в категории не найдены'
      });
    }

    // Собираем все уникальные свойства
    const allProperties = new Set<string>();
    products.forEach(product => {
      try {
        const properties = JSON.parse(product.properties_data || '{}');
        Object.keys(properties).forEach(key => {
          allProperties.add(key);
        });
      } catch (error) {
        logger.warn('Ошибка парсинга свойств товара', 'admin/photos/properties', error instanceof Error ? { error: error.message } : { error: String(error) });
      }
    });

    // Определяем рекомендуемые свойства для фото в зависимости от категории
    const recommendedProperties: string[] = [];
    const categoryName = await prisma.catalogCategory.findUnique({
      where: { id: category },
      select: { name: true }
    });

    if (categoryName?.name?.toLowerCase().includes('двер')) {
      // Для дверей рекомендуем свойства модели
      recommendedProperties.push(
        'Domeo_Название модели для Web',
        'Domeo_Стиль Web',
        'Цвет',
        'Отделка',
        'Материал'
      );
    } else {
      // Для других категорий - общие свойства
      recommendedProperties.push(
        'Название',
        'Модель',
        'Цвет',
        'Материал',
        'Тип'
      );
    }

    // Фильтруем только существующие свойства
    const availableRecommended = recommendedProperties.filter(prop => 
      allProperties.has(prop)
    );

    // Добавляем остальные свойства
    const otherProperties = Array.from(allProperties)
      .filter(prop => !recommendedProperties.includes(prop))
      .sort();

    const result = {
      success: true,
      category: categoryName?.name || 'Неизвестная категория',
      properties: {
        recommended: availableRecommended,
        other: otherProperties,
        all: Array.from(allProperties).sort()
      },
      total: allProperties.size
    };

    logger.info('Свойства для фото получены', 'admin/photos/properties', { category, totalProperties: allProperties.size });

    return apiSuccess(result);

  } catch (error) {
    logger.error('Ошибка получения свойств для фото', 'admin/photos/properties', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    if (error instanceof ValidationError) {
      throw error;
    }
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка сервера при получении свойств', 500);
  }
}

export const GET = withErrorHandling(
  requireAuthAndPermission(getHandler, 'ADMIN'),
  'admin/photos/properties/GET'
);
