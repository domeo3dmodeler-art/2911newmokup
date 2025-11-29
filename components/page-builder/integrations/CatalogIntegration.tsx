'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CatalogCategory, ProductProperty, Product } from '../types';
import { clientLogger } from '@/lib/logging/client-logger';

interface CatalogIntegrationProps {
  onCategoriesLoaded: (categories: CatalogCategory[]) => void;
  onPropertiesLoaded: (properties: ProductProperty[]) => void;
  onProductsLoaded: (products: Product[]) => void;
  selectedCategoryIds: string[];
  onCategorySelectionChange: (categoryIds: string[]) => void;
}

export function CatalogIntegration({
  onCategoriesLoaded,
  onPropertiesLoaded,
  onProductsLoaded,
  selectedCategoryIds,
  onCategorySelectionChange
}: CatalogIntegrationProps) {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [properties, setProperties] = useState<ProductProperty[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка категорий каталога
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/catalog/categories');
      const data = await response.json();
      
      if (data.success) {
        setCategories(data.categories || []);
        onCategoriesLoaded(data.categories || []);
      } else {
        setError(data.message || 'Ошибка загрузки категорий');
      }
    } catch (error) {
      clientLogger.error('Error loading categories:', error);
      setError('Ошибка загрузки категорий');
    } finally {
      setLoading(false);
    }
  }, [onCategoriesLoaded]);

  // Загрузка свойств товаров
  const loadProperties = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/catalog/properties');
      const data = await response.json();
      
      if (data.success) {
        setProperties(data.properties || []);
        onPropertiesLoaded(data.properties || []);
      } else {
        setError(data.message || 'Ошибка загрузки свойств');
      }
    } catch (error) {
      clientLogger.error('Error loading properties:', error);
      setError('Ошибка загрузки свойств');
    } finally {
      setLoading(false);
    }
  }, [onPropertiesLoaded]);

  // Загрузка товаров для выбранных категорий
  const loadProducts = useCallback(async () => {
    if (selectedCategoryIds.length === 0) {
      setProducts([]);
      onProductsLoaded([]);
      return;
    }

    try {
      setLoading(true);
      const queryParams = selectedCategoryIds
        .map(id => `categoryIds=${encodeURIComponent(id)}`)
        .join('&');
      
      const response = await fetch(`/api/catalog/products?${queryParams}`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products || []);
        onProductsLoaded(data.products || []);
      } else {
        setError(data.message || 'Ошибка загрузки товаров');
      }
    } catch (error) {
      clientLogger.error('Error loading products:', error);
      setError('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryIds, onProductsLoaded]);

  // Загрузка данных при монтировании
  useEffect(() => {
    loadCategories();
    loadProperties();
  }, [loadCategories, loadProperties]);

  // Загрузка товаров при изменении выбранных категорий
  useEffect(() => {
    loadProducts();
  }, [selectedCategoryIds, loadProducts]);

  // Обработчик выбора категории
  const handleCategoryToggle = (categoryId: string) => {
    const newSelection = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter(id => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    
    onCategorySelectionChange(newSelection);
  };

  // Обработчик выбора всех категорий
  const handleSelectAll = () => {
    const allCategoryIds = categories.map(cat => cat.id);
    onCategorySelectionChange(allCategoryIds);
  };

  // Обработчик сброса выбора
  const handleClearSelection = () => {
    onCategorySelectionChange([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Интеграция с каталогом</h3>
        {loading && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Загрузка...</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-600">{error}</span>
          </div>
        </div>
      )}

      {/* Category Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Категории товаров</h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSelectAll}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Выбрать все
            </button>
            <button
              onClick={handleClearSelection}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Сбросить
            </button>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
          {categories.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="text-2xl mb-2">📁</div>
              <p className="text-sm">Категории не найдены</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {category.name}
                      </span>
                      {category.products_count > 0 && (
                        <span className="text-xs text-gray-500">
                          ({category.products_count} товаров)
                        </span>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Categories Summary */}
      {selectedCategoryIds.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-blue-900">
              Выбрано категорий: {selectedCategoryIds.length}
            </span>
          </div>
          
          <div className="text-xs text-blue-700">
            {selectedCategoryIds.map(id => {
              const category = categories.find(cat => cat.id === id);
              return category?.name;
            }).filter(Boolean).join(', ')}
          </div>
        </div>
      )}

      {/* Properties Preview */}
      {properties.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Свойства товаров ({properties.length})
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {properties.slice(0, 6).map((property) => (
              <div
                key={property.id}
                className="p-2 bg-gray-50 rounded text-xs"
              >
                <div className="font-medium text-gray-900">{property.name}</div>
                <div className="text-gray-500">{property.type}</div>
                {property.is_for_calculator && (
                  <span className="inline-block mt-1 px-1 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                    Калькулятор
                  </span>
                )}
              </div>
            ))}
            {properties.length > 6 && (
              <div className="p-2 bg-gray-100 rounded text-xs text-gray-500 flex items-center justify-center">
                +{properties.length - 6} еще
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Preview */}
      {products.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Товары ({products.length})
          </h4>
          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
            {products.slice(0, 5).map((product) => (
              <div
                key={product.id}
                className="flex items-center space-x-2 p-2 bg-gray-50 rounded text-xs"
              >
                {product.images.length > 0 && (
                  <img
                    src={product.images[0].url}
                    alt={product.name}
                    className="w-8 h-8 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {product.name}
                  </div>
                  <div className="text-gray-500">
                    {product.base_price} {product.currency}
                  </div>
                </div>
              </div>
            ))}
            {products.length > 5 && (
              <div className="p-2 bg-gray-100 rounded text-xs text-gray-500 text-center">
                +{products.length - 5} товаров еще
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
