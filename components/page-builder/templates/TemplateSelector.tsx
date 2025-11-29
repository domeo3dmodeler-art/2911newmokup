'use client';

import React from 'react';
import { BaseElement } from '../types';

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  elements: BaseElement[];
}

interface TemplateSelectorProps {
  onSelectTemplate: (template: PageTemplate) => void;
  onClose: () => void;
}

const pageTemplates: PageTemplate[] = [
  {
    id: 'product-catalog',
    name: 'Каталог товаров',
    description: 'Полноценный каталог с деревом категорий, товарами и конфигуратором',
    thumbnail: '📦',
    category: 'E-commerce',
    elements: [
      {
        id: 'catalog-tree',
        type: 'catalogTree',
        position: { x: 0, y: 0 },
        size: { width: 300, height: 800 },
        constraints: { minWidth: 250, minHeight: 400 },
        style: { backgroundColor: '#f8fafc', border: { width: 1, color: '#e5e7eb', style: 'solid' } },
        props: { title: 'Каталог товаров', selectedCategoryIds: [] },
        visible: true,
        locked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'product-grid',
        type: 'productGrid',
        position: { x: 320, y: 0 },
        size: { width: 880, height: 600 },
        constraints: { minWidth: 300, minHeight: 200 },
        style: { backgroundColor: '#ffffff', padding: { top: 20, right: 20, bottom: 20, left: 20 } },
        props: { title: 'Товары', categoryIds: [], limit: 12 },
        visible: true,
        locked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'product-configurator',
        type: 'productConfigurator',
        position: { x: 320, y: 620 },
        size: { width: 880, height: 380 },
        constraints: { minWidth: 300, minHeight: 200 },
        style: { backgroundColor: '#eff6ff', padding: { top: 20, right: 20, bottom: 20, left: 20 } },
        props: { title: 'Конфигуратор товаров', categoryIds: [], limit: 6 },
        visible: true,
        locked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'cart',
        type: 'cart',
        position: { x: 50, y: 820 },
        size: { width: 60, height: 60 },
        constraints: { minWidth: 60, minHeight: 60 },
        style: {},
        props: {},
        visible: true,
        locked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }
];

export function TemplateSelector({ onSelectTemplate, onClose }: TemplateSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Выберите шаблон</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-2">Выберите готовый шаблон для быстрого старта</p>
        </div>

        {/* Templates */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pageTemplates.map(template => (
              <div
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">{template.thumbnail}</div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{template.name}</h4>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  <div className="text-xs text-gray-500">
                    {template.elements.length} элементов
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Или создайте страницу с нуля
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Создать с нуля
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}