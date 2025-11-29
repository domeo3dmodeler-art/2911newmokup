'use client';

import React from 'react';
import { CalculatorComponent } from '../components/CalculatorComponents';

export interface CalculatorElement {
  id: string
  type: string
  name: string
  props: Record<string, any>
  categoryId?: string
  productId?: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  style?: Record<string, any>
}

interface CalculatorElementRendererProps {
  element: CalculatorElement
  onUpdate: (id: string, updates: Partial<CalculatorElement>) => void
  isSelected: boolean
  onSelect: () => void
}

// ===================== КОМПОНЕНТЫ ДЛЯ КОНСТРУКТОРА =====================

const DoorConfigurator: React.FC<CalculatorElementRendererProps> = ({ element, onUpdate }) => {
  return (
    <div className="w-full h-full bg-white border-2 border-dashed border-blue-300 rounded-lg p-4 flex flex-col items-center justify-center">
      <div className="text-blue-600 mb-2">
        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 10H7c-1.1 0-2 .9-2 2s.9 2 2 2h10c1.1 0 2-.9 2-2s-.9-2-2-2z"/>
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Конфигуратор дверей</h3>
      <p className="text-sm text-gray-600 text-center mb-4">
        Выбор стиля, модели, покрытия, цвета и размеров двери
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Стиль</span>
        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Модель</span>
        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Покрытие</span>
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Цвет</span>
        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Размеры</span>
      </div>
    </div>
  );
};

const PriceCalculator: React.FC<CalculatorElementRendererProps> = ({ element, onUpdate }) => {
  return (
    <div className="w-full h-full bg-gradient-to-br from-green-50 to-green-100 border border-green-300 rounded-lg p-4 flex flex-col items-center justify-center">
      <div className="text-green-600 mb-2">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0h-.01M16 16h4a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h4"/>
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Калькулятор цены</h3>
      <p className="text-sm text-gray-600 text-center mb-4">
        Динамический расчет стоимости конфигурации
      </p>
      <div className="bg-white rounded-lg p-3 shadow-sm border">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">250 000 ₽</div>
          <div className="text-sm text-gray-500">за полный комплект</div>
        </div>
      </div>
    </div>
  );
};

const PropertyFilter: React.FC<CalculatorElementRendererProps> = ({ element, onUpdate }) => {
  return (
    <div className="w-full h-full bg-gray-50 border border-gray-300 rounded-lg p-4 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Фильтры свойств</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Стиль</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option>Все стили</option>
            <option>Скрытая</option>
            <option>Современная</option>
            <option>Неоклассика</option>
            <option>Классика</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Цвет</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
            <option>Все цвета</option>
            <option>Белый дуб</option>
            <option>Орех</option>
            <option>Черный ясень</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Цена</label>
          <input type="range" className="w-full" min="0" max="500000" defaultValue="250000" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0 ₽</span>
            <span>500 000 ₽</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductGrid: React.FC<CalculatorElementRendererProps> = ({ element, onUpdate }) => {
  const mockProducts = [
    { name: 'PO Base 1/1', price: '28 000 ₽', style: 'Скрытая' },
    { name: 'PG Base 1', price: '25 000 ₽', style: 'Современная' },
    { name: 'Neo-1', price: '32 000 ₽', style: 'Неоклассика' },
    { name: 'Classic Pro', price: '45 000 ₽', style: 'Классика' }
  ];

  return (
    <div className="w-full h-full bg-white border border-gray-300 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Сетка товаров</h3>
      <div className="grid grid-cols-2 gap-3">
        {mockProducts.map((product, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
            <div className="h-16 bg-gray-100 rounded mb-2 flex items-center justify-center">
              <span className="text-gray-400 text-xs">Фото {product.name}</span>
            </div>
            <h4 className="font-medium text-sm text-gray-800 mb-1">{product.name}</h4>
            <div className="text-xs text-blue-600 mb-1">{product.price}</div>
            <div className="text-xs text-gray-500">{product.style}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SearchBar: React.FC<CalculatorElementRendererProps> = ({ element, onUpdate }) => {
  return (
    <div className="w-full h-full bg-white border border-gray-300 rounded-lg p-4 flex items-center">
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Поиск дверей, артикулов, описаний..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

// ===================== ОСНОВНОЙ РЕНДЕР =====================

export const CalculatorElementRenderer: React.FC<CalculatorElementRendererProps> = ({ 
  element, 
  onUpdate, 
  isSelected, 
  onSelect 
}) => {
  const renderElementContent = () => {
    switch (element.type) {
      case 'door-configurator':
        return <DoorConfigurator element={element} onUpdate={onUpdate} isSelected={isSelected} onSelect={onSelect} />;
      case 'price-calculator':
        return <PriceCalculator element={element} onUpdate={onUpdate} isSelected={isSelected} onSelect={onSelect} />;
      case 'property-filter':
        return <PropertyFilter element={element} onUpdate={onUpdate} isSelected={isSelected} onSelect={onSelect} />;
      case 'product-grid':
        return <ProductGrid element={element} onUpdate={onUpdate} isSelected={isSelected} onSelect={onSelect} />;
      case 'search-bar':
        return <SearchBar element={element} onUpdate={onUpdate} isSelected={isSelected} onSelect={onSelect} />;
      default:
        return (
          <div className="w-full h-full bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-1">{element.name}</h3>
              <p className="text-sm text-gray-500">Компонент калькулятора</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={`
        relative w-full h-full
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        cursor-pointer transition-all duration-200 hover:shadow-lg
      `}
      onClick={onSelect}
      style={{
        width: element.size.width,
        height: element.size.height,
      }}
    >
      {renderElementContent()}
      
      {/* Индикатор типа компонента */}
      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-md">
        {element.type}
      </div>
      
      {/* Кнопки управления */}
      {isSelected && (
        <div className="absolute -top-10 left-0 flex space-x-1 bg-white rounded shadow-md p-1">
          <button className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-2-4l-8 8m0-7l7 7m0 0l4 4m-4-4h-1.5m1.5-4h-1.5m1.5 4a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
          <button className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

