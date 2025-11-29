'use client';

import React, { useState, useEffect } from 'react';
import { ProductFilterElement } from '../elements/ProductFilterRenderer';
import { BaseElement } from '../ProfessionalPageBuilder';

interface ProductFilterPropertiesPanelProps {
  selectedElement: ProductFilterElement;
  onUpdateElement: (id: string, updates: Partial<BaseElement>) => void;
}

interface Category {
  id: string;
  name: string;
  level: number;
  path: string;
}

export const ProductFilterPropertiesPanel: React.FC<ProductFilterPropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/catalog/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      clientLogger.error('Error loading categories:', error);
    }
  };

  const handlePropChange = (key: string, value: any) => {
    onUpdateElement(selectedElement.id, { 
      props: { ...selectedElement.props, [key]: value } 
    });
  };

  const handleStyleChange = (key: string, value: any) => {
    onUpdateElement(selectedElement.id, { 
      style: { ...selectedElement.style, [key]: value } 
    });
  };

  const renderBasicSettings = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">Основные настройки</h4>
      
      {/* Категория товаров */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Категория товаров</label>
        <select
          value={selectedElement.props.categoryId || ''}
          onChange={(e) => handlePropChange('categoryId', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Выберите категорию</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Плейсхолдер поиска */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Плейсхолдер поиска</label>
        <input
          type="text"
          value={selectedElement.props.searchPlaceholder || ''}
          onChange={(e) => handlePropChange('searchPlaceholder', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Поиск товаров..."
        />
      </div>

      {/* Ценовой диапазон */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Мин. цена</label>
          <input
            type="number"
            min="0"
            value={selectedElement.props.priceMin || ''}
            onChange={(e) => handlePropChange('priceMin', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Макс. цена</label>
          <input
            type="number"
            min="0"
            value={selectedElement.props.priceMax || ''}
            onChange={(e) => handlePropChange('priceMax', parseInt(e.target.value) || 100000)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderFilterOptions = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">Отображаемые фильтры</h4>
      
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showSearch || false}
            onChange={(e) => handlePropChange('showSearch', e.target.checked)}
            className="mr-3"
          />
          <span className="text-sm text-gray-700">Поиск по названию</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showPriceRange || false}
            onChange={(e) => handlePropChange('showPriceRange', e.target.checked)}
            className="mr-3"
          />
          <span className="text-sm text-gray-700">Ценовой диапазон</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showPropertyFilters || false}
            onChange={(e) => handlePropChange('showPropertyFilters', e.target.checked)}
            className="mr-3"
          />
          <span className="text-sm text-gray-700">Фильтры по свойствам</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showSorting || false}
            onChange={(e) => handlePropChange('showSorting', e.target.checked)}
            className="mr-3"
          />
          <span className="text-sm text-gray-700">Сортировка</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showViewToggle || false}
            onChange={(e) => handlePropChange('showViewToggle', e.target.checked)}
            className="mr-3"
          />
          <span className="text-sm text-gray-700">Переключатель вида</span>
        </label>
      </div>
    </div>
  );

  const renderSortingSettings = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">Настройки сортировки</h4>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Сортировка по умолчанию</label>
        <select
          value={selectedElement.props.sortBy || 'name'}
          onChange={(e) => handlePropChange('sortBy', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="name">По названию</option>
          <option value="price">По цене</option>
          <option value="popularity">По популярности</option>
          <option value="newest">По новизне</option>
          <option value="rating">По рейтингу</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Порядок сортировки</label>
        <select
          value={selectedElement.props.sortOrder || 'asc'}
          onChange={(e) => handlePropChange('sortOrder', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="asc">По возрастанию</option>
          <option value="desc">По убыванию</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Вид по умолчанию</label>
        <select
          value={selectedElement.props.viewMode || 'grid'}
          onChange={(e) => handlePropChange('viewMode', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="grid">Сетка</option>
          <option value="list">Список</option>
        </select>
      </div>
    </div>
  );

  const renderBehaviorSettings = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">Поведение</h4>
      
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.collapsed || false}
            onChange={(e) => handlePropChange('collapsed', e.target.checked)}
            className="mr-3"
          />
          <span className="text-sm text-gray-700">Свернут по умолчанию</span>
        </label>

        <div className="text-xs text-gray-500">
          <p>• Фильтры обновляются в реальном времени</p>
          <p>• Поддерживается множественный выбор</p>
          <p>• Автоматическая загрузка свойств из API</p>
        </div>
      </div>
    </div>
  );

  const renderStyleSettings = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">Стиль и размер</h4>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-500">Ширина</label>
          <input
            type="text"
            value={selectedElement.style.width || ''}
            onChange={(e) => handleStyleChange('width', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="300px"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Высота</label>
          <input
            type="text"
            value={selectedElement.style.height || ''}
            onChange={(e) => handleStyleChange('height', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="auto"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Отступы</label>
          <input
            type="text"
            value={selectedElement.style.padding || ''}
            onChange={(e) => handleStyleChange('padding', e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            placeholder="16px"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Фон</label>
          <input
            type="color"
            value={selectedElement.style.backgroundColor || '#ffffff'}
            onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
            className="w-full h-8 border border-gray-300 rounded"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Дополнительные стили (CSS)</label>
        <textarea
          value={selectedElement.style.customCSS || ''}
          onChange={(e) => handleStyleChange('customCSS', e.target.value)}
          rows={3}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
          placeholder="border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
        />
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <h3 className="text-lg font-semibold mb-4">Свойства панели фильтров</h3>

      {/* Основные настройки */}
      <div className="border-b pb-4">
        {renderBasicSettings()}
      </div>

      {/* Отображаемые фильтры */}
      <div className="border-b pb-4">
        {renderFilterOptions()}
      </div>

      {/* Настройки сортировки */}
      <div className="border-b pb-4">
        {renderSortingSettings()}
      </div>

      {/* Поведение */}
      <div className="border-b pb-4">
        {renderBehaviorSettings()}
      </div>

      {/* Стиль */}
      <div>
        {renderStyleSettings()}
      </div>
    </div>
  );
};

