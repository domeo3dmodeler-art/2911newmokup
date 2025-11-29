'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button, Input, Card, Badge } from '../ui';
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  base_price: number;
  stock_quantity: number;
  brand?: string;
  model?: string;
  properties_data: string | Record<string, any>;
}

interface ProductFiltersProps {
  products: Product[];
  onFilteredProducts: (filteredProducts: Product[]) => void;
  onClearFilters: () => void;
}

interface FilterState {
  search: string;
  priceMin: string;
  priceMax: string;
  stockMin: string;
  stockMax: string;
  brand: string;
  model: string;
  hasPhotos: boolean | null;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  priceMin: '',
  priceMax: '',
  stockMin: '',
  stockMax: '',
  brand: '',
  model: '',
  hasPhotos: null,
};

export default function ProductFilters({ products, onFilteredProducts, onClearFilters }: ProductFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isExpanded, setIsExpanded] = useState(false);

  // Получаем уникальные значения для селектов
  const uniqueBrands = useMemo(() => {
    const brands = products
      .map(p => p.brand)
      .filter((brand): brand is string => Boolean(brand))
      .filter((brand, index, arr) => arr.indexOf(brand) === index)
      .sort();
    return brands;
  }, [products]);

  const uniqueModels = useMemo(() => {
    const models = products
      .map(p => p.model)
      .filter((model): model is string => Boolean(model))
      .filter((model, index, arr) => arr.indexOf(model) === index)
      .sort();
    return models;
  }, [products]);

  // Применяем фильтры
  const applyFilters = useCallback(() => {
    let filtered = [...products];

    // Поиск по тексту
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(product =>
        product.sku.toLowerCase().includes(searchLower) ||
        product.name.toLowerCase().includes(searchLower) ||
        (product.brand && product.brand.toLowerCase().includes(searchLower)) ||
        (product.model && product.model.toLowerCase().includes(searchLower))
      );
    }

    // Фильтр по цене
    if (filters.priceMin) {
      const minPrice = parseFloat(filters.priceMin);
      if (!isNaN(minPrice)) {
        filtered = filtered.filter(product => product.base_price >= minPrice);
      }
    }
    if (filters.priceMax) {
      const maxPrice = parseFloat(filters.priceMax);
      if (!isNaN(maxPrice)) {
        filtered = filtered.filter(product => product.base_price <= maxPrice);
      }
    }

    // Фильтр по количеству на складе
    if (filters.stockMin) {
      const minStock = parseInt(filters.stockMin);
      if (!isNaN(minStock)) {
        filtered = filtered.filter(product => product.stock_quantity >= minStock);
      }
    }
    if (filters.stockMax) {
      const maxStock = parseInt(filters.stockMax);
      if (!isNaN(maxStock)) {
        filtered = filtered.filter(product => product.stock_quantity <= maxStock);
      }
    }

    // Фильтр по бренду
    if (filters.brand) {
      filtered = filtered.filter(product => product.brand === filters.brand);
    }

    // Фильтр по модели
    if (filters.model) {
      filtered = filtered.filter(product => product.model === filters.model);
    }

    // Фильтр по наличию фотографий
    if (filters.hasPhotos !== null) {
      filtered = filtered.filter(product => {
        try {
          const properties = typeof product.properties_data === 'string' 
            ? JSON.parse(product.properties_data) 
            : product.properties_data;
          const hasPhotos = properties.photos && Array.isArray(properties.photos) && properties.photos.length > 0;
          return filters.hasPhotos ? hasPhotos : !hasPhotos;
        } catch {
          return !filters.hasPhotos;
        }
      });
    }

    onFilteredProducts(filtered);
  }, [products, filters, onFilteredProducts]);

  // Очищаем фильтры
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    onClearFilters();
  }, [onClearFilters]);

  // Обновляем фильтр
  const updateFilter = useCallback((key: keyof FilterState, value: string | boolean | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Применяем фильтры при изменении
  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && value !== null && value !== false
  ).length;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Заголовок с кнопкой разворачивания */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="font-medium text-gray-900">Фильтры товаров</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span>Свернуть</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>Развернуть</span>
              </>
            )}
          </Button>
        </div>

        {/* Основной поиск */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск по SKU, названию, бренду или модели..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Дополнительные фильтры */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Цена */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Цена (₽)
              </label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="От"
                  value={filters.priceMin}
                  onChange={(e) => updateFilter('priceMin', e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="До"
                  value={filters.priceMax}
                  onChange={(e) => updateFilter('priceMax', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Количество на складе */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Количество на складе
              </label>
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="От"
                  value={filters.stockMin}
                  onChange={(e) => updateFilter('stockMin', e.target.value)}
                  className="text-sm"
                />
                <Input
                  type="number"
                  placeholder="До"
                  value={filters.stockMax}
                  onChange={(e) => updateFilter('stockMax', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Бренд */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Бренд
              </label>
              <select
                value={filters.brand}
                onChange={(e) => updateFilter('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Все бренды</option>
                {uniqueBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            {/* Модель */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Модель
              </label>
              <select
                value={filters.model}
                onChange={(e) => updateFilter('model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Все модели</option>
                {uniqueModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            {/* Наличие фотографий */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Фотографии
              </label>
              <select
                value={filters.hasPhotos === null ? '' : filters.hasPhotos.toString()}
                onChange={(e) => {
                  const value = e.target.value;
                  updateFilter('hasPhotos', value === '' ? null : value === 'true');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Все товары</option>
                <option value="true">С фотографиями</option>
                <option value="false">Без фотографий</option>
              </select>
            </div>
          </div>
        )}

        {/* Кнопки управления */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Найдено товаров: {products.length}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              disabled={activeFiltersCount === 0}
              className="flex items-center space-x-1"
            >
              <X className="h-4 w-4" />
              <span>Очистить</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
