'use client';

import React, { useState } from 'react';

interface Category {
  id: string;
  name: string;
  parent_id?: string;
  level: number;
  path: string;
  products_count: number;
  subcategories?: Category[];
}

interface CategoryTreeSelectorProps {
  categories: Category[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export function CategoryTreeSelector({ categories, selectedIds, onSelectionChange }: CategoryTreeSelectorProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Фильтрация категорий по поисковому запросу
  const filterCategories = (categories: Category[], searchTerm: string): Category[] => {
    if (!searchTerm.trim()) return categories;

    return categories.reduce((filtered: Category[], category) => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase());
      const filteredSubcategories = filterCategories(category.subcategories || [], searchTerm);

      if (matchesSearch || filteredSubcategories.length > 0) {
        filtered.push({
          ...category,
          subcategories: filteredSubcategories
        });
      }

      return filtered;
    }, []);
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleCategorySelection = (categoryId: string) => {
    const newSelected = selectedIds.includes(categoryId)
      ? selectedIds.filter(id => id !== categoryId)
      : [...selectedIds, categoryId];
    
    onSelectionChange(newSelected);
  };

  const renderCategory = (category: Category, depth = 0) => {
    const hasChildren = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedNodes.has(category.id);
    const isSelected = selectedIds.includes(category.id);

    return (
      <div key={category.id} className="select-none">
        <div
          className={`group flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer rounded-md text-sm transition-colors ${
            isSelected 
              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
              : 'text-gray-700 hover:text-gray-900'
          }`}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
          onClick={() => toggleCategorySelection(category.id)}
        >
          {/* Чекбокс */}
          <div className="flex-shrink-0 mr-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleCategorySelection(category.id)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Кнопка раскрытия/сворачивания */}
          <div className="flex-shrink-0 mr-2">
            {hasChildren ? (
              <button
                className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(category.id);
                }}
              >
                <svg
                  className={`w-3 h-3 transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>

          {/* Иконка категории */}
          <div className="flex-shrink-0 mr-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>

          {/* Название категории */}
          <span className="flex-1 truncate font-medium">
            {category.name}
          </span>

          {/* Количество товаров */}
          {category.products_count > 0 && (
            <span className="flex-shrink-0 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {category.products_count}
            </span>
          )}
        </div>

        {/* Подкатегории */}
        {hasChildren && isExpanded && (
          <div>
            {category.subcategories!.map(subcategory =>
              renderCategory(subcategory, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const filteredCategories = filterCategories(categories, searchTerm);

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Заголовок и поиск */}
      <div className="p-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Категории товаров</h3>
          {selectedIds.length > 0 && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              {selectedIds.length} выбрано
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск категории..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pl-9 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Дерево категорий */}
      <div className="p-1 overflow-y-auto max-h-48">
        {filteredCategories.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-sm text-gray-500">
              {searchTerm ? 'Категории не найдены' : 'Каталог пуст'}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredCategories.map(category => renderCategory(category))}
          </div>
        )}
      </div>

      {/* Статистика и действия */}
      {selectedIds.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-700">
                Выбрано категорий: <span className="font-medium text-blue-600">{selectedIds.length}</span>
              </span>
            </div>
            <button
              onClick={() => onSelectionChange([])}
              className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
            >
              Очистить все
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
