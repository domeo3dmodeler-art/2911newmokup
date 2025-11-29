'use client';

import React from 'react';
import { ELEMENT_CATEGORIES, BLOCK_DEFINITIONS } from './blockDefinitions';
import { useConstructor } from './ConstructorContext';

interface DraggableElementProps {
  type: string;
}

const DraggableElement: React.FC<DraggableElementProps> = ({ type }) => {
  const { addElement } = useConstructor();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type }));
  };

  const handleClick = () => {
    const elementDef = BLOCK_DEFINITIONS[type];
    if (elementDef) {
      addElement(elementDef);
    }
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'container': return '📦';
      case 'text': return '📝';
      case 'image': return '🖼️';
      case 'productGrid': return '🏪';
      case 'productFilter': return '🔍';
      case 'productCart': return '🛒';
      case 'priceCalculator': return '💰';
      case 'form': return '📋';
      case 'button': return '🔘';
      case 'spacer': return '⬜';
      case 'divider': return '➖';
      case 'row': return '📏';
      case 'column': return '📐';
      case 'video': return '🎥';
      case 'input': return '📝';
      case 'select': return '📋';
      default: return '🔧';
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      className="p-3 border border-gray-200 rounded-lg cursor-grab hover:border-blue-300 hover:bg-blue-50 transition-colors text-center group"
    >
      <div className="text-2xl mb-2">{getElementIcon(type)}</div>
      <div className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
        {type}
      </div>
    </div>
  );
};

export default function ElementsPanel() {
  return (
    <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Элементы</h3>
        
        <div className="space-y-6">
          {Object.entries(ELEMENT_CATEGORIES).map(([key, category]) => (
            <div key={key}>
              <h4 className="font-medium text-gray-700 mb-3 text-sm uppercase tracking-wide">
                {category.title}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {category.elements.map(element => (
                  <DraggableElement key={element} type={element} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Дополнительные элементы */}
        <div className="mt-8">
          <h4 className="font-medium text-gray-700 mb-3 text-sm uppercase tracking-wide">
            Шаблоны
          </h4>
          <div className="space-y-2">
            <button className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
              <div className="text-sm font-medium text-gray-700">📄 Страница товара</div>
              <div className="text-xs text-gray-500">Полная страница с фильтрами и корзиной</div>
            </button>
            <button className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
              <div className="text-sm font-medium text-gray-700">🏠 Главная страница</div>
              <div className="text-xs text-gray-500">Каталог с баннерами и новинками</div>
            </button>
            <button className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
              <div className="text-sm font-medium text-gray-700">📞 Контакты</div>
              <div className="text-xs text-gray-500">Форма обратной связи и карта</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

