import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';
import { getLoggingContextFromRequest } from '@/lib/auth/logging-context';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { NotFoundError } from '@/lib/api/errors';

// GET /api/price/doors - Получить базовую информацию о ценах
async function getHandler(
  req: NextRequest
): Promise<NextResponse> {
  const loggingContext = getLoggingContextFromRequest(req);
  const { searchParams } = new URL(req.url);
  const model = searchParams.get('model');
  
  if (!model) {
    return apiSuccess({
      message: "API для расчета цен дверей",
      usage: "Используйте POST запрос с данными selection для расчета цены",
      example: {
        method: "POST",
        body: {
          selection: {
            model: "Классика",
            hardware_kit: { id: "KIT_STD" },
            handle: { id: "HNDL_PRO" }
          }
        }
      }
    });
  }

  // Если передан model, возвращаем базовую информацию
  const product = await prisma.product.findFirst({
    where: { model },
    select: {
      id: true,
      sku: true,
      name: true,
      model: true,
      series: true,
      base_price: true
    }
  });

  if (!product) {
    throw new NotFoundError('Продукт', model);
  }

  return apiSuccess({
    product: {
      id: product.id,
      sku: product.sku,
      name: product.name,
      model: product.model,
      series: product.series,
      base_price: product.base_price
    },
    message: "Для полного расчета цены используйте POST запрос"
  });
}

// Публичный API - расчет цен доступен всем
export const GET = withErrorHandling(
  getHandler,
  'price/doors/GET'
);

// POST /api/price/doors - Расчет цены дверей
async function postHandler(
  req: NextRequest
): Promise<NextResponse> {
  const loggingContext = getLoggingContextFromRequest(req);
  let body: unknown;
  try {
    body = await req.json();
  } catch (jsonError) {
    logger.error('Ошибка парсинга JSON в price/doors', 'price/doors', jsonError instanceof Error ? { error: jsonError.message, stack: jsonError.stack } : { error: String(jsonError) }, loggingContext);
    return apiError(
      ApiErrorCode.VALIDATION_ERROR,
      'Некорректный формат JSON в теле запроса',
      400
    );
  }
  
  logger.debug('Расчет цены дверей', 'price/doors', {
    bodyType: typeof body,
    hasSelection: !!body?.selection
  }, loggingContext);
  
  // Данные могут приходить напрямую в body или в поле selection
  const selection = body?.selection || body;
  
  logger.debug('Извлеченные данные selection', 'price/doors', {
    style: selection?.style,
    model: selection?.model,
    finish: selection?.finish,
    color: selection?.color,
    width: selection?.width,
    height: selection?.height,
    hardware_kit: selection?.hardware_kit,
    handle: selection?.handle
  }, loggingContext);

  if (!selection) {
    logger.error('Selection is undefined or null', 'price/doors', {}, loggingContext);
    return apiError(
      ApiErrorCode.VALIDATION_ERROR,
      'Данные для расчета не предоставлены',
      400
    );
  }

  try {
    // Проверяем подключение к БД
    await prisma.$connect();

    // Ищем продукт в базе данных по всем параметрам
    const products = await prisma.product.findMany({
      where: {
        catalog_category: {
          name: "Межкомнатные двери"
        }
      },
      select: {
        id: true,
        sku: true,
        name: true,
        model: true,
        series: true,
        base_price: true,
        properties_data: true
      },
      orderBy: {
        id: 'asc'
      }
    });

  // Фильтруем товары по выбранным параметрам
  const matchingProducts = products.filter(p => {
    const properties = p.properties_data ? 
      (typeof p.properties_data === 'string' ? JSON.parse(p.properties_data) : p.properties_data) : {};

    // Сначала ищем по стилю и модели
    const styleMatch = !selection.style || properties['Domeo_Стиль Web'] === selection.style;
    
    // Ищем по полному названию модели (как в калькуляторе)
    const modelMatch = !selection.model || properties['Domeo_Название модели для Web'] === selection.model;
    
    if (!styleMatch || !modelMatch) {
      return false;
    }

    // Затем по остальным параметрам
    const finishMatch = !selection.finish || properties['Тип покрытия'] === selection.finish;
    const colorMatch = !selection.color || properties['Domeo_Цвет'] === selection.color;
    const typeMatch = !selection.type || properties['Тип конструкции'] === selection.type;
    const widthMatch = !selection.width || properties['Ширина/мм'] == selection.width;
    const heightMatch = !selection.height || properties['Высота/мм'] == selection.height;
    
    logger.debug('Фильтр товара', 'price/doors', {
      productId: p.id,
      styleMatch,
      modelMatch,
      finishMatch,
      colorMatch,
      typeMatch,
      widthMatch,
      heightMatch,
      requestedModel: selection.model,
      actualModelName: properties['Domeo_Название модели для Web'],
      actualSupplierSku: properties['Артикул поставщика'],
      requestedFinish: selection.finish,
      actualFinish: properties['Тип покрытия'],
      requestedColor: selection.color,
      actualColor: properties['Domeo_Цвет'],
      requestedWidth: selection.width,
      actualWidth: properties['Ширина/мм'],
      requestedHeight: selection.height,
      actualHeight: properties['Высота/мм']
    }, loggingContext);
    
    return finishMatch && colorMatch && typeMatch && widthMatch && heightMatch;
  });

  logger.debug(`Найдено ${matchingProducts.length} подходящих товаров`, 'price/doors', {
    count: matchingProducts.length
  }, loggingContext);

  // Если товары не найдены, возвращаем ошибку
  if (matchingProducts.length === 0) {
    logger.warn('Точный товар не найден для параметров', 'price/doors', {
      style: selection.style,
      model: selection.model,
      finish: selection.finish,
      color: selection.color,
      width: selection.width,
      height: selection.height
    }, loggingContext);
    
    throw new NotFoundError('Товар с указанными параметрами', JSON.stringify(selection));
  }

  // Выбираем товар с МАКСИМАЛЬНОЙ ценой (временно)
  const product = matchingProducts.reduce((maxProduct, currentProduct) => {
    const maxProps = maxProduct.properties_data ? 
      (typeof maxProduct.properties_data === 'string' ? JSON.parse(maxProduct.properties_data) : maxProduct.properties_data) : {};
    const currentProps = currentProduct.properties_data ? 
      (typeof currentProduct.properties_data === 'string' ? JSON.parse(currentProduct.properties_data) : currentProduct.properties_data) : {};
    
    const maxPrice = parseFloat(maxProps['Цена РРЦ']) || maxProduct.base_price || 0;
    const currentPrice = parseFloat(currentProps['Цена РРЦ']) || currentProduct.base_price || 0;
    
    logger.debug(`Сравниваем цены`, 'price/doors', {
      sku1: maxProduct.sku,
      price1: maxPrice,
      sku2: currentProduct.sku,
      price2: currentPrice
    }, loggingContext);
    
    return currentPrice > maxPrice ? currentProduct : maxProduct;
  }, matchingProducts[0]);
  
  const finalProduct = product;

  // Парсим свойства продукта
  const properties = finalProduct.properties_data ? 
    (typeof finalProduct.properties_data === 'string' ? JSON.parse(finalProduct.properties_data) : finalProduct.properties_data) : {};

  // Рассчитываем цену из цены РРЦ товара
  const rrcPrice = parseFloat(properties['Цена РРЦ']) || 0;
  const basePrice = finalProduct.base_price || 0;
  let doorPrice = rrcPrice || basePrice;
  
  logger.debug('Расчет цены', 'price/doors', {
    productId: finalProduct.id,
    rrcPrice,
    basePrice,
    finalDoorPrice: doorPrice,
    rrcPriceExists: !!properties['Цена РРЦ']
  }, loggingContext);
  
  let total = doorPrice;
  const breakdown = [
    { label: "Дверь", amount: doorPrice }
  ];

  // Добавляем комплект фурнитуры если выбран
  if (selection.hardware_kit?.id) {
    logger.debug('Выбран комплект фурнитуры', 'price/doors', {
      kitId: selection.hardware_kit.id
    }, loggingContext);
    
    // Получаем комплекты фурнитуры из базы данных
    const hardwareKits = await prisma.product.findMany({
      where: {
        catalog_category: {
          name: "Комплекты фурнитуры"
        }
      },
      select: {
        id: true,
        name: true,
        properties_data: true
      }
    });

    logger.debug('Доступные комплекты фурнитуры', 'price/doors', {
      count: hardwareKits.length
    }, loggingContext);
    
    const kit = hardwareKits.find(k => k.id === selection.hardware_kit.id);
    
    if (kit) {
      const kitProps = kit.properties_data ? 
        (typeof kit.properties_data === 'string' ? JSON.parse(kit.properties_data) : kit.properties_data) : {};
      
      const kitPrice = parseFloat(kitProps['Группа_цена']) || 0;
      logger.debug('Цена комплекта', 'price/doors', { kitPrice }, loggingContext);
      total += kitPrice;
      breakdown.push({ 
        label: `Комплект: ${kitProps['Наименование для Web'] || kit.name}`, 
        amount: kitPrice 
      });
    }
  }

  // Добавляем ручку если выбрана
  if (selection.handle?.id) {
    logger.debug('Выбрана ручка', 'price/doors', {
      handleId: selection.handle.id
    }, loggingContext);
    
    // Получаем ручки из базы данных
    const handles = await prisma.product.findMany({
      where: {
        catalog_category: {
          name: "Ручки"
        }
      },
      select: {
        id: true,
        name: true,
        properties_data: true
      }
    });

    logger.debug('Доступные ручки', 'price/doors', {
      count: handles.length
    }, loggingContext);
    
    const handle = handles.find(h => h.id === selection.handle.id);
    
    if (handle) {
      const handleProps = handle.properties_data ? 
        (typeof handle.properties_data === 'string' ? JSON.parse(handle.properties_data) : handle.properties_data) : {};
      
      const handlePrice = parseFloat(handleProps['Domeo_цена группы Web']) || 0;
      logger.debug('Цена ручки', 'price/doors', { handlePrice }, loggingContext);
      total += handlePrice;
      breakdown.push({ 
        label: `Ручка: ${handleProps['Domeo_наименование ручки_1С'] || handle.name}`, 
        amount: handlePrice 
      });
    }
  }

    const result = {
      currency: "RUB",
      base: doorPrice,
      breakdown,
      total: Math.round(total),
      sku: finalProduct.sku
    };
    
    return apiSuccess(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined;
    
    logger.error('Error calculating price', 'price/doors/POST', { 
      error: errorMessage,
      code: errorCode,
      stack: error instanceof Error ? error.stack : undefined
    }, loggingContext);
    
    // В development возвращаем детали ошибки
    if (process.env.NODE_ENV === 'development') {
      return apiError(
        ApiErrorCode.INTERNAL_SERVER_ERROR,
        'Ошибка при расчете цены',
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

// Публичный API - расчет цен доступен всем
export const POST = withErrorHandling(
  postHandler,
  'price/doors/POST'
);
