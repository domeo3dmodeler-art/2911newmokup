'use client';

import React, { useState, useEffect } from 'react';
import { ProductElement } from '../elements/ProductElementRenderer';
import { BaseElement } from '../ProfessionalPageBuilder';

interface ProductPropertiesPanelProps {
  selectedElement: ProductElement;
  onUpdateElement: (id: string, updates: Partial<BaseElement>) => void;
}

interface Category {
  id: string;
  name: string;
  level: number;
  path: string;
}

export const ProductPropertiesPanel: React.FC<ProductPropertiesPanelProps> = ({
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

  const renderGeneralProperties = () => (
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

      {/* Режим отображения */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Режим отображения</label>
        <select
          value={selectedElement.props.displayMode || 'grid'}
          onChange={(e) => handlePropChange('displayMode', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="grid">Сетка</option>
          <option value="list">Список</option>
          <option value="carousel">Карусель</option>
        </select>
      </div>

      {/* Количество товаров на странице */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Товаров на странице</label>
        <input
          type="number"
          min="1"
          max="100"
          value={selectedElement.props.itemsPerPage || 12}
          onChange={(e) => handlePropChange('itemsPerPage', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Сортировка */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Сортировать по</label>
          <select
            value={selectedElement.props.sortBy || 'name'}
            onChange={(e) => handlePropChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="name">Названию</option>
            <option value="base_price">Цене</option>
            <option value="created_at">Дате добавления</option>
            <option value="sku">Артикулу</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Порядок</label>
          <select
            value={selectedElement.props.sortOrder || 'asc'}
            onChange={(e) => handlePropChange('sortOrder', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="asc">По возрастанию</option>
            <option value="desc">По убыванию</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderDisplayOptions = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">Отображение</h4>
      
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showFilters || false}
            onChange={(e) => handlePropChange('showFilters', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Показывать фильтры</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showSearch || false}
            onChange={(e) => handlePropChange('showSearch', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Показывать поиск</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showImages || false}
            onChange={(e) => handlePropChange('showImages', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Показывать изображения</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showPrices || false}
            onChange={(e) => handlePropChange('showPrices', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Показывать цены</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showDescription || false}
            onChange={(e) => handlePropChange('showDescription', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Показывать описания</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showAddToCart || false}
            onChange={(e) => handlePropChange('showAddToCart', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Кнопка "В корзину"</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showFavorites || false}
            onChange={(e) => handlePropChange('showFavorites', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Кнопка "Избранное"</span>
        </label>
      </div>
    </div>
  );

  const renderStyleProperties = () => (
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
            placeholder="100%"
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
            placeholder="20px"
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

  const renderSpecificProperties = () => {
    switch (selectedElement.type) {
      case 'product-search':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Настройки поиска</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Заглушка поиска</label>
              <input
                type="text"
                value={selectedElement.props.searchQuery || ''}
                onChange={(e) => handlePropChange('searchQuery', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Введите название товара..."
              />
            </div>
          </div>
        );

      case 'price-calculator':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Настройки калькулятора</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Формула расчета</label>
              <textarea
                value={selectedElement.props.formula || ''}
                onChange={(e) => handlePropChange('formula', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="base_price * quantity * (1 + tax_rate)"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h3 className="text-lg font-semibold mb-4">Свойства компонента товаров</h3>

      {/* Основные настройки */}
      <div className="border-b pb-4">
        {renderGeneralProperties()}
      </div>

      {/* Опции отображения */}
      <div className="border-b pb-4">
        {renderDisplayOptions()}
      </div>

      {/* Специфичные свойства */}
      {renderSpecificProperties() && (
        <div className="border-b pb-4">
          {renderSpecificProperties()}
        </div>
      )}

      {/* Стиль */}
      <div>
        {renderStyleProperties()}
      </div>
    </div>
  );
};

