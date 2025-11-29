'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Product, ProductProperty, CatalogCategory } from '../types';
import { clientLogger } from '@/lib/logging/client-logger';

interface ProductConfiguratorProps {
  categoryIds: string[];
  selectedProduct: Product | null;
  onProductSelect: (product: Product) => void;
  onConfigurationChange: (configuration: Record<string, any>) => void;
}

interface ConfigurationState {
  [propertyId: string]: any;
}

export function ProductConfigurator({
  categoryIds,
  selectedProduct,
  onProductSelect,
  onConfigurationChange
}: ProductConfiguratorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [properties, setProperties] = useState<ProductProperty[]>([]);
  const [configuration, setConfiguration] = useState<ConfigurationState>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка товаров и свойств
  useEffect(() => {
    if (categoryIds.length === 0) {
      setProducts([]);
      setProperties([]);
      return;
    }

    loadData();
  }, [categoryIds, loadData]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Загрузка товаров
      const productsParams = categoryIds
        .map(id => `categoryIds=${encodeURIComponent(id)}`)
        .join('&');
      
      const productsResponse = await fetch(`/api/catalog/products?${productsParams}`);
      const productsData = await productsResponse.json();
      
      if (productsData.success) {
        setProducts(productsData.products || []);
      }

      // Загрузка свойств
      const propertiesParams = categoryIds
        .map(id => `categoryIds=${encodeURIComponent(id)}`)
        .join('&');
      
      const propertiesResponse = await fetch(`/api/catalog/properties?${propertiesParams}`);
      const propertiesData = await propertiesResponse.json();
      
      if (propertiesData.success) {
        const catalogProperties = propertiesData.properties || [];
        // Фильтруем только свойства для калькулятора
        const calculatorProperties = catalogProperties.filter((prop: ProductProperty) => prop.is_for_calculator);
        setProperties(calculatorProperties);
      }

    } catch (error) {
      clientLogger.error('Error loading configurator data:', error);
      setError('Ошибка загрузки данных конфигуратора');
    } finally {
      setLoading(false);
    }
  }, [categoryIds]);

  // Обработчик изменения конфигурации
  const handleConfigurationChange = (propertyId: string, value: any) => {
    const newConfiguration = {
      ...configuration,
      [propertyId]: value
    };
    
    setConfiguration(newConfiguration);
    onConfigurationChange(newConfiguration);

    // Фильтрация товаров по текущей конфигурации
    filterProducts(newConfiguration);
  };

  // Фильтрация товаров по конфигурации
  const filterProducts = (config: ConfigurationState) => {
    if (Object.keys(config).length === 0) {
      // Если конфигурация пустая, показываем все товары
      return;
    }

    // Фильтруем товары по выбранным свойствам
    const filteredProducts = products.filter(product => {
      return Object.entries(config).every(([propertyId, selectedValue]) => {
        const productValue = product.properties_data[propertyId];
        return productValue === selectedValue;
      });
    });

    // Если найден точно один товар, выбираем его
    if (filteredProducts.length === 1) {
      onProductSelect(filteredProducts[0]);
    } else if (filteredProducts.length === 0) {
      // Если товаров нет, сбрасываем выбор
      onProductSelect(null);
    }
  };

  // Получение доступных значений для свойства
  const getAvailableValues = (property: ProductProperty) => {
    if (property.type === 'select' || property.type === 'multiselect') {
      return property.options || [];
    }

    // Для других типов собираем уникальные значения из товаров
    const values = new Set();
    products.forEach(product => {
      const value = product.properties_data[property.id];
      if (value !== undefined && value !== null) {
        values.add(value);
      }
    });

    return Array.from(values);
  };

  // Рендеринг поля конфигурации
  const renderConfigurationField = (property: ProductProperty) => {
    const availableValues = getAvailableValues(property);
    const currentValue = configuration[property.id];

    switch (property.type) {
      case 'select':
        return (
          <select
            value={currentValue || ''}
            onChange={(e) => handleConfigurationChange(property.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Выберите {property.name.toLowerCase()}</option>
            {availableValues.map((value: string) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = currentValue || [];
        return (
          <div className="space-y-2">
            {availableValues.map((value: string) => (
              <label key={value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, value]
                      : selectedValues.filter((v: string) => v !== value);
                    handleConfigurationChange(property.id, newValues);
                  }}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-900">{value}</span>
              </label>
            ))}
          </div>
        );

      case 'number':
        const min = Math.min(...availableValues.map(v => Number(v)));
        const max = Math.max(...availableValues.map(v => Number(v)));
        return (
          <div className="space-y-2">
            <input
              type="range"
              min={min}
              max={max}
              value={currentValue || min}
              onChange={(e) => handleConfigurationChange(property.id, Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{min}</span>
              <span className="font-medium">{currentValue || min}</span>
              <span>{max}</span>
            </div>
          </div>
        );

      case 'boolean':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={currentValue || false}
              onChange={(e) => handleConfigurationChange(property.id, e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-900">Включено</span>
          </label>
        );

      default:
        return (
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => handleConfigurationChange(property.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Введите ${property.name.toLowerCase()}`}
          />
        );
    }
  };

  if (categoryIds.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-lg">
        <div className="text-4xl mb-4">⚙️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Конфигуратор товаров</h3>
        <p className="text-gray-500">
          Выберите категории товаров для настройки конфигуратора
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Загрузка конфигуратора...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-red-50 rounded-lg">
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-lg font-medium text-red-900 mb-2">Ошибка загрузки</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Конфигуратор товаров</h3>
        <p className="text-sm text-gray-500">
          Настройте параметры для выбора товара
        </p>
      </div>

      {/* Configuration Fields */}
      {properties.length > 0 ? (
        <div className="space-y-4">
          {properties.map((property) => (
            <div key={property.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {property.name}
                {property.is_required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderConfigurationField(property)}
              {property.description && (
                <p className="mt-1 text-xs text-gray-500">{property.description}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center bg-yellow-50 rounded-lg">
          <div className="text-2xl mb-2">⚠️</div>
          <p className="text-sm text-yellow-700">
            Нет доступных параметров для настройки
          </p>
        </div>
      )}

      {/* Selected Product */}
      {selectedProduct && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            {selectedProduct.images.length > 0 && (
              <img
                src={selectedProduct.images[0].url}
                alt={selectedProduct.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <h4 className="font-medium text-green-900">{selectedProduct.name}</h4>
              <p className="text-sm text-green-700">
                {selectedProduct.base_price} {selectedProduct.currency}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Products Count */}
      <div className="text-center text-sm text-gray-500">
        Доступно товаров: {products.length}
      </div>
    </div>
  );
}
