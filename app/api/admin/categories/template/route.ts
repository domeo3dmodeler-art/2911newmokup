import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthAndPermission } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { ValidationError, NotFoundError } from '@/lib/api/errors';
import { logger } from '@/lib/logging/logger';

// ===================== Сохранение шаблона конфигуратора =====================

async function postHandler(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const { categoryId, template } = await req.json();

    if (!categoryId || !template) {
      throw new ValidationError('Не указан ID категории или шаблон');
    }

    logger.info('Сохранение шаблона конфигуратора', 'admin/categories/template', { userId: user.userId, categoryId });

    // Обновляем категорию с шаблоном конфигуратора
    const updatedCategory = await prisma.frontendCategory.update({
      where: { id: categoryId },
      data: {
        display_config: JSON.stringify(template),
        updated_at: new Date()
      }
    });

    logger.info('Шаблон конфигуратора сохранен', 'admin/categories/template', { categoryId });

    return apiSuccess({
      category: updatedCategory,
      message: 'Шаблон конфигуратора сохранен'
    });

  } catch (error) {
    logger.error('Template save error', 'admin/categories/template', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    if (error instanceof ValidationError) {
      throw error;
    }
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка при сохранении шаблона', 500);
  }
}

export const POST = withErrorHandling(
  requireAuthAndPermission(postHandler, 'ADMIN'),
  'admin/categories/template/POST'
);

// ===================== Получение шаблона конфигуратора =====================

async function getHandler(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      throw new ValidationError('Не указан ID категории');
    }

    logger.info('Получение шаблона конфигуратора', 'admin/categories/template', { userId: user.userId, categoryId });

    const category = await prisma.frontendCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw new NotFoundError('Категория не найдена');
    }

    let template = null;
    
    if (category.display_config) {
      try {
        template = JSON.parse(category.display_config);
      } catch (error) {
        logger.error('Error parsing template', 'admin/categories/template', error instanceof Error ? { error: error.message } : { error: String(error) });
      }
    }

    logger.info('Шаблон конфигуратора получен', 'admin/categories/template', { categoryId });

    return apiSuccess({
      template,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description
      }
    });

  } catch (error) {
    logger.error('Template fetch error', 'admin/categories/template', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка при получении шаблона', 500);
  }
}

export const GET = withErrorHandling(
  requireAuthAndPermission(getHandler, 'ADMIN'),
  'admin/categories/template/GET'
);
