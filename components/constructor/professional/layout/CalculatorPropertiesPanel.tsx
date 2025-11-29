'use client';

import React from 'react';
import { CalculatorElement } from '../elements/CalculatorElementRenderer';

interface CalculatorPropertiesPanelProps {
  selectedElement: CalculatorElement | null
  onUpdateElement: (id: string, updates: Partial<CalculatorElement>) => void
}

export const CalculatorPropertiesPanel: React.FC<CalculatorPropertiesPanelProps> = ({
  selectedElement,
  onUpdateElement
}) => {
  if (!selectedElement) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Свойства компонента</h3>
        </div>
        <div className="p-4 flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Выберите компонент для редактирования</p>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: any) => {
    onUpdateElement(selectedElement.id, {
      props: {
        ...selectedElement.props,
        [field]: value
      }
    });
  };

  const handleStyleChange = (field: string, value: any) => {
    onUpdateElement(selectedElement.id, {
      style: {
        ...selectedElement.style,
        [field]: value
      }
    });
  };

  const renderSpecificProperties = () => {
    switch (selectedElement.type) {
      case 'door-configurator':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Настройки конфигуратора</label>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox" 
                      checked={selectedElement.props.showStyles || false}
                      onChange={(e) => handleInputChange('showStyles', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Показать выбор стилей</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox" 
                      checked={selectedElement.props.showColors || false}
                      onChange={(e) => handleInputChange('showColors', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Показать выбор цветов</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox" 
                      checked={selectedElement.props.showSizes || false}
                      onChange={(e) => handleInputChange('showSizes', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Показать выбор размеров</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Категория товаров</label>
              <select
                value={selectedElement.categoryId || ''}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Выберите категорию</option>
                <option value="doors">Двери</option>
                <option value="handles">Ручки</option>
                <option value="kits">Комплекты фурнитуры</option>
              </select>
            </div>
          </div>
        );

      case 'price-calculator':
        return (
          <div className="space-y-4">
            <div>
              <label className=" block text-sm font-medium text-gray-700 mb-2">Настройки калькулятора</label>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox" 
                      checked={selectedElement.props.showBreakdown || false}
                      onChange={(e) => handleInputChange('showBreakdown', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Показать разбивку стоимости</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox" 
                      checked={selectedElement.props.showDiscounts || false}
                      onChange={(e) => handleInputChange('showDiscounts', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Показать скидки</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox" 
                      checked={selectedElement.props.showCurrency || false}
                      onChange={(e) => handleInputChange('showCurrency', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Показать валюту</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Валюта</label>
              <select
                value={selectedElement.props.currency || 'RUB'}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="RUB">Рубли (₽)</option>
                <option value="USD">Доллары ($)</option>
                <option value="EUR">Евро (€)</option>
              </select>
            </div>
          </div>
        );

      case 'property-filter':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Доступные фильтры</label>
              <div className="space-y-2">
                {['style', 'color', 'material', 'price', 'brand'].map(filter => (
                  <label key={filter} className="flex items-center">
                    <input
                      type="checkbox" 
                      checked={selectedElement.props[`filter_${filter}`] || false}
                      onChange={(e) => handleInputChange(`filter_${filter}`, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600 capitalize">{filter}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Расположение фильтров</label>
              <select
                value={selectedElement.props.layout || 'vertical'}
                onChange={(e) => handleInputChange('layout', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="vertical">По вертикали</option>
                <option value="horizontal">По горизонтали</option>
                <option value="grid">В сетке</option>
              </select>
            </div>
          </div>
        );

      case 'product-grid':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Количество колонок</label>
              <input
                type="number"
                min="1"
                max="6"
                value={selectedElement.props.columns || 3}
                onChange={(e) => handleInputChange('columns', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Количество строк</label>
              <input
                type="number"
                min="1"
                max="10"
                value={selectedElement.props.rows || 4}
                onChange={(e) => handleInputChange('rows', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Информация о товарах</label>
              <div className="space-y-2">
                {['image', 'name', 'price', 'brand', 'sku'].map(field => (
                  <label key={field} className="flex items-center">
                    <input
                      type="checkbox" 
                      checked={selectedElement.props[`show_${field}`] !== false}
                      onChange={(e) => handleInputChange(`show_${field}`, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600 capitalize">{field}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'search-bar':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Поисковые поля</label>
              <div className="space-y-2">
                {['name', 'sku', 'description', 'brand'].map(field => (
                  <label key={field} className="flex items-center">
                    <input
                      type="checkbox" 
                      checked={selectedElement.props[`search_${field}`] !== false}
                      onChange={(e) => handleInputChange(`search_${field}`, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600 capitalize">{field}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Плейсхолдер</label>
              <input
                type="text"
                value={selectedElement.props.placeholder || 'Поиск товаров...'}
                onChange={(e) => handleInputChange('placeholder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Текст поисковой строки"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">Нет специальных настроек для данного компонента</p>
          </div>
        );
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Заголовок */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Свойства компонента</h3>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            {selectedElement.type}
          </span>
        </div>
      </div>

      {/* Основные свойства */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Основные</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Название</label>
            <input
              type="text"
              value={selectedElement.name}
              onChange={(e) => onUpdateElement(selectedElement.id, { name: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ширина</label>
              <input
                type="number"
                value={selectedElement.size.width}
                onChange={(e) => onUpdateElement(selectedElement.id, { 
                  size: { ...selectedElement.size, width: parseInt(e.target.value) }
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Высота</label>
              <input
                type="number"
                value={selectedElement.size.height}
                onChange={(e) => onUpdateElement(selectedElement.id, { 
                  size: { ...selectedElement.size, height: parseInt(e.target.value) }
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Специфичные свойства */}
      <div className="p-4 flex-1 overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Конфигурация</h4>
        {renderSpecificProperties()}
      </div>
    </div>
  );
};

