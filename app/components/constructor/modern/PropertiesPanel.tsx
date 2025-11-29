'use client';

import React from 'react';

interface Block {
  id: string
  type: 'container' | 'text' | 'image' | 'product-catalog' | 'product-detail' | 'cart' | 'spacer'
  position: { x: number, y: number }
  size: { width: number, height: number }
  props: Record<string, any>
}

interface PropertiesPanelProps {
  block: Block
  onUpdate: (updates: Partial<Block>) => void
}

export default function PropertiesPanel({ block, onUpdate }: PropertiesPanelProps) {
  const handlePropChange = (key: string, value: any) => {
    onUpdate({
      props: {
        ...block.props,
        [key]: value
      }
    })
  }

  const handleStyleChange = (property: string, value: string) => {
    handlePropChange(property, value)
  }

  const renderCommonProperties = () => (
    <div className="space-y-4">
      {/* Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Позиция
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="number"
              value={block.position.x}
              onChange={(e) => onUpdate({ position: { ...block.position, x: Number(e.target.value) } })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              placeholder="X"
            />
          </div>
          <div>
            <input
              type="number"
              value={block.position.y}
              onChange={(e) => onUpdate({ position: { ...block.position, y: Number(e.target.value) } })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              placeholder="Y"
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Размер
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <input
              type="number"
              value={block.size.width}
              onChange={(e) => onUpdate({ size: { ...block.size, width: Number(e.target.value) } })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              placeholder="Ширина"
            />
          </div>
          <div>
            <input
              type="number"
              value={block.size.height}
              onChange={(e) => onUpdate({ size: { ...block.size, height: Number(e.target.value) } })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              placeholder="Высота"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderSpecificProperties = () => {
    switch (block.type) {
      case 'container':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Фон
              </label>
              <input
                type="color"
                value={block.props.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Отступы
              </label>
              <input
                type="text"
                value={block.props.padding || '20px'}
                onChange={(e) => handleStyleChange('padding', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                placeholder="20px"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Границы
              </label>
              <input
                type="text"
                value={block.props.border || '1px solid #e5e7eb'}
                onChange={(e) => handleStyleChange('border', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                placeholder="1px solid #ccc"
              />
            </div>
          </div>
        )

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Текст
              </label>
              <textarea
                value={block.props.content || ''}
                onChange={(e) => handlePropChange('content', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md h-24 resize-none"
                placeholder="Введите текст..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Размер
                </label>
                <select
                  value={block.props.fontSize || '16px'}
                  onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                >
                  <option value="12px">12px</option>
                  <option value="14px">14px</option>
                  <option value="16px">16px</option>
                  <option value="18px">18px</option>
                  <option value="20px">20px</option>
                  <option value="24px">24px</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Выравнивание
                </label>
                <select
                  value={block.props.textAlign || 'left'}
                  onChange={(e) => handleStyleChange('textAlign', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                >
                  <option value="left">Слева</option>
                  <option value="center">По центру</option>
                  <option value="right">Справа</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Цвет
              </label>
              <input
                type="color"
                value={block.props.color || '#333333'}
                onChange={(e) => handleStyleChange('color', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL изображения
              </label>
              <input
                type="url"
                value={block.props.src || ''}
                onChange={(e) => handlePropChange('src', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание
              </label>
              <input
                type="text"
                value={block.props.alt || ''}
                onChange={(e) => handlePropChange('alt', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                placeholder="Описание изображения..."
              />
            </div>
          </div>
        )

      case 'product-catalog':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID категории
              </label>
              <input
                type="text"
                value={block.props.categoryId || ''}
                onChange={(e) => handlePropChange('categoryId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                placeholder="cmg50xcgs001cv7mn0tdyk1wo"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Колонки
                </label>
                <select
                  value={block.props.columns || 3}
                  onChange={(e) => handlePropChange('columns', Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Режим
                </label>
                <select
                  value={block.props.displayMode || 'grid'}
                  onChange={(e) => handlePropChange('displayMode', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                >
                  <option value="grid">Сетка</option>
                  <option value="list">Список</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={block.props.showFilters || false}
                  onChange={(e) => handlePropChange('showFilters', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Показывать фильтры</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={block.props.showPrices || false}
                  onChange={(e) => handlePropChange('showPrices', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Показывать цены</span>
              </label>
            </div>
          </div>
        )

      case 'product-detail':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID товара
              </label>
              <input
                type="text"
                value={block.props.productId || ''}
                onChange={(e) => handlePropChange('productId', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                placeholder="product_id_123"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={block.props.showPhotos || false}
                  onChange={(e) => handlePropChange('showPhotos', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Показывать фото</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={block.props.showPrice || false}
                  onChange={(e) => handlePropChange('showPrice', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Показывать цену</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={block.props.showSpecifications || false}
                  onChange={(e) => handlePropChange('showSpecifications', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Показывать характеристики</span>
              </label>
            </div>
          </div>
        )

      case 'cart':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={block.props.showHeaders || false}
                  onChange={(e) => handlePropChange('showHeaders', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Показывать заголовки</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={block.props.showQuantity || false}
                  onChange={(e) => handlePropChange('showQuantity', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Показывать количество</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={block.props.showTotal || false}
                  onChange={(e) => handlePropChange('showTotal', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Показывать итого</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={block.props.checkoutButton || false}
                  onChange={(e) => handlePropChange('checkoutButton', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Кнопка оформления</span>
              </label>
            </div>
          </div>
        )

      case 'spacer':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Высота
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={parseInt(block.props.height || '20')}
                onChange={(e) => handlePropChange('height', `${e.target.value}px`)}
                className="w-full"
              />
              <div className="text-center text-sm text-gray-500">
                {block.props.height || '20px'}
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center text-gray-500 text-sm">
            Нет настроек для этого типа блока
          </div>
        )
    }
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Свойства</h3>
        <p className="text-sm text-gray-600">
          {block.type} • {block.id.slice(-4)}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Common Properties */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Расположение</h4>
            {renderCommonProperties()}
          </div>

          {/* Specific Properties */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              {block.type === 'container' ? 'Стилизация' :
               block.type === 'text' ? 'Текст' :
               block.type === 'image' ? 'Изображение' :
               block.type === 'product-catalog' ? 'Каталог' :
               block.type === 'product-detail' ? 'Товар' :
               block.type === 'cart' ? 'Корзина' :
               block.type === 'spacer' ? 'Раз spacing' : 'Настройки'}
            </h4>
            {renderSpecificProperties()}
          </div>
        </div>
      </div>
    </div>
  )
}
