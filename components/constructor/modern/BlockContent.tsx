'use client';

import React from 'react';

interface Block {
  id: string
  type: 'container' | 'text' | 'image' | 'product-catalog' | 'product-detail' | 'cart' | 'spacer'
  position: { x: number, y: number }
  size: { width: number, height: number }
  props: Record<string, any>
}

interface BlockContentProps {
  block: Block
  isPreview: boolean
  isSelected: boolean
}

export default function BlockContent({ block, isPreview, isSelected }: BlockContentProps) {
  const { type, props } = block

  // Container Block
  if (type === 'container') {
    return (
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{
          backgroundColor: props.backgroundColor,
          padding: props.padding,
          borderRadius: props.borderRadius,
          border: props.border
        }}
      >
        {isSelected && !isPreview && (
          <span className="text-gray-400 text-sm">Контейнер - добавьте содержимое</span>
        )}
      </div>
    )
  }

  // Text Block
  if (type === 'text') {
    return (
      <div 
        className="w-full h-full flex items-center justify-center p-2"
        style={{
          fontSize: props.fontSize,
          color: props.color,
          fontWeight: props.fontWeight,
          textAlign: props.textAlign
        }}
      >
        {props.content || (isSelected && !isPreview ? 'Нажмите для редактирования' : '')}
      </div>
    )
  }

  // Image Block
  if (type === 'image') {
    return (
      <div className="w-full h-full overflow-hidden">
        <img 
          src={props.src || '/placeholder.jpg'}
          alt={props.alt || ''}
          className="w-full h-full object-cover"
          style={{ borderRadius: props.borderRadius }}
        />
      </div>
    )
  }

  // Product Catalog Block
  if (type === 'product-catalog') {
    return (
      <div className="w-full h-full bg-white p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Каталог товаров</h3>
            <p className="text-sm text-gray-600">
              {props.columns} колонок • {props.showFilters ? 'С фильтрами' : 'Без фильтров'}
            </p>
          </div>

          {/* Sample Products Grid */}
          <div className={`grid gap-4 ${props.displayMode === 'list' ? 'grid-cols-1' : `grid-cols-${props.columns}`}`}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="aspect-square bg-gray-200 rounded mb-2"></div>
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  {props.showPrices && (
                    <div className="h-3 bg-green-200 rounded w-1/3"></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isPreview && (
            <div className="text-center text-xs text-gray-400 pt-2 border-t">
              Настройте категорию и свойства в панели справа
            </div>
          )}
        </div>
      </div>
    )
  }

  // Product Detail Block
  if (type === 'product-detail') {
    return (
      <div className="w-full h-full bg-white p-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Детали товара</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {props.showPhotos && (
                <div className="aspect-square bg-gray-200 rounded"></div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <div className="h-5 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
              {props.showPrice && (
                <div className="h-6 bg-green-200 rounded w-24"></div>
              )}
              {props.showSpecifications && (
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Cart Block
  if (type === 'cart') {
    return (
      <div className="w-full h-full bg-white p-4">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Корзина</h3>
          <div className="space-y-3">
            {/* Cart Items */}
            {props.showHeaders && (
              <div className="grid grid-cols-4 gap-2 text-xs text-gray-600 border-b pb-2">
                <div>Товар</div>
                {props.showQuantity && <div>Кол-во</div>}
                <div>Цена</div>
                <div>Сумма</div>
              </div>
            )}
            
            {[1, 2].map(i => (
              <div key={i} className="grid grid-cols-4 gap-2 items-center text-sm">
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
                {props.showQuantity && (
                  <div className="text-center">
                    <div className="h-6 bg-gray-200 rounded w-12"></div>
                  </div>
                )}
                <div className="text-right">
                  <div className="h-4 bg-green-200 rounded w-16 float-right"></div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-green-200 rounded w-20 float-right"></div>
                </div>
              </div>
            ))}
            
            {props.showTotal && (
              <div className="border-t pt-2 text-right">
                <div className="text-lg font-semibold">
                  <div className="h-6 bg-green-200 rounded w-24 float-right"></div>
                </div>
              </div>
            )}
            
            {props.checkoutButton && (
              <button className="w-full py-2 bg-blue-500 text-white rounded text-sm">
                Оформить заказ
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Spacer Block
  if (type === 'spacer') {
    return (
      <div 
        className="w-full bg-gray-200 transition-all"
        style={{ 
          height: props.height,
          backgroundColor: props.backgroundColor 
        }}
      />
    )
  }

  return null
}

