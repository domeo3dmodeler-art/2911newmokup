'use client';

import React, { useState, useEffect } from 'react';
import { DoorConfiguratorElement } from '../elements/DoorConfiguratorRenderer';
import { BaseElement } from '../ProfessionalPageBuilder';

interface DoorConfiguratorPropertiesPanelProps {
  selectedElement: DoorConfiguratorElement;
  onUpdateElement: (id: string, updates: Partial<BaseElement>) => void;
}

interface Category {
  id: string;
  name: string;
  level: number;
  path: string;
}

export const DoorConfiguratorPropertiesPanel: React.FC<DoorConfiguratorPropertiesPanelProps> = ({
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Категория дверей</label>
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

      {/* Тип конфигуратора */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Тип конфигуратора</label>
        <select
          value={selectedElement.props.configuratorType || 'step-by-step'}
          onChange={(e) => handlePropChange('configuratorType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="step-by-step">Пошаговый</option>
          <option value="all-at-once">Все сразу</option>
          <option value="guided">С подсказками</option>
        </select>
      </div>

      {/* Количество шагов */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Текущий шаг</label>
          <input
            type="number"
            min="1"
            max="5"
            value={selectedElement.props.currentStep || 1}
            onChange={(e) => handlePropChange('currentStep', parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Всего шагов</label>
          <input
            type="number"
            min="1"
            max="10"
            value={selectedElement.props.totalSteps || 4}
            onChange={(e) => handlePropChange('totalSteps', parseInt(e.target.value) || 4)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderStepSettings = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">Настройки шагов</h4>
      
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showStyleSelector || false}
            onChange={(e) => handlePropChange('showStyleSelector', e.target.checked)}
            className="mr-3"
          />
          <span className="text-sm text-gray-700">Выбор стиля</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showColorSelector || false}
            onChange={(e) => handlePropChange('showColorSelector', e.target.checked)}
            className="mr-3"
          />
          <span className="text-sm text-gray-700">Выбор цвета</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showMaterialSelector || false}
            onChange={(e) => handlePropChange('showMaterialSelector', e.target.checked)}
            className="mr-3"
          />
          <span className="text-sm text-gray-700">Выбор материала</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showSizeSelector || false}
            onChange={(e) => handlePropChange('showSizeSelector', e.target.checked)}
            className="mr-3"
          />
          <span className="text-sm text-gray-700">Выбор размера</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showProgress || false}
            onChange={(e) => handlePropChange('showProgress', e.target.checked)}
            className="mr-3"
          />
          <span className="text-sm text-gray-700">Прогресс-бар</span>
        </label>
      </div>
    </div>
  );

  const renderDisplaySettings = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">Отображение</h4>
      
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showPriceDisplay || false}
            onChange={(e) => handlePropChange('showPriceDisplay', e.target.checked)}
            className="mr-3"
          />
          <span className="text-sm text-gray-700">Отображение цены</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showProductDetails || false}
            onChange={(e) => handlePropChange('showProductDetails', e.target.checked)}
            className="mr-3"
          />
          <span className="text-sm text-gray-700">Детали товара</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showRecommendations || false}
            onChange={(e) => handlePropChange('showRecommendations', e.target.checked)}
            className="mr-3"
          />
          <span className="text-sm text-gray-700">Рекомендации</span>
        </label>
      </div>
    </div>
  );

  const renderDefaultSelections = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">Значения по умолчанию</h4>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Стиль по умолчанию</label>
        <select
          value={selectedElement.props.selectedStyle || ''}
          onChange={(e) => handlePropChange('selectedStyle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Не выбран</option>
          <option value="classic">Классика</option>
          <option value="modern">Модерн</option>
          <option value="scandinavian">Скандинавский</option>
          <option value="loft">Лофт</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Цвет по умолчанию</label>
        <select
          value={selectedElement.props.selectedColor || ''}
          onChange={(e) => handlePropChange('selectedColor', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Не выбран</option>
          <option value="white">Белый</option>
          <option value="oak">Дуб</option>
          <option value="walnut">Орех</option>
          <option value="black">Черный</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Материал по умолчанию</label>
        <select
          value={selectedElement.props.selectedMaterial || ''}
          onChange={(e) => handlePropChange('selectedMaterial', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Не выбран</option>
          <option value="mdf">МДФ</option>
          <option value="solid-wood">Массив дерева</option>
          <option value="veneer">Шпон</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Размер по умолчанию</label>
        <select
          value={selectedElement.props.selectedSize || ''}
          onChange={(e) => handlePropChange('selectedSize', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Не выбран</option>
          <option value="standard">Стандарт (80x200)</option>
          <option value="wide">Широкая (90x200)</option>
          <option value="tall">Высокая (80x210)</option>
          <option value="custom">Нестандарт (100x220)</option>
        </select>
      </div>
    </div>
  );

  const renderBehaviorSettings = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">Поведение</h4>
      
      <div className="space-y-3">
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-600">
            <p className="mb-1">• Автоматический переход между шагами</p>
            <p className="mb-1">• Сохранение выбранных значений</p>
            <p className="mb-1">• Расчет цены в реальном времени</p>
            <p>• Валидация обязательных полей</p>
          </div>
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
            placeholder="24px"
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
          placeholder="border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
        />
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <h3 className="text-lg font-semibold mb-4">Свойства конфигуратора дверей</h3>

      {/* Основные настройки */}
      <div className="border-b pb-4">
        {renderBasicSettings()}
      </div>

      {/* Настройки шагов */}
      <div className="border-b pb-4">
        {renderStepSettings()}
      </div>

      {/* Отображение */}
      <div className="border-b pb-4">
        {renderDisplaySettings()}
      </div>

      {/* Значения по умолчанию */}
      <div className="border-b pb-4">
        {renderDefaultSelections()}
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

