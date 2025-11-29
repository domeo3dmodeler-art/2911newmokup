import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthAndPermission } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { ValidationError } from '@/lib/api/errors';
import { logger } from '@/lib/logging/logger';

// GET /api/admin/property-photos - Получить фото для свойств
async function getHandler(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const propertyName = searchParams.get('propertyName');
    const propertyValue = searchParams.get('propertyValue');

    logger.info('Получение фото свойств', 'admin/property-photos', { userId: user.userId, categoryId, propertyName, propertyValue });

    const where: Record<string, unknown> = {};
    
    if (categoryId) where.categoryId = categoryId;
    if (propertyName) where.propertyName = propertyName;
    if (propertyValue) where.propertyValue = propertyValue;

    const photos = await prisma.propertyPhoto.findMany({
      where,
      orderBy: [
        { propertyName: 'asc' },
        { propertyValue: 'asc' },
        { photoType: 'asc' }
      ]
    });

    logger.info('Фото свойств получены', 'admin/property-photos', { count: photos.length });

    return apiSuccess({
      photos,
      count: photos.length
    });

  } catch (error) {
    logger.error('Ошибка получения фото свойств', 'admin/property-photos', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка сервера при получении фото свойств', 500);
  }
}

export const GET = withErrorHandling(
  requireAuthAndPermission(getHandler, 'ADMIN'),
  'admin/property-photos/GET'
);

// POST /api/admin/property-photos - Добавить фото для свойства
async function postHandler(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();
    const {
      categoryId,
      propertyName,
      propertyValue,
      photoPath,
      photoType = 'cover',
      originalFilename,
      fileSize,
      mimeType
    } = body;

    if (!categoryId || !propertyName || !propertyValue || !photoPath) {
      throw new ValidationError('Не указаны обязательные поля: categoryId, propertyName, propertyValue, photoPath');
    }

    logger.info('Добавление фото свойства', 'admin/property-photos', { userId: user.userId, categoryId, propertyName, propertyValue, photoType });

    // Проверяем, есть ли уже фото для этого свойства и типа
    const existingPhoto = await prisma.propertyPhoto.findUnique({
      where: {
        categoryId_propertyName_propertyValue_photoType: {
          categoryId,
          propertyName,
          propertyValue,
          photoType
        }
      }
    });

    let photo;
    if (existingPhoto) {
      // Обновляем существующее фото
      photo = await prisma.propertyPhoto.update({
        where: { id: existingPhoto.id },
        data: {
          photoPath,
          originalFilename,
          fileSize,
          mimeType,
          updatedAt: new Date()
        }
      });
      logger.info('Фото свойства обновлено', 'admin/property-photos', { photoId: photo.id });
    } else {
      // Создаем новое фото
      photo = await prisma.propertyPhoto.create({
        data: {
          categoryId,
          propertyName,
          propertyValue,
          photoPath,
          photoType,
          originalFilename,
          fileSize,
          mimeType
        }
      });
      logger.info('Фото свойства создано', 'admin/property-photos', { photoId: photo.id });
    }

    return apiSuccess({
      photo,
      message: existingPhoto ? 'Фото обновлено' : 'Фото добавлено'
    });

  } catch (error) {
    logger.error('Ошибка добавления фото свойства', 'admin/property-photos', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    if (error instanceof ValidationError) {
      throw error;
    }
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка сервера при добавлении фото свойства', 500);
  }
}

export const POST = withErrorHandling(
  requireAuthAndPermission(postHandler, 'ADMIN'),
  'admin/property-photos/POST'
);

// DELETE /api/admin/property-photos - Удалить фото свойства
async function deleteHandler(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const categoryId = searchParams.get('categoryId');
    const propertyName = searchParams.get('propertyName');
    const propertyValue = searchParams.get('propertyValue');
    const photoType = searchParams.get('photoType');

    logger.info('Удаление фото свойства', 'admin/property-photos', { userId: user.userId, id, categoryId, propertyName, propertyValue, photoType });

    if (id) {
      // Удаляем конкретное фото по ID
      await prisma.propertyPhoto.delete({
        where: { id }
      });
      logger.info('Фото свойства удалено по ID', 'admin/property-photos', { id });
    } else if (categoryId && propertyName && propertyValue) {
      // Удаляем все фото для конкретного свойства
      const where: Record<string, unknown> = {
        categoryId,
        propertyName,
        propertyValue
      };
      
      if (photoType) {
        where.photoType = photoType;
      }

      const result = await prisma.propertyPhoto.deleteMany({
        where
      });
      logger.info('Фото свойств удалены', 'admin/property-photos', { count: result.count });
    } else {
      throw new ValidationError('Не указаны параметры для удаления');
    }

    return apiSuccess({
      message: 'Фото удалено'
    });

  } catch (error) {
    logger.error('Ошибка удаления фото свойства', 'admin/property-photos', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    if (error instanceof ValidationError) {
      throw error;
    }
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка сервера при удалении фото свойства', 500);
  }
}

export const DELETE = withErrorHandling(
  requireAuthAndPermission(deleteHandler, 'ADMIN'),
  'admin/property-photos/DELETE'
);
