'use client';

import React, { useState, useEffect } from 'react';
import { BaseElement } from '../types';
import { extractUniquePropertyValues } from '@/lib/string-utils';
import { shouldShowFilters } from '@/lib/display-mode';
import { ConfiguratorPlaceholder } from './PlaceholderContent';
import { clientLogger } from '@/lib/logging/client-logger';

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  properties: Record<string, string>;
  available: boolean;
}

interface ConfigurableProduct {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  images: string[];
  variants: ProductVariant[];
  configurableProperties: {
    id: string;
    name: string;
    type: 'select' | 'color' | 'size' | 'material';
    options: {
      value: string;
      label: string;
      priceModifier?: number;
      image?: string;
    }[];
  }[];
}

interface SelectedConfiguration {
  [propertyId: string]: string;
}

interface ProductConfiguratorAdvancedProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

export function ProductConfiguratorAdvanced({ element, onUpdate }: ProductConfiguratorAdvancedProps) {
  const [products, setProducts] = useState<ConfigurableProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ConfigurableProduct | null>(null);
  const [selectedConfiguration, setSelectedConfiguration] = useState<SelectedConfiguration>({});
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [propertyFilters, setPropertyFilters] = useState<Record<string, unknown>>({});
  const [availableProperties, setAvailableProperties] = useState<Array<{ id: string; name: string; options?: Array<{ value: unknown; label: string }>; [key: string]: unknown }>>([]);

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

  // Получение настроек отображения для свойства
  const getPropertyDisplaySettings = (propertyId: string) => {
    return element.props.propertyDisplaySettings?.[propertyId] || { displayType: 'input' };
  };

  // Загрузка конфигурируемых товаров
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
            limit: element.props.limit || 6
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
          if (data.products?.length > 0) {
            setSelectedProduct(data.products[0]);
          }
        }
      } catch (error) {
        clientLogger.error('Error loading configurable products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [element.props.categoryIds, element.props.limit]);

  // Расчет цены при изменении конфигурации
  useEffect(() => {
    if (!selectedProduct) return;

    let price = selectedProduct.basePrice;
    
    // Добавляем модификаторы цены от выбранных опций
    selectedProduct.configurableProperties.forEach(property => {
      const selectedValue = selectedConfiguration[property.id];
      if (selectedValue) {
        const option = property.options.find(opt => opt.value === selectedValue);
        if (option?.priceModifier) {
          price += option.priceModifier;
        }
      }
    });

    setCalculatedPrice(price);
  }, [selectedProduct, selectedConfiguration]);

  const handleConfigurationChange = (propertyId: string, value: string) => {
    setSelectedConfiguration(prev => ({
      ...prev,
      [propertyId]: value
    }));
  };

  const handleFilterChange = (propertyId: string, value: unknown) => {
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

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const cartItem = {
      productId: selectedProduct.id,
      configuration: selectedConfiguration,
      price: calculatedPrice,
      quantity: 1
    };

    // Добавление в корзину будет реализовано позже
    clientLogger.debug('Adding configured product to cart:', cartItem);
  };

  const getSelectedVariant = () => {
    if (!selectedProduct) return null;
    
    return selectedProduct.variants.find(variant => {
      return Object.entries(selectedConfiguration).every(([propertyId, value]) => {
        return variant.properties[propertyId] === value;
      });
    });
  };

  const renderPropertyFilters = () => {
    // Скрываем фильтры в режиме редактирования
    if (!shouldShowFilters('productConfiguratorAdvanced') || !availableProperties.length) return null;

    return (
      <div className="mb-6">
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
          {availableProperties.map(property => {
            const displaySettings = getPropertyDisplaySettings(property.id);
            
            return (
              <div key={property.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">{property.name}</h4>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-500">
                      {String(displaySettings?.displayType || '')}
                    </div>
                    {(() => {
                      const filterValue = propertyFilters[property.id];
                      return filterValue && typeof filterValue === 'object' && filterValue !== null ? (
                        <button
                          onClick={() => clearFilter(property.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          ×
                        </button>
                      ) : null;
                    })()}
                  </div>
                </div>
              

              {/* Отображение в зависимости от настроек */}
              {displaySettings.displayType === 'input' && (
                <input
                  type="text"
                  placeholder={`Поиск по ${property.name.toLowerCase()}...`}
                  value={(() => {
                    const filterValue = propertyFilters[property.id];
                    if (filterValue && typeof filterValue === 'object' && filterValue !== null && 'value' in filterValue) {
                      const filterObj = filterValue as Record<string, unknown>;
                      return typeof filterObj.value === 'string' ? filterObj.value : '';
                    }
                    return '';
                  })()}
                  onChange={(e) => {
                    const currentFilter = typeof propertyFilters[property.id] === 'object' && propertyFilters[property.id] !== null ? propertyFilters[property.id] as Record<string, unknown> : {};
                    handleFilterChange(property.id, {
                      ...currentFilter,
                      value: e.target.value
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
              
              {displaySettings.displayType === 'chips' && (
                <div className="space-y-2">
                  {property.options && property.options.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {property.options.map((option: { value: unknown; label: string; [key: string]: unknown }) => {
                        const optionValue = String(option.value);
                        const currentFilter = typeof propertyFilters[property.id] === 'object' && propertyFilters[property.id] !== null ? propertyFilters[property.id] as Record<string, unknown> : {};
                        const selectedChips = Array.isArray(currentFilter.selectedChips) ? currentFilter.selectedChips as unknown[] : [];
                        return (
                        <label key={optionValue} className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedChips.some(chip => String(chip) === optionValue)}
                            onChange={(e) => {
                              const newChips = e.target.checked
                                ? [...selectedChips, option.value]
                                : selectedChips.filter((chip: unknown) => String(chip) !== optionValue);
                              
                              handleFilterChange(property.id, {
                                ...currentFilter,
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
                      );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 italic">
                      Нет доступных значений для этого свойства
                    </div>
                  )}
                </div>
              )}
              
              {displaySettings.displayType === 'dropdown' && (
                <select
                  value={(() => {
                    const filterValue = propertyFilters[property.id];
                    if (filterValue && typeof filterValue === 'object' && filterValue !== null && 'value' in filterValue) {
                      const filterObj = filterValue as Record<string, unknown>;
                      return typeof filterObj.value === 'string' ? filterObj.value : '';
                    }
                    return '';
                  })()}
                  onChange={(e) => {
                    const currentFilter = typeof propertyFilters[property.id] === 'object' && propertyFilters[property.id] !== null ? propertyFilters[property.id] as Record<string, unknown> : {};
                    handleFilterChange(property.id, {
                      ...currentFilter,
                      value: e.target.value
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Все варианты</option>
                  {property.options?.map((option: { value: unknown; label: string; [key: string]: unknown }) => {
                    const optionValue = String(option.value);
                    return (
                      <option key={optionValue} value={optionValue}>
                        {option.label}
                      </option>
                    );
                  })}
                </select>
              )}
              
              {displaySettings.displayType === 'range' && (
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="От"
                    value={(() => {
                      const filterValue = propertyFilters[property.id];
                      if (filterValue && typeof filterValue === 'object' && filterValue !== null && 'min' in filterValue) {
                        const filterObj = filterValue as Record<string, unknown>;
                        return typeof filterObj.min === 'number' ? String(filterObj.min) : '';
                      }
                      return '';
                    })()}
                    onChange={(e) => {
                      const currentFilter = typeof propertyFilters[property.id] === 'object' && propertyFilters[property.id] !== null ? propertyFilters[property.id] as Record<string, unknown> : {};
                      const currentMax = typeof currentFilter.max === 'number' ? currentFilter.max : undefined;
                      handleFilterChange(property.id, {
                        ...currentFilter,
                        min: e.target.value ? Number(e.target.value) : undefined,
                        value: { min: e.target.value ? Number(e.target.value) : undefined, max: currentMax }
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="До"
                    value={(() => {
                      const filterValue = propertyFilters[property.id];
                      if (filterValue && typeof filterValue === 'object' && filterValue !== null && 'max' in filterValue) {
                        const filterObj = filterValue as Record<string, unknown>;
                        return typeof filterObj.max === 'number' ? String(filterObj.max) : '';
                      }
                      return '';
                    })()}
                    onChange={(e) => {
                      const currentFilter = typeof propertyFilters[property.id] === 'object' && propertyFilters[property.id] !== null ? propertyFilters[property.id] as Record<string, unknown> : {};
                      const currentMin = typeof currentFilter.min === 'number' ? currentFilter.min : undefined;
                      handleFilterChange(property.id, {
                        ...currentFilter,
                        max: e.target.value ? Number(e.target.value) : undefined,
                        value: { min: currentMin, max: e.target.value ? Number(e.target.value) : undefined }
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {displaySettings.displayType === 'radio' && (
                <div className="space-y-2">
                  {property.options?.slice(0, 4).map((option: { value: unknown; label: string; [key: string]: unknown }) => {
                    const optionValue = String(option.value);
                    const currentFilter = typeof propertyFilters[property.id] === 'object' && propertyFilters[property.id] !== null ? propertyFilters[property.id] as Record<string, unknown> : {};
                    const currentValue = typeof currentFilter.value === 'string' ? currentFilter.value : '';
                    return (
                      <label key={optionValue} className="flex items-center">
                        <input
                          type="radio"
                          name={property.id}
                          value={optionValue}
                          checked={currentValue === optionValue}
                          onChange={(e) => handleFilterChange(property.id, {
                            ...currentFilter,
                            value: e.target.value
                          })}
                          className="mr-2"
                        />
                        <span className="text-sm">{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {displaySettings.displayType === 'color' && (
                <div className="flex flex-wrap gap-2">
                  {property.options?.slice(0, 8).map((option: { value: unknown; label: string; color?: string; [key: string]: unknown }) => {
                    const optionValue = String(option.value);
                    const currentFilter = typeof propertyFilters[property.id] === 'object' && propertyFilters[property.id] !== null ? propertyFilters[property.id] as Record<string, unknown> : {};
                    const currentValue = String(currentFilter.value || '');
                    return (
                      <button
                        key={optionValue}
                        onClick={() => handleFilterChange(property.id, {
                          ...currentFilter,
                          value: option.value
                        })}
                        className={`w-8 h-8 rounded border-2 ${
                          currentValue === optionValue
                            ? 'border-gray-800'
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: typeof option.color === 'string' ? option.color : optionValue }}
                        title={option.label}
                      />
                    );
                  })}
                </div>
              )}
            </div>
            );
          })}
        </div>
        
        {/* Показ активных фильтров */}
        {Object.keys(propertyFilters).length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(propertyFilters).map(([propertyId, filterData]) => {
                const property = availableProperties.find(p => p.id === propertyId);
                if (!property || !filterData || typeof filterData !== 'object') return null;
                
                const filterDataObj = filterData as Record<string, unknown>;
                if (!filterDataObj.value) return null;
                
                let displayValue = '';
                let filterChips: string[] = [];
                
                if (filterDataObj.displayType === 'chips' && Array.isArray(filterDataObj.value)) {
                  // Для плашек показываем каждую выбранную плашку отдельно
                  filterChips = filterDataObj.value.map((chipValue: unknown) => {
                    const chipValueStr = String(chipValue);
                    const option = property.options?.find((opt: { value: unknown; label: string; [key: string]: unknown }) => String(opt.value) === chipValueStr);
                    return option ? option.label : chipValueStr;
                  });
                } else if (filterDataObj.displayType === 'range' && typeof filterDataObj.value === 'object' && filterDataObj.value !== null) {
                  const rangeValue = filterDataObj.value as { min?: number; max?: number };
                  displayValue = `${rangeValue.min || '0'} - ${rangeValue.max || '∞'}`;
                } else if (typeof filterDataObj.value === 'string') {
                  const option = property.options?.find((opt: { value: unknown; label: string; [key: string]: unknown }) => String(opt.value) === filterDataObj.value);
                  displayValue = option ? option.label : filterDataObj.value;
                }
                
                // Показываем плашки отдельно
                if (filterChips.length > 0) {
                  return filterChips.map((chip, index) => (
                    <span
                      key={`${propertyId}-${index}`}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                    >
                      {property.name}: {chip}
                      <button
                        onClick={() => {
                          const currentChips = Array.isArray(filterDataObj.selectedChips) ? filterDataObj.selectedChips as unknown[] : [];
                          const valueArray = Array.isArray(filterDataObj.value) ? filterDataObj.value as unknown[] : [];
                          const newChips = currentChips.filter((c: unknown) => String(c) !== String(valueArray[index]));
                          if (newChips.length === 0) {
                            clearFilter(propertyId);
                          } else {
                            handleFilterChange(propertyId, {
                              ...filterDataObj,
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
                
                // Показываем обычный фильтр
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

  const renderProductSelector = () => {
    const columns = element.props.columns || 3;
    const gridCols = columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 
                     columns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                     'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Выберите товар</h3>
        <div className={`grid ${gridCols} gap-4`}>
          {products.map(product => (
          <div
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              selectedProduct?.id === product.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
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
            <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
            <p className="text-gray-600 text-sm mt-1">от {product.basePrice.toLocaleString()} ₽</p>
          </div>
          ))}
        </div>
      </div>
    );
  };

  const renderConfiguration = () => {
    if (!selectedProduct) return null;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Настройте {selectedProduct.name}
          </h3>
          
          {/* Изображение товара */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-6">
            {selectedProduct.images?.[0] ? (
              <img
                src={selectedProduct.images[0]}
                alt={selectedProduct.name}
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
        </div>

        {/* Описание */}
        <div>
          <p className="text-gray-600">{selectedProduct.description}</p>
        </div>

        {/* Конфигурируемые свойства */}
        <div className="space-y-6">
          {selectedProduct.configurableProperties.map(property => (
            <div key={property.id}>
              <h4 className="font-medium text-gray-900 mb-3">{property.name}</h4>
              
              {property.type === 'color' ? (
                <div className="flex flex-wrap gap-3">
                  {property.options.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleConfigurationChange(property.id, option.value)}
                      className={`w-12 h-12 rounded-full border-2 ${
                        selectedConfiguration[property.id] === option.value
                          ? 'border-gray-900'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: option.value }}
                      title={option.label}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.options.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleConfigurationChange(property.id, option.value)}
                      className={`p-3 border-2 rounded-lg text-sm font-medium transition-all ${
                        selectedConfiguration[property.id] === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {option.label}
                      {option.priceModifier && (
                        <span className="block text-xs text-gray-500 mt-1">
                          {option.priceModifier > 0 ? '+' : ''}{option.priceModifier.toLocaleString()} ₽
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Цена и добавление в корзину */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl font-bold text-gray-900">
              {calculatedPrice.toLocaleString()} ₽
            </span>
            {getSelectedVariant() && (
              <span className="text-sm text-gray-500">
                Артикул: {getSelectedVariant()?.properties.sku || 'N/A'}
              </span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Добавить в корзину
          </button>
        </div>
      </div>
    );
  };

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

  // Если фильтры скрыты, показываем placeholder
  if (!shouldShowFilters('productConfiguratorAdvanced') && element.props.showFilters !== false) {
    return (
      <div className="w-full h-full p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <ConfiguratorPlaceholder />
          </div>

          {/* Селектор товара */}
          {element.props.showProductSelector !== false && renderProductSelector()}

          {/* Конфигурация */}
          {element.props.showConfiguration !== false && renderConfiguration()}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Фильтры свойств */}
        {element.props.showFilters !== false && renderPropertyFilters()}

        {/* Селектор товара */}
        {element.props.showProductSelector !== false && renderProductSelector()}

        {/* Конфигурация */}
        {element.props.showConfiguration !== false && renderConfiguration()}
      </div>
    </div>
  );
}
