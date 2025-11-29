'use client';

import React, { useState } from 'react';
import { ComponentsPanelProps } from '../types';
import { getBlockName, getBlockDescription, getBlockCategory } from '../../../lib/block-names';

interface ComponentCategory {
  id: string;
  name: string;
  icon: string;
  components: ComponentItem[];
}

interface ComponentItem {
  id: string;
  name: string;
  type: string;
  icon: string;
  description: string;
}

// Компоненты для товарных страниц
const componentCategories: ComponentCategory[] = [
  {
    id: 'essential',
    name: 'Основные элементы',
    icon: '⭐',
    components: [
      { id: 'heading', name: getBlockName('heading'), type: 'heading', icon: '📰', description: getBlockDescription('heading') },
      { id: 'text', name: getBlockName('text'), type: 'text', icon: '📝', description: getBlockDescription('text') },
      { id: 'button', name: getBlockName('button'), type: 'button', icon: '🔘', description: getBlockDescription('button') },
      { id: 'image', name: getBlockName('image'), type: 'image', icon: '🖼️', description: getBlockDescription('image') }
    ]
  },
  {
    id: 'products',
    name: 'Товарные компоненты',
    icon: '📦',
    components: [
      { id: 'productCard', name: 'Карточка товара', type: 'productCard', icon: '🛍️', description: 'Карточка товара с изображением и ценой' },
      { id: 'productGallery', name: 'Галерея товара', type: 'productGallery', icon: '🖼️', description: 'Галерея изображений товара' },
      { id: 'productDetails', name: 'Детали товара', type: 'productDetails', icon: '📋', description: 'Подробное описание и характеристики' },
      { id: 'productGrid', name: getBlockName('productGrid'), type: 'productGrid', icon: '📊', description: getBlockDescription('productGrid') },
      { id: 'filteredProducts', name: 'Фильтрованные товары', type: 'filteredProducts', icon: '🔍', description: 'Товары с возможностью фильтрации через связи' }
    ]
  },
  {
    id: 'configurators',
    name: 'Конфигураторы',
    icon: '⚙️',
    components: [
      { id: 'stepWizard', name: getBlockName('stepWizard'), type: 'stepWizard', icon: '🧙', description: getBlockDescription('stepWizard') },
      { id: 'comparisonTable', name: getBlockName('comparisonTable'), type: 'comparisonTable', icon: '📊', description: getBlockDescription('comparisonTable') }
    ]
  },
  {
    id: 'forms',
    name: 'Формы и поля',
    icon: '📝',
    components: [
      { id: 'input', name: 'Поле ввода', type: 'input', icon: '📝', description: 'Поле для ввода текста или чисел' },
      { id: 'select', name: 'Выпадающий список', type: 'select', icon: '📋', description: 'Выбор из списка опций' },
      { id: 'checkbox', name: 'Чекбокс', type: 'checkbox', icon: '☑️', description: 'Множественный выбор опций' },
      { id: 'radio', name: 'Радиокнопка', type: 'radio', icon: '🔘', description: 'Одиночный выбор из группы' },
      { id: 'productFilter', name: 'Фильтр товаров', type: 'productFilter', icon: '🔍', description: 'Интерактивный фильтр для товаров' },
      { id: 'propertyFilter', name: 'Фильтр по свойству', type: 'propertyFilter', icon: '🏷️', description: 'Универсальный фильтр по любому свойству товара' }
    ]
  },
  {
    id: 'layout',
    name: 'Структура страницы',
    icon: '🏗️',
    components: [
      { id: 'section', name: getBlockName('section'), type: 'section', icon: '📋', description: getBlockDescription('section') },
      { id: 'spacer', name: getBlockName('spacer'), type: 'spacer', icon: '↔️', description: getBlockDescription('spacer') },
      { id: 'cart', name: getBlockName('cart'), type: 'cart', icon: '🛒', description: getBlockDescription('cart') },
      { id: 'featureStatus', name: 'Статус функций', type: 'featureStatus', icon: '🧪', description: 'Показывает статус работы функций конструктора' }
    ]
  }
];

export function ComponentsPanel({ onAddElement, selectedCategory }: ComponentsPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['essential', 'products', 'configurators', 'forms']);
  const [searchQuery, setSearchQuery] = useState('');

  // Фильтрация компонентов по поиску
  const filteredCategories = componentCategories.map(category => ({
    ...category,
    components: category.components.filter(component =>
      component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.components.length > 0);

  // Переключение категории
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Обработчик добавления элемента
  const handleAddElement = (elementType: string) => {
    // Добавляем элемент в центр canvas
    onAddElement(elementType, { x: 400, y: 300 });
  };

  // Обработчик начала перетаскивания
  const handleDragStart = (e: React.DragEvent, elementType: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'component',
      elementType: elementType
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Компоненты</h3>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск компонентов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Components List */}
      <div className="flex-1 overflow-y-auto">
        {filteredCategories.map((category) => (
          <div key={category.id} className="border-b border-gray-100">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{category.icon}</span>
                <span className="font-medium text-gray-900">{category.name}</span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  expandedCategories.includes(category.id) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Components */}
            {expandedCategories.includes(category.id) && (
              <div className="pb-2">
                {category.components.map((component) => (
                  <button
                    key={component.id}
                    onClick={() => handleAddElement(component.type)}
                    onDragStart={(e) => handleDragStart(e, component.type)}
                    draggable={true}
                    className="w-full px-6 py-2 flex items-center space-x-3 text-left hover:bg-gray-50 group cursor-grab active:cursor-grabbing"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">
                      {component.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 text-sm">
                        {component.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {component.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {filteredCategories.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Компоненты не найдены</h4>
            <p className="text-gray-500 text-sm">
              Попробуйте изменить поисковый запрос
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          Перетащите компонент на canvas или кликните для добавления
        </div>
      </div>
    </div>
  );
}
