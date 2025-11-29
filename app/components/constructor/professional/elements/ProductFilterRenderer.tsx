'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Filter, Search, SlidersHorizontal, X, ChevronDown, ChevronUp,
  Package, Tag, DollarSign, Star, Calendar, Grid, List
} from 'lucide-react';
import { BaseElement } from '../ProfessionalPageBuilder';

export interface ProductFilterElement extends BaseElement {
  props: {
    categoryId?: string;
    showSearch?: boolean;
    showPriceRange?: boolean;
    showPropertyFilters?: boolean;
    showSorting?: boolean;
    showViewToggle?: boolean;
    searchPlaceholder?: string;
    priceMin?: number;
    priceMax?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    viewMode?: 'grid' | 'list';
    collapsed?: boolean;
    selectedFilters?: any[];
    availableProperties?: any[];
  };
}

interface ProductFilterRendererProps {
  element: ProductFilterElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ProductFilterElement>) => void;
}

interface Property {
  key: string;
  displayName: string;
  dataType: string;
  values: Array<{
    value: string;
    count: number;
  }>;
}

interface FilterState {
  search: string;
  priceRange: [number, number];
  properties: Record<string, string[]>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
}

export const ProductFilterRenderer: React.FC<ProductFilterRendererProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(element.props.collapsed || false);
  const [filterState, setFilterState] = useState<FilterState>({
    search: '',
    priceRange: [element.props.priceMin || 0, element.props.priceMax || 100000],
    properties: {},
    sortBy: element.props.sortBy || 'name',
    sortOrder: element.props.sortOrder || 'asc',
    viewMode: element.props.viewMode || 'grid'
  });

  const loadProperties = useCallback(async () => {
    if (!element.props.categoryId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/products/category/${element.props.categoryId}?limit=100`);
      const data = await response.json();
      setProperties(data.availableProperties || []);
    } catch (error) {
      clientLogger.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  }, [element.props.categoryId]);

  useEffect(() => {
    if (element.props.categoryId) {
      loadProperties();
    }
  }, [element.props.categoryId, loadProperties]);

  useEffect(() => {
    // Обновляем элемент при изменении состояния фильтров
    onUpdate(element.id, {
      props: {
        ...element.props,
        collapsed,
        selectedFilters: filterState,
        priceMin: filterState.priceRange[0],
        priceMax: filterState.priceRange[1],
        sortBy: filterState.sortBy,
        sortOrder: filterState.sortOrder,
        viewMode: filterState.viewMode
      }
    });
  }, [filterState, collapsed, element.id, element.props, onUpdate]);

  const handleSearchChange = (value: string) => {
    setFilterState(prev => ({ ...prev, search: value }));
  };

  const handlePriceRangeChange = (index: number, value: number) => {
    setFilterState(prev => ({
      ...prev,
      priceRange: [
        index === 0 ? value : prev.priceRange[0],
        index === 1 ? value : prev.priceRange[1]
      ]
    }));
  };

  const handlePropertyFilterChange = (propertyKey: string, value: string, checked: boolean) => {
    setFilterState(prev => ({
      ...prev,
      properties: {
        ...prev.properties,
        [propertyKey]: checked 
          ? [...(prev.properties[propertyKey] || []), value]
          : (prev.properties[propertyKey] || []).filter(v => v !== value)
      }
    }));
  };

  const handleSortChange = (sortBy: string) => {
    setFilterState(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleViewModeChange = (viewMode: 'grid' | 'list') => {
    setFilterState(prev => ({ ...prev, viewMode }));
  };

  const clearAllFilters = () => {
    setFilterState({
      search: '',
      priceRange: [element.props.priceMin || 0, element.props.priceMax || 100000],
      properties: {},
      sortBy: element.props.sortBy || 'name',
      sortOrder: 'asc',
      viewMode: 'grid'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filterState.search) count++;
    if (filterState.priceRange[0] > (element.props.priceMin || 0) || 
        filterState.priceRange[1] < (element.props.priceMax || 100000)) count++;
    count += Object.values(filterState.properties).reduce((sum, values) => sum + values.length, 0);
    return count;
  };

  const renderSearchBar = () => (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={filterState.search}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder={element.props.searchPlaceholder || "Поиск товаров..."}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {filterState.search && (
        <button
          onClick={() => handleSearchChange('')}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const renderPriceRange = () => (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-700 flex items-center space-x-2">
        <DollarSign className="w-4 h-4" />
        <span>Цена</span>
      </h4>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={filterState.priceRange[0]}
            onChange={(e) => handlePriceRangeChange(0, parseInt(e.target.value) || 0)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="От"
          />
          <input
            type="number"
            value={filterState.priceRange[1]}
            onChange={(e) => handlePriceRangeChange(1, parseInt(e.target.value) || 100000)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="До"
          />
        </div>
        <div className="text-xs text-gray-500">
          {filterState.priceRange[0].toLocaleString()} - {filterState.priceRange[1].toLocaleString()} ₽
        </div>
      </div>
    </div>
  );

  const renderPropertyFilters = () => (
    <div className="space-y-4">
      {properties.map(property => (
        <div key={property.key} className="space-y-2">
          <h4 className="font-medium text-gray-700 flex items-center space-x-2">
            <Tag className="w-4 h-4" />
            <span>{property.displayName}</span>
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {property.values.slice(0, 10).map(value => (
              <label key={value.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(filterState.properties[property.key] || []).includes(value.value)}
                  onChange={(e) => handlePropertyFilterChange(property.key, value.value, e.target.checked)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700 flex-1">{value.value}</span>
                <span className="text-xs text-gray-500">({value.count})</span>
              </label>
            ))}
            {property.values.length > 10 && (
              <div className="text-xs text-gray-500 pt-1">
                ... и еще {property.values.length - 10}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderSorting = () => (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-700 flex items-center space-x-2">
        <SlidersHorizontal className="w-4 h-4" />
        <span>Сортировка</span>
      </h4>
      <div className="space-y-2">
        {[
          { key: 'name', label: 'По названию' },
          { key: 'price', label: 'По цене' },
          { key: 'popularity', label: 'По популярности' },
          { key: 'newest', label: 'По новизне' }
        ].map(option => (
          <button
            key={option.key}
            onClick={() => handleSortChange(option.key)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              filterState.sortBy === option.key
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'hover:bg-gray-50 border border-transparent'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{option.label}</span>
              {filterState.sortBy === option.key && (
                <span className="text-xs">
                  {filterState.sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderViewToggle = () => (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-700 flex items-center space-x-2">
        <Grid className="w-4 h-4" />
        <span>Вид</span>
      </h4>
      <div className="flex space-x-2">
        <button
          onClick={() => handleViewModeChange('grid')}
          className={`p-2 rounded-md transition-colors ${
            filterState.viewMode === 'grid'
              ? 'bg-blue-100 text-blue-800'
              : 'hover:bg-gray-50 text-gray-600'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleViewModeChange('list')}
          className={`p-2 rounded-md transition-colors ${
            filterState.viewMode === 'list'
              ? 'bg-blue-100 text-blue-800'
              : 'hover:bg-gray-50 text-gray-600'
          }`}
        >
          <List className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (!element.props.categoryId) {
      return (
        <div className="p-4 text-center text-gray-500">
          <Filter className="w-8 h-8 mx-auto mb-2" />
          <p>Выберите категорию товаров для фильтрации</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="p-4 text-center">
          <div className="text-gray-500">Загрузка фильтров...</div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Поиск */}
        {element.props.showSearch && renderSearchBar()}

        {/* Активные фильтры */}
        {getActiveFiltersCount() > 0 && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-800">
                Активных фильтров: {getActiveFiltersCount()}
              </span>
            </div>
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Очистить все</span>
            </button>
          </div>
        )}

        {/* Ценовой диапазон */}
        {element.props.showPriceRange && renderPriceRange()}

        {/* Фильтры по свойствам */}
        {element.props.showPropertyFilters && renderPropertyFilters()}

        {/* Сортировка */}
        {element.props.showSorting && renderSorting()}

        {/* Переключатель вида */}
        {element.props.showViewToggle && renderViewToggle()}
      </div>
    );
  };

  return (
    <div
      className={`relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        left: element.style.left || 0,
        top: element.style.top || 0,
        width: element.style.width || '300px',
        height: element.style.height || 'auto',
        zIndex: element.style.zIndex || 1,
      }}
      onClick={() => onSelect(element.id)}
    >
      <div className="bg-white border border-gray-200 rounded-lg">
        {/* Заголовок */}
        <div 
          className="flex items-center justify-between p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(!collapsed);
          }}
        >
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="font-medium">Фильтры товаров</span>
            {getActiveFiltersCount() > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </div>
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          )}
        </div>

        {/* Контент */}
        {!collapsed && (
          <div className="p-4">
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
};

