'use client';

import React from 'react';

// Базовый компонент для рендеринга NoCode элементов
export function NoCodeComponentRenderer({ template }: { template: any }) {
  if (!template || !template.components) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="text-4xl mb-4"></div>
        <h3 className="text-xl font-medium mb-2">Конфигуратор</h3>
        <p className="text-sm">Шаблон не настроен</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Конфигуратор товаров</h1>
        <p className="text-gray-600">Настройте параметры товара</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {template.components.map((component: any) => (
          <div
            key={component.id}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl"></span>
              <h3 className="text-lg font-semibold text-gray-900">{component.title}</h3>
            </div>
            
            <div className="space-y-3">
              {component.type === 'product-grid' && (
                <div className="text-sm text-gray-600">
                  <p>Сетка товаров ({component.config?.columns || 3} колонок)</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-gray-100 rounded border-2 border-dashed border-gray-300"></div>
                    ))}
                  </div>
                </div>
              )}
              
              {component.type === 'filter-panel' && (
                <div className="text-sm text-gray-600">
                  <p>Панель фильтров</p>
                  <div className="mt-2 space-y-2">
                    <div className="h-4 bg-gray-100 rounded"></div>
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                  </div>
                </div>
              )}
              
              {component.type === 'search-bar' && (
                <div className="text-sm text-gray-600">
                  <p>Поиск</p>
                  <div className="mt-2 h-8 bg-gray-100 rounded border-2 border-dashed border-gray-300"></div>
                </div>
              )}
              
              {component.type === 'cart-summary' && (
                <div className="text-sm text-gray-600">
                  <p>Корзина</p>
                  <div className="mt-2 h-20 bg-gray-100 rounded border-2 border-dashed border-gray-300"></div>
                </div>
              )}
              
              {component.type === 'price-calculator' && (
                <div className="text-sm text-gray-600">
                  <p>Калькулятор цен</p>
                  <div className="mt-2 h-16 bg-gray-100 rounded border-2 border-dashed border-gray-300"></div>
                </div>
              )}
              
              {component.type === 'image-gallery' && (
                <div className="text-sm text-gray-600">
                  <p>Галерея изображений</p>
                  <div className="mt-2 h-24 bg-gray-100 rounded border-2 border-dashed border-gray-300"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Экспорт по умолчанию
export default NoCodeComponentRenderer;
