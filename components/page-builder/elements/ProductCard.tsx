'use client';

import React from 'react';
import { BaseElement } from '../types';

interface ProductCardProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

export function ProductCard({ element, onUpdate }: ProductCardProps) {
  const {
    productId = null,
    title = 'Название товара',
    price = '0 ₽',
    originalPrice = '',
    image = '/uploads/products/default/1759160720296_58vgf7nva1s.png',
    badge = '',
    showBadge = false,
    layout = 'vertical',
    size = 'medium'
  } = element.props;

  const sizeClasses = {
    small: 'w-48',
    medium: 'w-64',
    large: 'w-80'
  };

  const cardClasses = layout === 'horizontal' 
    ? 'flex flex-row h-32'
    : 'flex flex-col';

  const imageClasses = layout === 'horizontal'
    ? 'w-24 h-24 object-cover rounded-l-md'
    : 'w-full h-48 object-cover rounded-t-md';

  return (
    <div className={`${sizeClasses[size as keyof typeof sizeClasses]} bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ${cardClasses}`}>
      {/* Изображение товара */}
      <div className="relative">
        <img 
          src={image} 
          alt={title}
          className={imageClasses}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/uploads/products/default/1759160720296_58vgf7nva1s.png';
          }}
        />
        {showBadge && badge && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            {badge}
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2">
            {title}
          </h3>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900">{price}</span>
            {originalPrice && (
              <span className="text-sm text-gray-500 line-through">{originalPrice}</span>
            )}
          </div>
          
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors">
            В корзину
          </button>
        </div>
      </div>
    </div>
  );
}
