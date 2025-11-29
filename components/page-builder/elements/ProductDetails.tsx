'use client';

import React from 'react';
import { BaseElement } from '../types';

interface ProductDetailsProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

export function ProductDetails({ element, onUpdate }: ProductDetailsProps) {
  const {
    title = 'Название товара',
    price = '0 ₽',
    originalPrice = '',
    description = 'Описание товара',
    specifications = [
      { label: 'Материал', value: 'Дерево' },
      { label: 'Размер', value: '200x80 см' },
      { label: 'Цвет', value: 'Белый' }
    ],
    showSpecifications = true,
    showPrice = true,
    showDescription = true,
    layout = 'vertical'
  } = element.props;

  return (
    <div className={`bg-white rounded-lg p-6 ${layout === 'horizontal' ? 'max-w-4xl' : 'max-w-2xl'}`}>
      {/* Заголовок */}
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>

      {/* Цена */}
      {showPrice && (
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-3xl font-bold text-gray-900">{price}</span>
            {originalPrice && (
              <span className="text-xl text-gray-500 line-through">{originalPrice}</span>
            )}
          </div>
        </div>
      )}

      {/* Описание */}
      {showDescription && description && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Описание</h2>
          <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
      )}

      {/* Характеристики */}
      {showSpecifications && specifications && specifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Характеристики</h2>
          <div className="space-y-2">
            {specifications.map((spec: any, index: number) => (
              <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                <span className="font-medium text-gray-700">{spec.label}</span>
                <span className="text-gray-600">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex space-x-4">
        <button className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
          Добавить в корзину
        </button>
        <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
          Купить в 1 клик
        </button>
      </div>
    </div>
  );
}

