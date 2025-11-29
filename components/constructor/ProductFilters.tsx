import React from 'react';
import { useCatalogData, ProductProperty } from './hooks/useCatalogData';
import { Select, Input, Checkbox } from '@/components/ui';
import { Search, Filter } from 'lucide-react';

interface FilterOption {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'date' | 'file';
  options?: string[];
  value: any;
  min?: number;
  max?: number;
}

interface ProductFiltersProps {
  categoryId?: string;
  filters: FilterOption[];
  onFiltersChange: (filters: FilterOption[]) => void;
  onApplyFilters: () => void;
  className?: string;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  categoryId,
  filters,
  onFiltersChange,
  onApplyFilters,
  className = ""
}) => {
  const { properties, loadProperties } = useCatalogData();

  // Загрузка свойств для категории
  React.useEffect(() => {
    if (categoryId) {
      loadProperties(categoryId);
    }
  }, [categoryId]);

  // Обновление фильтра
  const updateFilter = (filterId: string, value: any) => {
    const updatedFilters = filters.map(filter =>
      filter.id === filterId ? { ...filter, value } : filter
    );
    onFiltersChange(updatedFilters);
  };

  // Добавление нового фильтра
  const addFilter = (property: ProductProperty) => {
    const newFilter: FilterOption = {
      id: property.id,
      name: property.name,
      type: property.type,
      options: property.options ? property.options.split(',') : undefined,
      value: property.type === 'boolean' ? false : property.type === 'number' ? 0 : '',
      min: property.type === 'number' ? 0 : undefined,
      max: property.type === 'number' ? 1000000 : undefined
    };

    onFiltersChange([...filters, newFilter]);
  };

  // Удаление фильтра
  const removeFilter = (filterId: string) => {
    onFiltersChange(filters.filter(filter => filter.id !== filterId));
  };

  // Очистка всех фильтров
  const clearAllFilters = () => {
    onFiltersChange([]);
  };

  // Рендеринг поля фильтра
  const renderFilterField = (filter: FilterOption) => {
    switch (filter.type) {
      case 'select':
        return (
          <Select
            value={filter.value || ''}
            onValueChange={(value) => updateFilter(filter.id, value)}
          >
            <option value="">Все</option>
            {filter.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, parseFloat(e.target.value) || 0)}
            min={filter.min}
            max={filter.max}
            placeholder="Введите число"
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={filter.value}
              onChange={(e) => updateFilter(filter.id, e.target.checked)}
            />
            <span className="text-sm">Да</span>
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
          />
        );

      default: // text, file
        return (
          <Input
            type="text"
            value={filter.value || ''}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
            placeholder={`Введите ${filter.name.toLowerCase()}`}
          />
        );
    }
  };

  // Получение доступных свойств для добавления
  const availableProperties = properties.filter(prop => 
    !filters.some(filter => filter.id === prop.id) && prop.is_active
  );

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-800">Фильтры товаров</h3>
          {filters.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {filters.length}
            </span>
          )}
        </div>
        
        {filters.length > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Очистить все
          </button>
        )}
      </div>

      {/* Активные фильтры */}
      {filters.length > 0 && (
        <div className="space-y-3 mb-4">
          {filters.map(filter => (
            <div key={filter.id} className="flex items-center space-x-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filter.name}
                </label>
                {renderFilterField(filter)}
              </div>
              <button
                onClick={() => removeFilter(filter.id)}
                className="text-red-500 hover:text-red-700 p-1"
                title="Удалить фильтр"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Добавление нового фильтра */}
      {availableProperties.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Добавить фильтр:
          </label>
          <Select
            value=""
            onValueChange={(propertyId) => {
              const property = properties.find(p => p.id === propertyId);
              if (property) addFilter(property);
            }}
          >
            <option value="">Выберите свойство</option>
            {availableProperties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name} ({property.type})
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex space-x-2">
        <button
          onClick={onApplyFilters}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
          disabled={filters.length === 0}
        >
          <Search className="h-4 w-4" />
          <span>Применить фильтры</span>
        </button>
      </div>

      {/* Информация о доступных свойствах */}
      {properties.length === 0 && !categoryId && (
        <div className="text-sm text-gray-500 text-center py-4">
          Выберите категорию для загрузки доступных фильтров
        </div>
      )}

      {properties.length === 0 && categoryId && (
        <div className="text-sm text-gray-500 text-center py-4">
          В данной категории нет доступных свойств для фильтрации
        </div>
      )}
    </div>
  );
};

// Компонент для быстрого поиска
export const ProductSearch: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, onSearch, placeholder = "Поиск товаров...", className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && onSearch()}
        placeholder={placeholder}
        className="pl-10 pr-4"
      />
      <button
        onClick={onSearch}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
      >
        <Search className="h-5 w-5" />
      </button>
    </div>
  );
};




