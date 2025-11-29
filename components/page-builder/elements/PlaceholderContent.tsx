'use client';

import React from 'react';
import { getBlockName, getBlockDescription } from '../../../lib/block-names';

interface PlaceholderContentProps {
  blockType: string;
  className?: string;
  showDescription?: boolean;
}

export function PlaceholderContent({ 
  blockType, 
  className = '', 
  showDescription = true 
}: PlaceholderContentProps) {
  const blockName = getBlockName(blockType);
  const description = getBlockDescription(blockType);

  // Иконки для разных типов блоков
  const getBlockIcon = (type: string): string => {
    const icons: Record<string, string> = {
      productGrid: '📊',
      productConfigurator: '⚙️',
      productConfiguratorAdvanced: '⚙️',
      productFilters: '🔍',
      cart: '🛒',
      catalogTree: '🌳',
      stepWizard: '🧙',
      comparisonTable: '📊',
      priceCalculator: '💰',
      contact: '📞',
      accordion: '📋',
      gallery: '🖼️',
      testimonial: '💬',
      faq: '❓',
      heading: '📰',
      text: '📝',
      image: '🖼️',
      button: '🔘',
      section: '📋',
      row: '↔️',
      column: '↕️',
      spacer: '↔️'
    };
    return icons[type] || '📦';
  };

  return (
    <div className={`w-full h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg ${className}`}>
      <div className="text-center text-gray-500 p-8">
        <div className="text-4xl mb-4 opacity-50">
          {getBlockIcon(blockType)}
        </div>
        <div className="text-lg font-medium text-gray-700 mb-2">
          {blockName}
        </div>
        {showDescription && description && (
          <div className="text-sm text-gray-500 max-w-xs">
            {description}
          </div>
        )}
        <div className="text-xs text-gray-400 mt-3">
          Настройте блок в панели свойств
        </div>
      </div>
    </div>
  );
}

/**
 * Компонент для отображения заглушки фильтров
 */
export function FiltersPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full flex items-center justify-center bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <div className="text-center text-blue-600 p-6">
        <div className="text-3xl mb-3">🔍</div>
        <div className="text-sm font-medium">Фильтры товаров</div>
        <div className="text-xs text-blue-500 mt-1">
          Доступны в режиме предпросмотра
        </div>
      </div>
    </div>
  );
}

/**
 * Компонент для отображения заглушки конфигуратора
 */
export function ConfiguratorPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full flex items-center justify-center bg-green-50 border border-green-200 rounded-lg ${className}`}>
      <div className="text-center text-green-600 p-6">
        <div className="text-3xl mb-3">⚙️</div>
        <div className="text-sm font-medium">Конфигуратор товаров</div>
        <div className="text-xs text-green-500 mt-1">
          Настройте параметры в панели свойств
        </div>
      </div>
    </div>
  );
}
