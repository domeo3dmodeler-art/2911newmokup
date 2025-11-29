'use client';

import React, { useState } from 'react';
import { BaseElement } from '../types';

interface AccordionProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

interface AccordionItem {
  id: string;
  title: string;
  content: string;
  isOpen?: boolean;
}

export function Accordion({ element, onUpdate }: AccordionProps) {
  // Получаем элементы аккордеона из props или используем демо-данные
  const [items, setItems] = useState<AccordionItem[]>(
    element.props.items || [
      {
        id: '1',
        title: 'Как заказать товар?',
        content: 'Вы можете заказать товар через наш сайт, заполнив форму конфигуратора, или связавшись с нами по телефону.',
        isOpen: false
      },
      {
        id: '2',
        title: 'Какие способы оплаты доступны?',
        content: 'Мы принимаем оплату наличными при получении, банковскими картами, а также безналичным расчетом для юридических лиц.',
        isOpen: false
      },
      {
        id: '3',
        title: 'Как долго длится доставка?',
        content: 'Сроки доставки зависят от региона и составляют от 1 до 7 рабочих дней. Точную дату доставки сообщит менеджер.',
        isOpen: false
      }
    ]
  );

  const toggleItem = (itemId: string) => {
    setItems(prevItems => 
      prevItems.map(item => ({
        ...item,
        isOpen: item.id === itemId ? !item.isOpen : (element.props.allowMultiple ? item.isOpen : false)
      }))
    );
  };

  return (
    <div className="w-full h-full bg-white p-6 overflow-auto">
      <div className="max-w-2xl mx-auto">
        {/* Заголовок секции */}
        {element.props.title && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {element.props.title}
            </h2>
            {element.props.subtitle && (
              <p className="text-gray-600">{element.props.subtitle}</p>
            )}
          </div>
        )}

        {/* Аккордеон */}
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {item.title}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      item.isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>
              
              {item.isOpen && (
                <div className="px-4 py-3 bg-white border-t border-gray-100">
                  <p className="text-gray-700 leading-relaxed">
                    {item.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Пустое состояние */}
        {items.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет элементов аккордеона
            </h3>
            <p className="text-gray-500">
              Добавьте элементы через панель свойств
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
