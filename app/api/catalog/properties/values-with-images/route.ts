import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryIds = searchParams.get('categoryIds');
    const propertyName = searchParams.get('propertyName');

    if (!categoryIds || !propertyName) {
      return NextResponse.json(
        { success: false, message: 'Не указаны categoryIds или propertyName' },
        { status: 400 }
      );
    }

    const categoryIdsArray = categoryIds.split(',');

    logger.debug('Batch loading property values with images', 'catalog/properties/values-with-images', { propertyName, categoryIds: categoryIdsArray });

    // Получаем все продукты из категории
    const products = await prisma.product.findMany({
      where: {
        catalog_category_id: {
          in: categoryIdsArray
        },
        is_active: true
      },
      select: {
        id: true,
        properties_data: true
      }
    });

    logger.debug('Found products', 'catalog/properties/values-with-images', { productsCount: products.length });

    // Извлекаем уникальные значения для указанного свойства
    const uniqueValues = new Set<string>();
    products.forEach(product => {
      try {
        let propertiesData = product.properties_data;
        
        // Если properties_data - это строка, парсим её как JSON
        if (typeof propertiesData === 'string') {
          propertiesData = JSON.parse(propertiesData);
        }
        
        if (propertiesData && typeof propertiesData === 'object') {
          const propertyValue = (propertiesData as Record<string, unknown>)[propertyName];
          if (propertyValue && typeof propertyValue === 'string') {
            uniqueValues.add(propertyValue);
          }
        }
      } catch (error) {
        logger.warn('Error parsing properties_data for product', 'catalog/properties/values-with-images', { productId: product.id, error: error instanceof Error ? error.message : String(error) });
      }
    });

    const propertyValues = Array.from(uniqueValues);
    logger.debug('Found unique values for property', 'catalog/properties/values-with-images', { propertyName, valuesCount: propertyValues.length });

    // Получаем изображения для всех продуктов сразу
    const productImages = await prisma.productImage.findMany({
      where: {
        product_id: {
          in: products.map(p => p.id)
        },
        is_primary: true
      },
      select: {
        id: true,
        url: true,
        alt_text: true,
        product_id: true
      }
    });

    logger.debug('Found product images', 'catalog/properties/values-with-images', { imagesCount: productImages.length });

    // Группируем изображения по product_id
    interface ProductImage {
      id: string;
      url: string;
      alt_text: string | null;
      product_id: string;
    }
    const imagesByProductId = new Map<string, ProductImage>();
    productImages.forEach(image => {
      imagesByProductId.set(image.product_id, image);
    });

    // Создаем результат с подсчетом товаров и изображениями для каждого значения свойства
    const result = propertyValues.map(propertyValue => {
      // Подсчитываем товары с этим значением свойства
      const productsWithValue = products.filter(product => {
        try {
          let propertiesData = product.properties_data;
          
          // Если properties_data - это строка, парсим её как JSON
          if (typeof propertiesData === 'string') {
            propertiesData = JSON.parse(propertiesData);
          }
          
          if (propertiesData && typeof propertiesData === 'object') {
            const value = (propertiesData as Record<string, unknown>)[propertyName];
            return value === propertyValue;
          }
          return false;
        } catch (error) {
          logger.warn('Error parsing properties_data for product', 'catalog/properties/values-with-images', { productId: product.id, error: error instanceof Error ? error.message : String(error) });
          return false;
        }
      });

      // Получаем первое изображение из товаров с этим значением
      const firstProduct = productsWithValue.find(product => 
        imagesByProductId.has(product.id)
      );
      
      const image = firstProduct ? imagesByProductId.get(firstProduct.id) : null;

      return {
        value: propertyValue,
        count: productsWithValue.length,
        image: image ? {
          url: image.url,
          alt_text: image.alt_text
        } : null
      };
    });

    logger.debug('Batch API returning property values with images', 'catalog/properties/values-with-images', { resultCount: result.length });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error in batch property values with images API', 'catalog/properties/values-with-images', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { success: false, message: 'Ошибка при загрузке данных' },
      { status: 500 }
    );
  }
}
