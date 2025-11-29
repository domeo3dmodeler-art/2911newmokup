import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';
import { getLoggingContextFromRequest } from '@/lib/auth/logging-context';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { NotFoundError, ValidationError } from '@/lib/api/errors';
import { requireAuth } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';

// GET /api/catalog/doors/sku-to-selection - Получить информацию о продукте по SKU
async function getHandler(
  req: NextRequest,
  user: ReturnType<typeof getAuthenticatedUser>
): Promise<NextResponse> {
  const loggingContext = getLoggingContextFromRequest(req);
  const { searchParams } = new URL(req.url);
  const sku = searchParams.get('sku');
  
  if (!sku) {
    return apiSuccess({
      message: "API для получения информации о продукте по SKU",
      usage: "Используйте GET запрос с параметром sku или POST запрос с телом { sku: 'SKU_CODE' }",
      example: {
        method: "GET",
        url: "/api/catalog/doors/sku-to-selection?sku=SKU_CODE"
      }
    });
  }

  // Ищем продукт по SKU в базе данных
  const product = await prisma.product.findUnique({
    where: { sku },
    select: {
      id: true,
      sku: true,
      name: true,
      model: true,
      series: true,
      brand: true,
      base_price: true,
      properties_data: true
    }
  });

  if (!product) {
    return apiError(
      ApiErrorCode.NOT_FOUND,
      'Продукт не найден',
      404
    );
  }

  // Парсим свойства продукта
  const properties = product.properties_data ? 
    (typeof product.properties_data === 'string' ? JSON.parse(product.properties_data) : product.properties_data) : {};

  // Возвращаем данные для предзаполнения формы
  const selection = {
    style: properties.style || product.series || "Классика",
    model: product.model || product.series || "Стандарт",
    finish: properties.finish || "Эмаль",
    color: properties.color || "Белый",
    type: properties.type || "Глухая",
    width: properties.width || 800,
    height: properties.height || 2000
  };

  return apiSuccess({
    product: {
      id: product.id,
      sku: product.sku,
      name: product.name,
      model: product.model,
      series: product.series,
      brand: product.brand,
      base_price: product.base_price
    },
    selection
  });
}

export const GET = withErrorHandling(
  requireAuth(getHandler),
  'catalog/doors/sku-to-selection/GET'
);

export async function POST(
  req: NextRequest,
  user: ReturnType<typeof getAuthenticatedUser>
): Promise<NextResponse> {
  return withErrorHandling(
    requireAuth(async (request, user) => {
      const loggingContext = getLoggingContextFromRequest(request);
      const body = await request.json();
      const { sku } = body;

      if (!sku) {
        throw new ValidationError('SKU не предоставлен');
      }

      // Ищем продукт по SKU в базе данных
      const product = await prisma.product.findUnique({
        where: { sku },
        select: {
          id: true,
          sku: true,
          name: true,
          model: true,
          series: true,
          brand: true,
          base_price: true,
          properties_data: true
        }
      });

      if (!product) {
        throw new NotFoundError('Продукт', sku);
      }

      // Парсим свойства продукта
      const properties = product.properties_data ? 
        (typeof product.properties_data === 'string' ? JSON.parse(product.properties_data) : product.properties_data) : {};

      // Возвращаем данные для предзаполнения формы
      const selection = {
        style: properties.style || product.series || "Классика",
        model: product.model || product.series || "Стандарт",
        finish: properties.finish || "Эмаль",
        color: properties.color || "Белый",
        type: properties.type || "Глухая",
        width: properties.width || 800,
        height: properties.height || 2000
      };

      return apiSuccess({ selection });
    }),
    'catalog/doors/sku-to-selection/POST'
  )(req);
}