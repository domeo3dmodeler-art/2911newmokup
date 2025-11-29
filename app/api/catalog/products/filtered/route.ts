import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryIds = searchParams.getAll('categoryIds');
    const propertyName = searchParams.get('propertyName');
    const filtersParam = searchParams.get('filters');

    if (!categoryIds.length) {
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

    logger.debug('Loading filtered products for property', 'catalog/products/filtered', { propertyName, categoryIds });
    
    let filters = {};
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam);
        logger.debug('Applied filters', 'catalog/products/filtered', { filters });
      } catch (error) {
        logger.warn('Error parsing filters', 'catalog/products/filtered', { error: error instanceof Error ? error.message : String(error) });
      }
    }

    // Загружаем товары с учетом фильтров
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
        properties_data: true
      }
    });

    logger.debug('Found products', 'catalog/products/filtered', { productsCount: products.length });

    // Фильтруем товары по значениям свойств
    const filteredProducts = products.filter(product => {
      if (!product.properties_data) return false;
      
      try {
        const props = typeof product.properties_data === 'string' 
          ? JSON.parse(product.properties_data) 
          : product.properties_data;
        
        // Проверяем все фильтры
        for (const [filterPropertyName, filterValue] of Object.entries(filters)) {
          if (props[filterPropertyName] !== filterValue) {
            return false;
          }
        }
        
        // Проверяем, что у товара есть нужное свойство
        return props.hasOwnProperty(propertyName);
      } catch (error) {
        logger.warn('Error parsing properties for product', 'catalog/products/filtered', { productId: product.id, error: error instanceof Error ? error.message : String(error) });
        return false;
      }
    });

    logger.debug('Found products matching filters', 'catalog/products/filtered', { filteredProductsCount: filteredProducts.length });

    // Извлекаем уникальные значения нужного свойства
    const uniqueValues = new Set<string>();
    
    for (const product of filteredProducts) {
      if (product.properties_data) {
        try {
          const props = typeof product.properties_data === 'string' 
            ? JSON.parse(product.properties_data) 
            : product.properties_data;
          
          const value = props[propertyName];
          if (value && typeof value === 'string' && value.trim()) {
            uniqueValues.add(value.trim());
          }
        } catch (error) {
          logger.warn('Error parsing properties for product', 'catalog/products/filtered', { productId: product.id, error: error instanceof Error ? error.message : String(error) });
        }
      }
    }

    const result = Array.from(uniqueValues).sort();

    logger.debug('Found unique values for property', 'catalog/products/filtered', { propertyName, valuesCount: result.length });

    return NextResponse.json({
      success: true,
      uniqueValues: {
        [propertyName]: result
      },
      totalProducts: filteredProducts.length,
      filters
    });

  } catch (error) {
    logger.error('Error loading filtered products', 'catalog/products/filtered', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
