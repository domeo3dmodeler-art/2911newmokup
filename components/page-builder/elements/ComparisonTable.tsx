'use client';

import React, { useState, useEffect } from 'react';
import { BaseElement } from '../types';
import { clientLogger } from '@/lib/logging/client-logger';

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  description?: string;
  features: Record<string, any>;
  rating?: number;
  inStock?: boolean;
}

interface ComparisonTableProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

export function ComparisonTable({ element, onUpdate }: ComparisonTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Загрузка товаров
  useEffect(() => {
    const loadProducts = async () => {
      if (!element.props.categoryIds?.length) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/catalog/configurable-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryIds: element.props.categoryIds,
            limit: element.props.limit || 10
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const mockProducts: Product[] = (data.products || []).map((product: any, index: number) => ({
            id: product.id,
            name: product.name,
            price: product.base_price || 15000 + index * 5000,
            image: product.images?.[0]?.url,
            description: product.description,
            features: {
              'Материал': ['МДФ', 'Массив дерева', 'Шпон'][index % 3],
              'Цвет': ['Белый', 'Дуб', 'Орех', 'Вишня'][index % 4],
              'Размер': ['600×2000', '700×2000', '800×2000'][index % 3],
              'Звукоизоляция': index % 2 ? 'Да' : 'Нет',
              'Огнестойкость': index % 3 ? 'Да' : 'Нет',
              'Гарантия': `${2 + (index % 3)} года`,
              'Вес': `${25 + index * 5} кг`,
              'Толщина': `${35 + (index % 3) * 5} мм`
            },
            rating: 4 + (index % 2),
            inStock: true
          }));
          setProducts(mockProducts);
        }
      } catch (error) {
        clientLogger.error('Error loading products', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [element.props.categoryIds, element.props.limit]);

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else if (prev.length < 4) { // Максимум 4 товара для сравнения
        return [...prev, productId];
      }
      return prev;
    });
  };

  const clearSelection = () => {
    setSelectedProducts([]);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
  const allFeatures = Array.from(new Set(
    products.flatMap(p => Object.keys(p.features))
  ));

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка товаров...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4">
      <div className="max-w-7xl mx-auto h-full flex flex-col">
        {/* Компактный заголовок */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {element.props.title || 'Сравнение товаров'}
          </h2>
        </div>

        {/* Выбор товаров для сравнения */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              Выберите товары (до {element.props.maxProducts || 4})
            </h3>
            {selectedProducts.length > 0 && (
              <button
                onClick={clearSelection}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Очистить
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {products.map(product => (
              <div
                key={product.id}
                className={`border rounded-lg p-2 cursor-pointer transition-all ${
                  selectedProducts.includes(product.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleProductSelection(product.id)}
              >
                <div className="aspect-square bg-gray-100 rounded overflow-hidden mb-2">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => {}}
                    className="mr-1 w-3 h-3"
                  />
                  <h4 className="font-medium text-xs truncate">{product.name}</h4>
                </div>
                
                <div className="text-sm font-bold text-blue-600">
                  {product.price.toLocaleString()} ₽
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Таблица сравнения */}
        {selectedProductsData.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">
                      Характеристики
                    </th>
                    {selectedProductsData.map(product => (
                      <th key={product.id} className="px-6 py-4 text-center min-w-48">
                        <div className="space-y-2">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mx-auto w-16 h-16">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-lg font-bold text-blue-600">
                            {product.price.toLocaleString()} ₽
                          </div>
                          {product.rating && (
                            <div className="flex items-center justify-center">
                              {renderStars(product.rating)}
                            </div>
                          )}
                          <button className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                            Выбрать
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {allFeatures.map(feature => (
                    <tr key={feature} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {feature}
                      </td>
                      {selectedProductsData.map(product => (
                        <td key={product.id} className="px-6 py-4 text-sm text-gray-900 text-center">
                          {product.features[feature] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Пустое состояние */}
        {selectedProductsData.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Выберите товары для сравнения</h3>
            <p className="text-gray-600">Отметьте товары выше, чтобы увидеть детальное сравнение характеристик</p>
          </div>
        )}
      </div>
    </div>
  );
}
