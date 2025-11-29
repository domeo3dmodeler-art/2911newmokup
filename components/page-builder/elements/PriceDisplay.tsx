'use client';

import React from 'react';
import { BaseElement } from '../types';

interface PriceDisplayProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

export function PriceDisplay({ element, onUpdate }: PriceDisplayProps) {
  const {
    price = '0 ₽',
    originalPrice = '',
    discount = '',
    showDiscount = false,
    showCurrency = true,
    size = 'large',
    layout = 'center',
    backgroundColor = 'transparent'
  } = element.props;

  const sizeClasses = {
    small: 'text-lg',
    medium: 'text-2xl',
    large: 'text-4xl',
    xlarge: 'text-6xl'
  };

  const layoutClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const bgClasses = {
    transparent: '',
    white: 'bg-white rounded-lg p-4 shadow-sm',
    gray: 'bg-gray-100 rounded-lg p-4',
    blue: 'bg-blue-50 rounded-lg p-4 border border-blue-200'
  };

  return (
    <div className={`${layoutClasses[layout as keyof typeof layoutClasses]} ${bgClasses[backgroundColor as keyof typeof bgClasses]}`}>
      <div className="space-y-2">
        {/* Основная цена */}
        <div className={`font-bold text-gray-900 ${sizeClasses[size as keyof typeof sizeClasses]}`}>
          {price}
          {!showCurrency && price.replace(/[^\d]/g, '')}
        </div>

        {/* Оригинальная цена */}
        {originalPrice && (
          <div className="text-lg text-gray-500 line-through">
            {originalPrice}
          </div>
        )}

        {/* Скидка */}
        {showDiscount && discount && (
          <div className="inline-block bg-red-100 text-red-800 text-sm font-semibold px-3 py-1 rounded-full">
            Скидка {discount}
          </div>
        )}
      </div>
    </div>
  );
}

