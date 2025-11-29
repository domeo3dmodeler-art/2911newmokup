'use client';

import React from 'react';
import { BaseElement } from '../types';

interface SummaryTableProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

export function SummaryTable({ element, onUpdate }: SummaryTableProps) {
  const {
    title = 'Сводка заказа',
    items = [
      { label: 'Товар', value: '0 ₽' },
      { label: 'Доставка', value: 'Бесплатно' },
      { label: 'Скидка', value: '-0 ₽' },
      { label: 'Итого', value: '0 ₽', isTotal: true }
    ],
    showHeader = true,
    showFooter = true,
    style = 'default'
  } = element.props;

  const styleClasses = {
    default: 'border border-gray-200',
    minimal: 'border-0',
    highlighted: 'border border-blue-200 bg-blue-50'
  };

  return (
    <div className={`bg-white rounded-lg overflow-hidden ${styleClasses[style as keyof typeof styleClasses]}`}>
      {showHeader && title && (
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      
      <div className="divide-y divide-gray-200">
        {items.map((item: any, index: number) => (
          <div key={index} className={`px-6 py-4 flex justify-between items-center ${
            item.isTotal ? 'bg-gray-50 font-semibold' : ''
          }`}>
            <span className={`text-gray-700 ${item.isTotal ? 'text-gray-900' : ''}`}>
              {item.label}
            </span>
            <span className={`text-gray-900 ${item.isTotal ? 'text-xl' : ''}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {showFooter && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Оформить заказ
          </button>
        </div>
      )}
    </div>
  );
}

