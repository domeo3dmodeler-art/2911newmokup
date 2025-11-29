import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

interface ProductWithProperties {
  id: string;
  sku: string;
  name: string;
  properties_data: string | Record<string, unknown> | null;
  images: Array<{
    url: string;
    alt_text: string | null;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const categoryIds = url.searchParams.getAll('categoryIds');
    const propertyName = url.searchParams.get('propertyName');

    if (!categoryIds || categoryIds.length === 0) {
      return NextResponse.json(
        { error: 'Category IDs are required' },
        { status: 400 }
      );
    }

    if (!propertyName) {
      return NextResponse.json(
        { error: 'Property name is required' },
        { status: 400 }
      );
    }

    logger.debug('Loading property values with counts and images', 'catalog/properties/values-with-data', { propertyName, categoryIds });

    // Загружаем все товары из указанных категорий
    const products = await prisma.product.findMany({
      where: {
        catalog_category_id: {
          in: categoryIds
        },
        is_active: true
      },
      select: {
        id: true,
        sku: true,
        name: true,
        properties_data: true,
        images: {
          where: {
            is_primary: true
          },
          select: {
            url: true,
            alt_text: true
          }
        }
      }
    });

    logger.debug('Found products to analyze', 'catalog/properties/values-with-data', { productsCount: products.length, categoryIds });

    // Группируем товары по значениям свойства
    const valueGroups: { [key: string]: { count: number, image: string | null } } = {};
    
    products.forEach((product: ProductWithProperties) => {
      if (product.properties_data) {
        try {
          const props = typeof product.properties_data === 'string' 
            ? JSON.parse(product.properties_data) 
            : product.properties_data;
          
          const value = props[propertyName];
          if (value && typeof value === 'string' && value.trim()) {
            const trimmedValue = value.trim();
            
            if (!valueGroups[trimmedValue]) {
              valueGroups[trimmedValue] = { count: 0, image: null };
            }
            
            valueGroups[trimmedValue].count++;
            
            // Берем первое изображение для этого значения
            if (!valueGroups[trimmedValue].image && product.images.length > 0) {
              valueGroups[trimmedValue].image = product.images[0].url;
            }
          }
        } catch (error) {
          logger.warn('Error parsing properties for product', 'catalog/properties/values-with-data', { productId: product.id, error: error instanceof Error ? error.message : String(error) });
        }
      }
    });

    logger.debug('Found unique values', 'catalog/properties/values-with-data', { uniqueValuesCount: Object.keys(valueGroups).length, propertyName });

    return NextResponse.json({
      success: true,
      values: valueGroups,
      totalProducts: products.length
    });

  } catch (error) {
    logger.error('Error loading property values with counts and images', 'catalog/properties/values-with-data', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { success: false, message: 'Ошибка при загрузке значений свойства с количеством и изображениями' },
      { status: 500 }
    );
  }
}
