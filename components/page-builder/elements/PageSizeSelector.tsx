'use client';

import React, { useState } from 'react';
import { POPULAR_PAGE_SIZES, PageSize } from '../../../lib/page-sizes';

interface PageSizeSelectorProps {
  currentWidth: number;
  currentHeight: number;
  onSizeChange: (width: number, height: number) => void;
}

export function PageSizeSelector({ currentWidth, currentHeight, onSizeChange }: PageSizeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PageSize['category'] | 'all'>('all');

  const handleSizeSelect = (size: PageSize) => {
    onSizeChange(size.width, size.height);
    setIsOpen(false);
  };

  const filteredSizes = selectedCategory === 'all' 
    ? POPULAR_PAGE_SIZES 
    : POPULAR_PAGE_SIZES.filter(size => size.category === selectedCategory);

  const categories = [
    { value: 'all', label: 'Все размеры', icon: '📐' },
    { value: 'desktop', label: 'Десктоп', icon: '🖥️' },
    { value: 'tablet', label: 'Планшет', icon: '📱' },
    { value: 'mobile', label: 'Мобильный', icon: '📲' },
    { value: 'custom', label: 'Специальные', icon: '⚙️' }
  ] as const;

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
        title="Выбрать размер страницы"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        <span>{currentWidth} × {currentHeight}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            {/* Header */}
            <div className="p-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">Размер страницы</h3>
              <p className="text-sm text-gray-500">Выберите подходящий размер для вашей страницы</p>
            </div>

            {/* Category Filter */}
            <div className="p-3 border-b border-gray-200">
              <div className="flex flex-wrap gap-1">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      selectedCategory === category.value
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-1">{category.icon}</span>
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredSizes.map((size) => (
                <button
                  key={`${size.width}-${size.height}`}
                  onClick={() => handleSizeSelect(size)}
                  className={`w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                    currentWidth === size.width && currentHeight === size.height
                      ? 'bg-blue-50 border-l-4 border-l-blue-500'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{size.name}</div>
                      <div className="text-sm text-gray-600">{size.description}</div>
                    </div>
                    <div className="text-sm font-mono text-gray-500">
                      {size.width} × {size.height}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Size Input */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="text-sm font-medium text-gray-700 mb-2">Пользовательский размер:</div>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Ширина"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="100"
                  max="4000"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const width = parseInt(e.currentTarget.value);
                      if (width && width > 0) {
                        onSizeChange(width, currentHeight);
                        setIsOpen(false);
                      }
                    }
                  }}
                />
                <span className="text-gray-500 self-center">×</span>
                <input
                  type="number"
                  placeholder="Высота"
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="100"
                  max="4000"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const height = parseInt(e.currentTarget.value);
                      if (height && height > 0) {
                        onSizeChange(currentWidth, height);
                        setIsOpen(false);
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

