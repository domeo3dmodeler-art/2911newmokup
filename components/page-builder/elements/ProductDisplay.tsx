'use client';

import React, { useState, useEffect } from 'react';
import { BaseElement } from '../types';
import { extractUniquePropertyValues } from '@/lib/string-utils';
import { shouldShowFilters } from '@/lib/display-mode';
import { FiltersPlaceholder } from './PlaceholderContent';
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
  properties_data: Record<string, unknown>;
  catalog_category_id: string;
  sku: string;
}

interface ProductDisplayProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

export function ProductDisplay({ element, onUpdate }: ProductDisplayProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [propertyFilters, setPropertyFilters] = useState<Record<string, unknown>>({});
  const [availableProperties, setAvailableProperties] = useState<Array<{ id: string; name: string; options?: Array<{ value: unknown; label: string }>; [key: string]: unknown }>>([]);

  // Получение настроек отображения для свойства
  const getPropertyDisplaySettings = (propertyId: string) => {
    return element.props.propertyDisplaySettings?.[propertyId] || { displayType: 'input' };
  };

  // Загрузка свойств для фильтров
  useEffect(() => {
    const loadProperties = async () => {
      if (!element.props.selectedPropertyIds?.length) return;
      
      try {
        // Загружаем свойства
        const propertiesResponse = await fetch('/api/catalog/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryIds: element.props.categoryIds
          })
        });
        
        if (propertiesResponse.ok) {
          const propertiesData = await propertiesResponse.json();
          const filteredProperties = propertiesData.properties?.filter((prop: { id: string; name: string; [key: string]: unknown }) => 
            element.props.selectedPropertyIds.includes(prop.id)
          ) || [];
          
          // Загружаем товары для получения реальных значений свойств
          const categoryId = element.props.categoryIds?.[0]; // Берем первую категорию
          const productsResponse = await fetch(`/api/catalog/products?categoryId=${categoryId}&limit=100`);
          
          if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            const products = productsData.products || [];
            
            // Извлекаем уникальные значения для каждого свойства
            const propertiesWithOptions = await Promise.all(
              filteredProperties.map(async (property: { id: string; name: string; [key: string]: unknown }) => {
                const options = await extractUniquePropertyValues(products, property.name);
                clientLogger.debug(`Property "${property.name}": found ${options.length} unique values:`, options.map(o => o.value));
                
                return {
                  ...property,
                  options: options
                };
              })
            );
            
            setAvailableProperties(propertiesWithOptions);
          } else {
            setAvailableProperties(filteredProperties);
          }
        }
      } catch (error) {
        clientLogger.error('Error loading properties:', error);
      }
    };

    loadProperties();
  }, [element.props.selectedPropertyIds, element.props.categoryIds]);

  // Загрузка товаров из API
  useEffect(() => {
    const loadProducts = async () => {
      if (!element.props.categoryIds?.length) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/catalog/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryIds: element.props.categoryIds,
            limit: element.props.limit || 12
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        clientLogger.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [element.props.categoryIds, element.props.limit]);

  const handleFilterChange = (propertyId: string, value: any) => {
    setPropertyFilters(prev => ({
      ...prev,
      [propertyId]: value
    }));
  };

  const clearFilter = (propertyId: string) => {
    setPropertyFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[propertyId];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setPropertyFilters({});
  };

  const handleAddToCart = (product: Product) => {
    // Добавление в корзину будет реализовано позже
    clientLogger.debug('Adding to cart:', product);
  };

  const renderProductCard = (product: Product) => (
    <div
      key={product.id}
      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedProduct(product)}
    >
      {/* Изображение товара */}
      <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.images[0].alt_text || product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Информация о товаре */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        {/* Свойства товара */}
        {element.props.selectedPropertyIds?.length > 0 && Object.entries(product.properties_data)
          .filter(([key]) => element.props.selectedPropertyIds.includes(key))
          .slice(0, 2)
          .map(([key, value]) => (
            <div key={key} className="text-xs text-gray-500 mb-1">
              <span className="font-medium">{key}:</span> {String(value)}
            </div>
          ))}

        {/* Цена */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            {product.base_price.toLocaleString()} ₽
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart(product);
            }}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
          >
            В корзину
          </button>
        </div>
      </div>
    </div>
  );

  const renderProductDetail = (product: Product) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
            <button
              onClick={() => setSelectedProduct(null)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Изображения */}
            <div>
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                {product.images?.[0]?.url ? (
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].alt_text || product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Дополнительные изображения */}
              {product.images?.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1, 5).map((image, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.alt_text || `${product.name} ${index + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Информация */}
            <div>
              {/* Описание */}
              {product.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Описание</h3>
                  <p className="text-gray-600">{product.description}</p>
                </div>
              )}

              {/* Свойства */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Характеристики</h3>
                <div className="space-y-2">
                  {element.props.selectedPropertyIds?.length > 0 
                    ? Object.entries(product.properties_data)
                        .filter(([key]) => element.props.selectedPropertyIds.includes(key))
                        .map(([key, value]) => (
                          <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                            <span className="font-medium text-gray-700">{key}:</span>
                            <span className="text-gray-900">{String(value)}</span>
                          </div>
                        ))
                    : Object.entries(product.properties_data).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700">{key}:</span>
                          <span className="text-gray-900">{String(value)}</span>
                        </div>
                      ))
                  }
                </div>
              </div>

              {/* Цена и добавление в корзину */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {product.base_price.toLocaleString()} ₽
                  </span>
                  <span className="text-sm text-gray-500">Артикул: {product.sku}</span>
                </div>
                
                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Добавить в корзину
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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

  const renderFilters = () => {
    // Скрываем фильтры в режиме редактирования
    if (!shouldShowFilters('productGrid') || !availableProperties.length) return null;

    return (
      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Фильтры</h3>
          {Object.keys(propertyFilters).length > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
            >
              Очистить все
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableProperties.map(property => (
            <div key={property.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">{property.name}</label>
                {propertyFilters[property.id] && (
                  <button
                    onClick={() => clearFilter(property.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
              
              {/* Отображение в зависимости от настроек */}
              {getPropertyDisplaySettings(property.id).displayType === 'input' && (
                <input
                  type="text"
                  placeholder={`Поиск по ${property.name.toLowerCase()}...`}
                  value={propertyFilters[property.id]?.value || ''}
                  onChange={(e) => handleFilterChange(property.id, {
                    ...propertyFilters[property.id],
                    value: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
              
              {getPropertyDisplaySettings(property.id).displayType === 'chips' && (
                <div className="space-y-2">
                  {property.options?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {property.options.map((option: any) => (
                        <label key={option.value} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(propertyFilters[property.id]?.selectedChips || []).includes(option.value)}
                            onChange={(e) => {
                              const currentChips = propertyFilters[property.id]?.selectedChips || [];
                              const newChips = e.target.checked
                                ? [...currentChips, option.value]
                                : currentChips.filter((chip: string) => chip !== option.value);
                              
                              handleFilterChange(property.id, {
                                ...propertyFilters[property.id],
                                selectedChips: newChips,
                                value: newChips.length > 0 ? newChips : undefined
                              });
                            }}
                            className="mr-2 w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-700 px-2 py-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 italic">
                      Нет доступных значений для этого свойства
                    </div>
                  )}
                </div>
              )}
              
              {getPropertyDisplaySettings(property.id).displayType === 'dropdown' && (
                <select
                  value={propertyFilters[property.id]?.value || ''}
                  onChange={(e) => handleFilterChange(property.id, {
                    ...propertyFilters[property.id],
                    value: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Все варианты</option>
                  {property.options?.map((option: any) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              
              {getPropertyDisplaySettings(property.id).displayType === 'range' && (
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="От"
                    value={propertyFilters[property.id]?.min || ''}
                    onChange={(e) => handleFilterChange(property.id, {
                      ...propertyFilters[property.id],
                      min: e.target.value ? Number(e.target.value) : undefined,
                      value: { min: e.target.value ? Number(e.target.value) : undefined, max: propertyFilters[property.id]?.max }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="До"
                    value={propertyFilters[property.id]?.max || ''}
                    onChange={(e) => handleFilterChange(property.id, {
                      ...propertyFilters[property.id],
                      max: e.target.value ? Number(e.target.value) : undefined,
                      value: { min: propertyFilters[property.id]?.min, max: e.target.value ? Number(e.target.value) : undefined }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Показ активных фильтров */}
        {Object.keys(propertyFilters).length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(propertyFilters).map(([propertyId, filterData]) => {
                const property = availableProperties.find(p => p.id === propertyId);
                if (!property || !filterData?.value) return null;
                
                let displayValue = '';
                let filterChips: string[] = [];
                
                if (getPropertyDisplaySettings(property.id).displayType === 'chips' && Array.isArray(filterData.value)) {
                  filterChips = filterData.value.map((chipValue: string) => {
                    const option = property.options?.find((opt: any) => opt.value === chipValue);
                    return option ? option.label : chipValue;
                  });
                } else if (getPropertyDisplaySettings(property.id).displayType === 'range' && typeof filterData.value === 'object') {
                  displayValue = `${filterData.value.min || '0'} - ${filterData.value.max || '∞'}`;
                } else if (typeof filterData.value === 'string') {
                  const option = property.options?.find((opt: any) => opt.value === filterData.value);
                  displayValue = option ? option.label : filterData.value;
                }
                
                if (filterChips.length > 0) {
                  return filterChips.map((chip, index) => (
                    <span
                      key={`${propertyId}-${index}`}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                    >
                      {property.name}: {chip}
                      <button
                        onClick={() => {
                          const currentChips = filterData.selectedChips || [];
                          const newChips = currentChips.filter((c: string) => c !== filterData.value[index]);
                          if (newChips.length === 0) {
                            clearFilter(propertyId);
                          } else {
                            handleFilterChange(propertyId, {
                              ...filterData,
                              selectedChips: newChips,
                              value: newChips
                            });
                          }
                        }}
                        className="ml-1 text-green-600 hover:text-green-800"
                      >
                        ✕
                      </button>
                    </span>
                  ));
                }
                
                if (displayValue) {
                  return (
                    <span
                      key={propertyId}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      {property.name}: {displayValue}
                      <button
                        onClick={() => clearFilter(propertyId)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ✕
                      </button>
                    </span>
                  );
                }
                
                return null;
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Если фильтры скрыты, показываем placeholder
  if (!shouldShowFilters('productGrid')) {
    return (
      <div className="w-full h-full p-4">
        <div className="mb-6">
          <FiltersPlaceholder />
        </div>
        
        {/* Сетка товаров */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(renderProductCard)}
        </div>

        {/* Модальное окно с деталями товара */}
        {selectedProduct && renderProductDetail(selectedProduct)}
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4">
      {/* Фильтры */}
      {renderFilters()}

      {/* Сетка товаров */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(renderProductCard)}
      </div>

      {/* Модальное окно с деталями товара */}
      {selectedProduct && renderProductDetail(selectedProduct)}
    </div>
  );
}
