import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

export async function GET() {
  try {
    logger.info('Тест подключения к БД', 'test-db/GET', {});
    
    // Проверяем DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    logger.debug('DATABASE_URL настроен', 'test-db/GET', { 
      hasUrl: !!dbUrl,
      urlPreview: dbUrl ? `${dbUrl.substring(0, 20)}...` : 'не задан'
    });
    
    // Тест подключения
    logger.info('Подключение к БД...', 'test-db/GET', {});
    await prisma.$connect();
    logger.info('Подключение успешно', 'test-db/GET', {});
    
    // Простой запрос
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.catalogCategory.count();
    
    // Проверка категории "Межкомнатные двери"
    const doorsCategory = await prisma.catalogCategory.findFirst({
      where: { name: "Межкомнатные двери" }
    });
    
    logger.info('Данные получены', 'test-db/GET', { 
      productCount, 
      categoryCount,
      doorsCategoryFound: !!doorsCategory
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connected successfully',
      databaseUrl: dbUrl ? `${dbUrl.substring(0, 30)}...` : 'не задан',
      counts: {
        products: productCount,
        categories: categoryCount
      },
      doorsCategory: doorsCategory ? {
        id: doorsCategory.id,
        name: doorsCategory.name
      } : null
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'UNKNOWN_ERROR';
    const errorMeta = error && typeof error === 'object' && 'meta' in error && typeof error.meta === 'object' ? error.meta : {};
    
    logger.error('Ошибка подключения к БД', 'test-db/GET', { 
      error: errorMessage,
      code: errorCode,
      meta: errorMeta,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      success: false,
      error: errorMessage,
      code: errorCode,
      meta: errorMeta,
      hint: errorCode === 'P1001' ? 'База данных недоступна. Проверьте SSH туннель.' :
            errorCode === 'P1017' ? 'Сервер закрыл соединение. Проверьте SSH туннель и DATABASE_URL.' :
            'Проверьте SSH туннель и DATABASE_URL в .env.local'
    }, { status: 500 });
  }
}

