import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { logger } from '../../../../lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    const { categoryIds, limit = 6 } = await request.json();

    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: 'Category IDs are required' },
        { status: 400 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        catalog_category_id: { in: categoryIds },
        is_active: true
      },
        include: {
          images: {
            select: {
              id: true,
              url: true,
              alt_text: true,
              is_primary: true,
              sort_order: true
            },
            orderBy: {
              sort_order: 'asc'
            }
          },
          catalog_category: true
        },
        take: limit
      });

    // Преобразуем товары в формат конфигурируемых товаров
    const configurableProducts = products.map(product => {
      // Парсим properties_data для получения изображений
      let productImages = product.images || [];
      
      try {
        if (product.properties_data) {
          const propertiesData = typeof product.properties_data === 'string' 
            ? JSON.parse(product.properties_data) 
            : product.properties_data;
          
          // Извлекаем изображения из properties_data
          if (propertiesData && typeof propertiesData === 'object' && 'photos' in propertiesData && Array.isArray(propertiesData.photos)) {
            productImages = propertiesData.photos.map((photoUrl: string) => ({
              id: `temp_${Math.random()}`,
              url: photoUrl,
              alt_text: product.name,
              is_primary: true,
              sort_order: 0
            }));
          }
        }
      } catch (error) {
        logger.error('Error parsing properties_data', 'catalog/configurable-products', { productId: product.id, error: error instanceof Error ? error.message : String(error) });
      }

      return {
        id: product.id,
        name: product.name,
        description: product.description || '',
        basePrice: product.base_price || 0,
        images: productImages,
        variants: [],
        configurableProperties: [
          {
            id: 'color',
            name: 'Цвет',
            type: 'color',
            options: [
              { value: '#ffffff', label: 'Белый', priceModifier: 0 },
              { value: '#000000', label: 'Черный', priceModifier: 0 },
              { value: '#8b4513', label: 'Коричневый', priceModifier: 500 },
              { value: '#c0c0c0', label: 'Серебристый', priceModifier: 1000 }
            ]
          },
          {
            id: 'size',
            name: 'Размер',
            type: 'select',
            options: [
              { value: 'small', label: 'Маленький', priceModifier: -500 },
              { value: 'medium', label: 'Средний', priceModifier: 0 },
              { value: 'large', label: 'Большой', priceModifier: 800 },
              { value: 'xlarge', label: 'Очень большой', priceModifier: 1500 }
            ]
          },
          {
            id: 'material',
            name: 'Материал',
            type: 'select',
            options: [
              { value: 'wood', label: 'Дерево', priceModifier: 0 },
              { value: 'metal', label: 'Металл', priceModifier: 1000 },
              { value: 'plastic', label: 'Пластик', priceModifier: -300 },
              { value: 'glass', label: 'Стекло', priceModifier: 800 }
            ]
          }
        ]
      };
    });

    return NextResponse.json({
      success: true,
      products: configurableProducts
    });

  } catch (error) {
    logger.error('Error fetching configurable products', 'catalog/configurable-products', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
