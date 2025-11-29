import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthAndPermission } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { ValidationError, ConflictError } from '@/lib/api/errors';
import { logger } from '@/lib/logging/logger';

// ===================== Создание новой категории =====================

async function postHandler(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const { name, slug, description, parentId } = await req.json();

    if (!name || !slug) {
      throw new ValidationError('Не указано название или slug категории');
    }

    logger.info('Создание категории', 'admin/categories', { userId: user.userId, name, slug });

    // Проверяем уникальность slug
    const existingCategory = await prisma.frontendCategory.findUnique({
      where: { slug }
    });

    if (existingCategory) {
      throw new ConflictError('Категория с таким slug уже существует');
    }

    // Создаем категорию
    const newCategory = await prisma.frontendCategory.create({
      data: {
        name,
        slug,
        description: description || '',
        is_active: true,
        catalog_category_ids: '[]',
        display_config: '{}'
      }
    });

    logger.info('Категория создана', 'admin/categories', { categoryId: newCategory.id });

    return apiSuccess({
      category: {
        id: newCategory.id,
        name: newCategory.name,
        slug: newCategory.slug,
        description: newCategory.description,
        isActive: newCategory.is_active,
        catalogCategoryIds: JSON.parse(newCategory.catalog_category_ids),
        displayConfig: JSON.parse(newCategory.display_config),
        createdAt: newCategory.created_at,
        updatedAt: newCategory.updated_at
      },
      message: 'Категория успешно создана'
    });

  } catch (error) {
    logger.error('Category creation error', 'admin/categories', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    if (error instanceof ValidationError || error instanceof ConflictError) {
      throw error;
    }
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка при создании категории', 500);
  }
}

export const POST = withErrorHandling(
  requireAuthAndPermission(postHandler, 'ADMIN'),
  'admin/categories/POST'
);

// ===================== Получение списка категорий =====================

async function getHandler(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    logger.info('Получение списка категорий', 'admin/categories', { userId: user.userId });

    const categories = await prisma.frontendCategory.findMany({
      orderBy: [
        { name: 'asc' }
      ]
    });

    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      isActive: category.is_active,
      catalogCategoryIds: JSON.parse(category.catalog_category_ids),
      displayConfig: JSON.parse(category.display_config),
      productsCount: 0, // Пока не реализовано
      subcategoriesCount: 0, // Пока не реализовано
      configuratorConfig: {},
      pageTemplate: null,
      customLayout: null,
      properties: [],
      importMapping: {},
      createdAt: category.created_at,
      updatedAt: category.updated_at
    }));

    logger.info('Список категорий получен', 'admin/categories', { count: formattedCategories.length });

    return apiSuccess({
      categories: formattedCategories
    });

  } catch (error) {
    logger.error('Categories fetch error', 'admin/categories', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка при получении категорий', 500);
  }
}

export const GET = withErrorHandling(
  requireAuthAndPermission(getHandler, 'ADMIN'),
  'admin/categories/GET'
);