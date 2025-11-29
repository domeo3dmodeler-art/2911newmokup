// components/ui/FilterBar.tsx
// Панель фильтров с поиском и фильтрами

import React from 'react';
import { SearchInput } from './SearchInput';
import { FilterDropdown } from './FilterDropdown';
import { Button } from './Button';

export interface FilterConfig {
  id: string;
  label: string;
  type: 'search' | 'dropdown' | 'date' | 'select';
  options?: Array<{ value: string; label: string; count?: number }>;
  placeholder?: string;
}

export interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, string>;
  onChange: (filterId: string, value: string) => void;
  onClear?: () => void;
  onSearch?: (searchValue: string) => void;
  className?: string;
}

export function FilterBar({ 
  filters, 
  values, 
  onChange, 
  onClear,
  onSearch,
  className = '' 
}: FilterBarProps) {
  const searchFilter = filters.find(f => f.type === 'search');
  const otherFilters = filters.filter(f => f.type !== 'search');

  const hasActiveFilters = Object.values(values).some(value => value !== '');

  return (
    <div className={`bg-white border border-black/10 p-4 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
        {/* Search */}
        {searchFilter && (
          <div className="flex-1 max-w-md">
            <SearchInput
              placeholder={searchFilter.placeholder || 'Поиск...'}
              value={values[searchFilter.id] || ''}
              onChange={(value) => onChange(searchFilter.id, value)}
              onSearch={onSearch}
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center space-x-4">
          {otherFilters.map((filter) => (
            <div key={filter.id} className="min-w-0">
              {filter.type === 'dropdown' && (
                <FilterDropdown
                  label={filter.label}
                  options={filter.options || []}
                  value={values[filter.id] || ''}
                  onChange={(value) => onChange(filter.id, value)}
                  placeholder={filter.placeholder}
                />
              )}
              
              {filter.type === 'select' && (
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {filter.label}
                  </label>
                  <select
                    value={values[filter.id] || ''}
                    onChange={(e) => onChange(filter.id, e.target.value)}
                    className="px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                  >
                    <option value="">{filter.placeholder || 'Все'}</option>
                    {filter.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}

          {/* Clear filters */}
          {hasActiveFilters && onClear && (
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-gray-600 hover:text-gray-800"
              >
                Очистить фильтры
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Активные фильтры:</span>
            {Object.entries(values).map(([filterId, value]) => {
              if (!value) return null;
              
              const filter = filters.find(f => f.id === filterId);
              if (!filter) return null;
              
              const option = filter.options?.find(opt => opt.value === value);
              const displayValue = option ? option.label : value;
              
              return (
                <span
                  key={filterId}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                >
                  {filter.label}: {displayValue}
                  <button
                    onClick={() => onChange(filterId, '')}
                    className="ml-1 text-gray-500 hover:text-gray-700"
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

export default FilterBar;
