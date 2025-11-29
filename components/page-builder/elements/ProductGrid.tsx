'use client';

import React, { useState, useEffect } from 'react';
import { BaseElement } from '../types';
import { clientLogger } from '@/lib/logging/client-logger';

interface Product {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  images: Array<{
    id: string;
    url: string;
    alt_text?: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  properties_data: Record<string, any>;
  catalog_category_id: string;
  sku: string;
}

interface ProductGridProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

export function ProductGrid({ element, onUpdate }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка товаров из каталога
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const categoryIds = element.props.categoryIds || [];
        const limit = element.props.limit || 12;
        const offset = element.props.offset || 0;

        // Если категории не выбраны, загружаем все товары
        const url = categoryIds.length > 0 
          ? `/api/catalog/products?categoryIds=${categoryIds.join(',')}&limit=${limit}&offset=${offset}`
          : `/api/catalog/products?limit=${limit}&offset=${offset}`;

        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Ошибка загрузки товаров');
        }

        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        clientLogger.error('Error loading products:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [element.props.categoryIds, element.props.limit, element.props.offset]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getProductImage = (product: Product) => {
    if (product.images && product.images.length > 0) {
      const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
      return primaryImage.url;
    }
    return '/uploads/products/default/1759160720296_58vgf7nva1s.png';
  };

  const getProductProperties = (product: Product) => {
    const properties = [];
    if (product.properties_data) {
      Object.entries(product.properties_data).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value.trim()) {
          properties.push({ key, value });
        }
      });
    }
    return properties.slice(0, 3); // Показываем только первые 3 свойства
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка товаров...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-400 mr-3">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">Ошибка загрузки товаров</h3>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-4">📦</div>
          <h3 className="text-gray-600 font-medium mb-2">Товары не найдены</h3>
          <p className="text-gray-500 text-sm">
            {element.props.categoryIds?.length > 0 
              ? 'В выбранных категориях нет товаров'
              : 'Добавьте товары в каталог или выберите категории'
            }
          </p>
        </div>
      </div>
    );
  }

  const gridCols = element.props.columns || 4;
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }[gridCols] || 'grid-cols-4';

  return (
    <div className="w-full">
      {/* Заголовок секции */}
      {element.props.title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{element.props.title}</h2>
          {element.props.subtitle && (
            <p className="text-gray-600 mt-2">{element.props.subtitle}</p>
          )}
        </div>
      )}

      {/* Сетка товаров */}
      <div className={`grid ${gridClass} gap-6`}>
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
            {/* Изображение товара */}
            <div className="relative aspect-square overflow-hidden">
              <img
                src={getProductImage(product)}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/uploads/products/default/1759160720296_58vgf7nva1s.png';
                }}
              />
              {element.props.showBadges && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  {product.sku}
                </div>
              )}
            </div>

            {/* Информация о товаре */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
                {product.name}
              </h3>

              {/* Свойства товара */}
              {element.props.showProperties && (
                <div className="space-y-1 mb-3">
                  {getProductProperties(product).map((prop, index) => (
                    <div key={index} className="text-xs text-gray-600">
                      <span className="font-medium">{prop.key}:</span> {prop.value}
                    </div>
                  ))}
                </div>
              )}

              {/* Описание */}
              {element.props.showDescription && product.description && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {product.description}
                </p>
              )}

              {/* Цена и кнопка */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatPrice(product.base_price)}
                  </div>
                  {element.props.showSku && (
                    <div className="text-xs text-gray-500">Арт: {product.sku}</div>
                  )}
                </div>
                
                <button className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 transition-colors">
                  В корзину
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Информация о загрузке */}
      <div className="mt-4 text-center text-sm text-gray-500">
        Показано {products.length} товаров
        {element.props.categoryIds?.length > 0 && (
          <span> из выбранных категорий</span>
        )}
      </div>
    </div>
  );
}

