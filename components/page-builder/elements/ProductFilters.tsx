'use client';

import React, { useState, useEffect } from 'react';
import { shouldShowFilters } from '@/lib/display-mode';
import { clientLogger } from '@/lib/logging/client-logger';

interface FilterOption {
  value: string;
  label: string;
  count: number;
}

interface FilterGroup {
  id: string;
  name: string;
  type: 'select' | 'checkbox' | 'range' | 'color';
  options: FilterOption[];
  multiple?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

interface ProductFiltersProps {
  categoryIds: string[];
  onFiltersChange: (filters: Record<string, any>) => void;
}

export function ProductFilters({ categoryIds, onFiltersChange }: ProductFiltersProps) {
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  // Загрузка доступных фильтров
  useEffect(() => {
    const loadFilters = async () => {
      if (!categoryIds?.length) return;
      
      setLoading(true);
      try {
        const response = await fetch('/api/catalog/filters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryIds })
        });
        
        if (response.ok) {
          const data = await response.json();
          setFilterGroups(data.filters || []);
        }
      } catch (error) {
        clientLogger.error('Error loading filters:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFilters();
  }, [categoryIds]);

  const handleFilterChange = (filterId: string, value: any) => {
    const newFilters = { ...activeFilters, [filterId]: value };
    setActiveFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    onFiltersChange({});
  };

  const renderFilterGroup = (group: FilterGroup) => {
    const currentValue = activeFilters[group.id];

    switch (group.type) {
      case 'select':
        return (
          <div key={group.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {group.name}
            </label>
            <select
              value={currentValue || ''}
              onChange={(e) => handleFilterChange(group.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все</option>
              {group.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({option.count})
                </option>
              ))}
            </select>
          </div>
        );

      case 'checkbox':
        return (
          <div key={group.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {group.name}
            </label>
            <div className="space-y-2">
              {group.options.map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={currentValue?.includes(option.value) || false}
                    onChange={(e) => {
                      const current = currentValue || [];
                      const newValue = e.target.checked
                        ? [...current, option.value]
                        : current.filter((v: string) => v !== option.value);
                      handleFilterChange(group.id, newValue);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {option.label} ({option.count})
                  </span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'range':
        return (
          <div key={group.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {group.name}: {currentValue || group.min} - {activeFilters[`${group.id}_max`] || group.max}
            </label>
            <div className="space-y-2">
              <input
                type="range"
                min={group.min}
                max={group.max}
                step={group.step || 1}
                value={currentValue || group.min}
                onChange={(e) => handleFilterChange(group.id, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{group.min}</span>
                <span>{group.max}</span>
              </div>
            </div>
          </div>
        );

      case 'color':
        return (
          <div key={group.id} className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {group.name}
            </label>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange(group.id, option.value)}
                  className={`w-8 h-8 rounded-full border-2 ${
                    currentValue === option.value
                      ? 'border-gray-900'
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: option.value }}
                  title={option.label}
                />
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Загрузка фильтров...</p>
        </div>
      </div>
    );
  }

  if (!filterGroups.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
          </svg>
          <p className="text-sm">Фильтры недоступны</p>
        </div>
      </div>
    );
  }

  // Скрываем фильтры в режиме редактирования
  if (!shouldShowFilters('productFilters')) {
    return (
      <div className="w-full h-full p-4 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">🔍</div>
          <div className="text-sm">Фильтры товаров</div>
          <div className="text-xs text-gray-400 mt-1">Доступны в режиме предпросмотра</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Фильтры</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Очистить все
        </button>
      </div>

      {/* Filter Groups */}
      <div className="space-y-6">
        {filterGroups.map(renderFilterGroup)}
      </div>

      {/* Active Filters Summary */}
      {Object.keys(activeFilters).length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Активные фильтры:</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(activeFilters).map(([key, value]) => {
              const group = filterGroups.find(g => g.id === key);
              if (!group || !value) return null;
              
              return (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {group.name}: {Array.isArray(value) ? value.join(', ') : value}
                  <button
                    onClick={() => handleFilterChange(key, undefined)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
