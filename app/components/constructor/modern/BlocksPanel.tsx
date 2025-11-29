'use client';

import React from 'react';

interface BlockType {
  id: string
  name: string
  icon: string
  description: string
  category: 'layout' | 'content' | 'products'
}

interface BlocksPanelProps {
  onAddBlock: (type: string) => void
}

const BLOCK_TYPES: BlockType[] = [
  // Layout blocks
  {
    id: 'container',
    name: 'Контейнер',
    icon: '📦',
    description: 'Контейнер для групп элементов',
    category: 'layout'
  },
  {
    id: 'spacer',
    name: 'Отступ',
    icon: '⬜',
    description: 'Горизонтальный отступ',
    category: 'layout'
  },

  // Content blocks
  {
    id: 'text',
    name: 'Текст',
    icon: '📝',
    description: 'Блок текста',
    category: 'content'
  },
  {
    id: 'image',
    name: 'Изображение',
    icon: '🖼️',
    description: 'Изображение или фото',
    category: 'content'
  },

  // Product blocks
  {
    id: 'product-catalog',
    name: 'Каталог товаров',
    icon: '🏪',
    description: 'Сетка товаров с фильтрами',
    category: 'products'
  },
  {
    id: 'product-detail',
    name: 'Детали товара',
    icon: '📦',
    description: 'Полная информация о товаре',
    category: 'products'
  },
  {
    id: 'cart',
    name: 'Корзина',
    icon: '🛒',
    description: 'Корзина покупок',
    category: 'products'
  }
]

const CATEGORIES = {
  layout: { title: 'Макет', color: 'bg-blue-50' },
  content: { title: 'Контент', color: 'bg-green-50' },
  products: { title: 'Товары', color: 'bg-purple-50' }
}

export default function BlocksPanel({ onAddBlock }: BlocksPanelProps) {
  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Блоки</h2>
        <p className="text-sm text-gray-600">Перетащите блок на холст</p>
      </div>

      {/* Blocks by categories */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(CATEGORIES).map(([categoryId, category]) => (
          <div key={categoryId}>
            <div className={`${category.color} px-3 py-2 rounded-lg mb-3`}>
              <h3 className="text-sm font-medium text-gray-700">
                {category.title}
              </h3>
            </div>
            
            <div className="space-y-2">
              {BLOCK_TYPES
                .filter(block => block.category === categoryId)
                .map(block => (
                  <button
                    key={block.id}
                    onClick={() => onAddBlock(block.id)}
                    className={`
                      w-full flex items-start space-x-3 p-3 rounded-lg border border-gray-200
                      hover:border-blue-300 hover:bg-blue-50 transition-colors
                      group cursor-pointer
                    `}
                  >
                    <span className="text-2xl">{block.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 group-hover:text-blue-700">
                        {block.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {block.description}
                      </div>
                    </div>
                  </button>
                ))
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

