'use client';

import React, { useState, useEffect } from 'react';
import { clientLogger } from '@/lib/logging/client-logger';

interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  sku: string;
  brand: string;
  model: string;
  image_url?: string;
  properties: Record<string, any>;
}

interface RealProductGridProps {
  categoryIds?: string[];
  limit?: number;
  title?: string;
}

export function RealProductGrid({ 
  categoryIds = [], 
  limit = 6, 
  title = "Товары из каталога" 
}: RealProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        
        if (categoryIds.length > 0) {
          categoryIds.forEach(id => params.append('categoryIds', id));
        }

        const response = await fetch(`/api/catalog/products?${params}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.products) {
          setProducts(data.products);
        } else {
          throw new Error('Неверный формат данных от API');
        }
      } catch (err) {
        clientLogger.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Ошибка загрузки товаров');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryIds, limit]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Загружаем товары...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">⚠️ Ошибка загрузки</div>
          <div className="text-sm text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="text-center py-8 text-gray-500">
          Товары не найдены
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="aspect-w-16 aspect-h-9 mb-3">
              <img 
                src={product.image_url || '/placeholder-product.jpg'} 
                alt={product.name}
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                }}
              />
            </div>
            
            <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
              {product.name || 'Без названия'}
            </h3>
            
            {product.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {product.description}
              </p>
            )}
            
            <div className="flex justify-between items-center mb-3">
              <div className="text-lg font-bold text-blue-600">
                {product.base_price ? `${product.base_price.toLocaleString()} ₽` : 'Цена не указана'}
              </div>
              {product.sku && (
                <div className="text-xs text-gray-500">
                  {product.sku}
                </div>
              )}
            </div>
            
            {product.brand && (
              <div className="text-sm text-gray-500 mb-2">
                Бренд: {product.brand}
              </div>
            )}
            
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              Подробнее
            </button>
          </div>
        ))}
      </div>
      
      {products.length === limit && (
        <div className="text-center mt-6">
          <button className="text-blue-600 hover:text-blue-800 font-medium">
            Показать больше товаров
          </button>
        </div>
      )}
    </div>
  );
}

