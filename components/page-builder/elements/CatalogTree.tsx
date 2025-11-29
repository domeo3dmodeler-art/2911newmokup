'use client';

import React, { useState, useEffect } from 'react';
import { BaseElement } from '../types';
import { clientLogger } from '@/lib/logging/client-logger';

interface CatalogCategory {
  id: string;
  name: string;
  parent_id?: string;
  level: number;
  path: string;
  products_count: number;
  subcategories?: CatalogCategory[];
}

interface CatalogTreeProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

export function CatalogTree({ element, onUpdate }: CatalogTreeProps) {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    element.props.selectedCategoryIds || []
  );

  // Загрузка дерева категорий
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/catalog/categories/tree');
        if (response.ok) {
          const responseData = await response.json();
          // API возвращает {success: true, data: {categories: [...]}}
          const data = responseData.data || responseData;
          setCategories(data.categories || []);
          
          // Автоматически раскрываем корневые категории
          const rootIds = data.categories?.map((cat: CatalogCategory) => cat.id) || [];
          setExpandedNodes(new Set(rootIds));
        }
      } catch (error) {
        clientLogger.error('Error loading categories', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Фильтрация категорий по поисковому запросу
  const filterCategories = (categories: CatalogCategory[], searchTerm: string): CatalogCategory[] => {
    if (!searchTerm.trim()) return categories;

    return categories.reduce((filtered: CatalogCategory[], category) => {
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
    const newSelected = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter(id => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    
    setSelectedCategoryIds(newSelected);
    
    // Обновляем элемент
    onUpdate({
      props: {
        ...element.props,
        selectedCategoryIds: newSelected
      }
    });
  };

  const renderCategory = (category: CatalogCategory, depth = 0) => {
    const hasChildren = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedNodes.has(category.id);
    const isSelected = selectedCategoryIds.includes(category.id);

    return (
      <div key={category.id} className="select-none">
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer rounded ${
            isSelected ? 'bg-blue-50 text-blue-700' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => toggleCategorySelection(category.id)}
        >
          {/* Кнопка раскрытия/сворачивания */}
          <button
            className={`w-4 h-4 mr-2 flex items-center justify-center ${
              hasChildren ? 'cursor-pointer' : 'cursor-default'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) {
                toggleExpanded(category.id);
              }
            }}
          >
            {hasChildren ? (
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
            ) : (
              <div className="w-3 h-3" />
            )}
          </button>

          {/* Чекбокс */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleCategorySelection(category.id)}
            className="mr-2"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Название категории */}
          <span className="flex-1 text-sm truncate">
            {category.name}
          </span>

          {/* Количество товаров */}
          {category.products_count > 0 && (
            <span className="text-xs text-gray-500 ml-2">
              ({category.products_count})
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

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Загрузка каталога...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Заголовок */}
      <div className="p-4 border-b border-gray-200">
        
        {/* Поиск категорий */}
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск категории..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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

        {/* Статистика */}
        <div className="mt-3 text-sm text-gray-600">
          Выбрано категорий: {selectedCategoryIds.length}
        </div>
      </div>

      {/* Дерево категорий */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredCategories.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm">
              {searchTerm ? 'Категории не найдены' : 'Каталог пуст'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredCategories.map(category => renderCategory(category))}
          </div>
        )}
      </div>

      {/* Действия */}
      {selectedCategoryIds.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              setSelectedCategoryIds([]);
              onUpdate({
                props: {
                  ...element.props,
                  selectedCategoryIds: []
                }
              });
            }}
            className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
          >
            Очистить выбор
          </button>
        </div>
      )}
    </div>
  );
}
