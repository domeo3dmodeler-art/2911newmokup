'use client';

import React, { useState, useEffect } from 'react';
import { BaseElement } from '../types';
import { clientLogger } from '@/lib/logging/client-logger';

interface ProductFilterProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterGroup {
  name: string;
  type: 'checkbox' | 'radio' | 'range' | 'select';
  options: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
}

export function ProductFilter({ element, onUpdate }: ProductFilterProps) {
  const [filters, setFilters] = useState<FilterGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({});

  // Загружаем фильтры на основе категорий
  useEffect(() => {
    const loadFilters = async () => {
      setLoading(true);
      try {
        const categoryIds = element.props.categoryIds || [];
        
        if (categoryIds.length === 0) {
          // Если категории не выбраны, показываем базовые фильтры
          setFilters([
            {
              name: 'Цена',
              type: 'range',
              options: [],
              min: 0,
              max: 100000,
              step: 1000
            },
            {
              name: 'Бренд',
              type: 'checkbox',
              options: [
                { value: 'domeo', label: 'Domeo', count: 15 },
                { value: 'premium', label: 'Premium', count: 8 },
                { value: 'standard', label: 'Standard', count: 23 }
              ]
            },
            {
              name: 'Материал',
              type: 'checkbox',
              options: [
                { value: 'wood', label: 'Дерево', count: 12 },
                { value: 'metal', label: 'Металл', count: 8 },
                { value: 'glass', label: 'Стекло', count: 6 }
              ]
            },
            {
              name: 'Цвет',
              type: 'checkbox',
              options: [
                { value: 'white', label: 'Белый', count: 18 },
                { value: 'brown', label: 'Коричневый', count: 14 },
                { value: 'black', label: 'Черный', count: 9 },
                { value: 'gray', label: 'Серый', count: 11 }
              ]
            }
          ]);
        } else {
          // Здесь можно загружать фильтры из API на основе категорий
          // Пока используем базовые фильтры
          setFilters([
            {
              name: 'Цена',
              type: 'range',
              options: [],
              min: 0,
              max: 50000,
              step: 1000
            },
            {
              name: 'Размер',
              type: 'checkbox',
              options: [
                { value: '800x2000', label: '800×2000 мм', count: 25 },
                { value: '900x2000', label: '900×2000 мм', count: 18 },
                { value: '1000x2000', label: '1000×2000 мм', count: 12 }
              ]
            },
            {
              name: 'Стиль',
              type: 'radio',
              options: [
                { value: 'modern', label: 'Современный', count: 20 },
                { value: 'classic', label: 'Классический', count: 15 },
                { value: 'minimalist', label: 'Минимализм', count: 10 }
              ]
            }
          ]);
        }
      } catch (error) {
        clientLogger.error('Ошибка загрузки фильтров:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFilters();
  }, [element.props.categoryIds]);

  const handleFilterChange = (filterName: string, value: any) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterName]: value
    }));

    // Уведомляем родительский компонент об изменении
    if (element.props.onFilterChange) {
      element.props.onFilterChange(filterName, value);
    }
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    if (element.props.onClearFilters) {
      element.props.onClearFilters();
    }
  };

  const getActiveFiltersCount = () => {
    return Object.keys(selectedFilters).filter(key => 
      selectedFilters[key] !== undefined && 
      selectedFilters[key] !== null && 
      selectedFilters[key] !== '' &&
      (Array.isArray(selectedFilters[key]) ? selectedFilters[key].length > 0 : true)
    ).length;
  };

  if (loading) {
    return (
      <div className="w-full h-full bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-sm text-gray-500">Загрузка фильтров...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-auto">
      <div className="p-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {element.props.title || 'Фильтры'}
          </h3>
          {getActiveFiltersCount() > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Очистить все ({getActiveFiltersCount()})
            </button>
          )}
        </div>

        {/* Фильтры */}
        <div className="space-y-6">
          {filters.map((filter, index) => (
            <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                {filter.name}
              </h4>
              
              {filter.type === 'range' && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {selectedFilters[filter.name]?.min || filter.min} ₽
                    </span>
                    <span className="text-gray-400">—</span>
                    <span className="text-sm text-gray-500">
                      {selectedFilters[filter.name]?.max || filter.max} ₽
                    </span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min={filter.min}
                      max={filter.max}
                      step={filter.step}
                      value={selectedFilters[filter.name]?.max || filter.max}
                      onChange={(e) => handleFilterChange(filter.name, {
                        ...selectedFilters[filter.name],
                        max: parseInt(e.target.value)
                      })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {filter.type === 'checkbox' && (
                <div className="space-y-2">
                  {filter.options.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFilters[filter.name]?.includes(option.value) || false}
                        onChange={(e) => {
                          const currentValues = selectedFilters[filter.name] || [];
                          const newValues = e.target.checked
                            ? [...currentValues, option.value]
                            : currentValues.filter((v: string) => v !== option.value);
                          handleFilterChange(filter.name, newValues);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 flex-1">{option.label}</span>
                      {option.count && (
                        <span className="text-xs text-gray-500">({option.count})</span>
                      )}
                    </label>
                  ))}
                </div>
              )}

              {filter.type === 'radio' && (
                <div className="space-y-2">
                  {filter.options.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name={filter.name}
                        value={option.value}
                        checked={selectedFilters[filter.name] === option.value}
                        onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                        className="border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 flex-1">{option.label}</span>
                      {option.count && (
                        <span className="text-xs text-gray-500">({option.count})</span>
                      )}
                    </label>
                  ))}
                </div>
              )}

              {filter.type === 'select' && (
                <select
                  value={selectedFilters[filter.name] || ''}
                  onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Все {filter.name.toLowerCase()}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label} {option.count && `(${option.count})`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>

        {/* Результаты */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Найдено товаров: <span className="font-medium text-gray-900">156</span>
            </span>
            <button
              onClick={() => {
                // Здесь можно добавить логику применения фильтров
                clientLogger.debug('Применяем фильтры:', selectedFilters);
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

