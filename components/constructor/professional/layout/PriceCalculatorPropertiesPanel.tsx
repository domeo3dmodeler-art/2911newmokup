'use client';

import React, { useState, useEffect } from 'react';
import { PriceCalculatorElement } from '../elements/PriceCalculatorRenderer';
import { BaseElement } from '../ProfessionalPageBuilder';
import { clientLogger } from '@/lib/logging/client-logger';

interface PriceCalculatorPropertiesPanelProps {
  selectedElement: PriceCalculatorElement;
  onUpdateElement: (id: string, updates: Partial<BaseElement>) => void;
}

interface Category {
  id: string;
  name: string;
  level: number;
  path: string;
}

export const PriceCalculatorPropertiesPanel: React.FC<PriceCalculatorPropertiesPanelProps> = ({
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

      {/* Базовая цена (если категория не выбрана) */}
      {!selectedElement.props.categoryId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Базовая цена</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={selectedElement.props.basePrice || ''}
            onChange={(e) => handlePropChange('basePrice', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      )}

      {/* Валюта */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Валюта</label>
        <select
          value={selectedElement.props.currency || 'RUB'}
          onChange={(e) => handlePropChange('currency', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="RUB">₽ (Рубль)</option>
          <option value="USD">$ (Доллар)</option>
          <option value="EUR">€ (Евро)</option>
        </select>
      </div>

      {/* Формула расчета */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Формула расчета</label>
        <textarea
          value={selectedElement.props.formula || ''}
          onChange={(e) => handlePropChange('formula', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="basePrice * quantity * (1 + taxRate)"
        />
        <p className="text-xs text-gray-500 mt-1">
          Используйте переменные: basePrice, quantity, taxRate, deliveryRate, installationRate
        </p>
      </div>
    </div>
  );

  const renderCalculationSettings = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">Настройки расчета</h4>
      
      <div className="space-y-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showBreakdown || false}
            onChange={(e) => handlePropChange('showBreakdown', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Показывать разбивку стоимости</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showDelivery || false}
            onChange={(e) => handlePropChange('showDelivery', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Включить расчет доставки</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showInstallation || false}
            onChange={(e) => handlePropChange('showInstallation', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Включить расчет монтажа</span>
        </label>

        <label className="flex items-center">
          <input
            type="checkbox"
            checked={selectedElement.props.showDiscounts || false}
            onChange={(e) => handlePropChange('showDiscounts', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Включить систему скидок</span>
        </label>
      </div>

      {/* Ставки и коэффициенты */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Ставка доставки (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={((selectedElement.props.deliveryRate || 0.05) * 100).toFixed(1)}
            onChange={(e) => handlePropChange('deliveryRate', (parseFloat(e.target.value) || 0) / 100)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Ставка монтажа (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={((selectedElement.props.installationRate || 0.1) * 100).toFixed(1)}
            onChange={(e) => handlePropChange('installationRate', (parseFloat(e.target.value) || 0) / 100)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">НДС (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={((selectedElement.props.taxRate || 0.2) * 100).toFixed(1)}
            onChange={(e) => handlePropChange('taxRate', (parseFloat(e.target.value) || 0) / 100)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Начальное количество</label>
          <input
            type="number"
            min="1"
            value={selectedElement.props.quantity || 1}
            onChange={(e) => handlePropChange('quantity', parseInt(e.target.value) || 1)}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>
    </div>
  );

  const renderDiscountRules = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-700">Правила скидок</h4>
      
      <div className="space-y-3">
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between text-sm">
            <span>От 5 штук</span>
            <span className="text-green-600 font-medium">5% скидка</span>
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between text-sm">
            <span>От 10 штук</span>
            <span className="text-green-600 font-medium">10% скидка</span>
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="flex items-center justify-between text-sm">
            <span>От 50 штук</span>
            <span className="text-green-600 font-medium">15% скидка</span>
          </div>
        </div>
      </div>

      <button className="w-full py-2 px-3 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
        + Добавить правило скидки
      </button>
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

  return (
    <div className="p-4 space-y-6">
      <h3 className="text-lg font-semibold mb-4">Свойства калькулятора цены</h3>

      {/* Основные настройки */}
      <div className="border-b pb-4">
        {renderBasicSettings()}
      </div>

      {/* Настройки расчета */}
      <div className="border-b pb-4">
        {renderCalculationSettings()}
      </div>

      {/* Правила скидок */}
      {selectedElement.props.showDiscounts && (
        <div className="border-b pb-4">
          {renderDiscountRules()}
        </div>
      )}

      {/* Стиль */}
      <div>
        {renderStyleSettings()}
      </div>
    </div>
  );
};

