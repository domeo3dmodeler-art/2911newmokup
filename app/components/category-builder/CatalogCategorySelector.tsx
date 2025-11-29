'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button } from '../ui';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Package2 } from 'lucide-react';

interface CatalogCategory {
  id: string;
  name: string;
  level: number;
  path: string;
  subcategories?: CatalogCategory[];
  products_count?: number;
}

interface CatalogCategorySelectorProps {
  onCategorySelect: (categoryId: string) => void;
  selectedCategoryId?: string;
}

export default function CatalogCategorySelector({ 
  onCategorySelect, 
  selectedCategoryId 
}: CatalogCategorySelectorProps) {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/catalog/categories');
      const data = await response.json();
      clientLogger.debug('Загружены категории каталога:', data);
      
      // Обрабатываем разные форматы ответа
      let categoriesData = [];
      if (Array.isArray(data)) {
        categoriesData = data;
      } else if (data.categories && Array.isArray(data.categories)) {
        categoriesData = data.categories;
      } else {
        clientLogger.warn('Неожиданный формат данных каталога:', data);
      }
      
      setCategories(categoriesData);
      
      // Автоматически раскрываем первые 2 уровня для удобства
      const autoExpand = (cats: CatalogCategory[], level = 0) => {
        if (level < 2) {
          cats.forEach(cat => {
            if (cat.subcategories && cat.subcategories.length > 0) {
              setExpandedNodes(prev => new Set([...prev, cat.id]));
              autoExpand(cat.subcategories, level + 1);
            }
          });
        }
      };
      autoExpand(data.categories || []);
    } catch (error) {
      clientLogger.error('Error loading catalog categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const findCategoryById = (cats: CatalogCategory[], id: string): CatalogCategory | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat;
      if (cat.subcategories) {
        const found = findCategoryById(cat.subcategories, id);
        if (found) return found;
      }
    }
    return null;
  };

  const getCategoryPath = (catId: string): string[] => {
    const findPath = (cats: CatalogCategory[], targetId: string, path: string[] = []): string[] | null => {
      for (const cat of cats) {
        const currentPath = [...path, cat.name];
        if (cat.id === targetId) return currentPath;
        if (cat.subcategories) {
          const found = findPath(cat.subcategories, targetId, currentPath);
          if (found) return found;
        }
      }
      return null;
    };
    return findPath(categories, catId) || [];
  };

  const filterCategories = (cats: CatalogCategory[], search: string): CatalogCategory[] => {
    if (!search) return cats;
    
    return cats.filter(cat => {
      const matchesSearch = cat.name.toLowerCase().includes(search.toLowerCase());
      const hasMatchingChildren = cat.subcategories && 
        filterCategories(cat.subcategories, search).length > 0;
      return matchesSearch || hasMatchingChildren;
    }).map(cat => ({
      ...cat,
      subcategories: cat.subcategories ? filterCategories(cat.subcategories, search) : undefined
    }));
  };

  const renderCategory = (category: CatalogCategory, level: number = 0) => {
    const hasChildren = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedNodes.has(category.id);
    const isSelected = selectedCategoryId === category.id;
    const indent = level * 20;

    return (
      <div key={category.id} className="select-none">
        <div
          className={`flex items-center py-2 px-3 cursor-pointer group transition-colors duration-150 ${
            isSelected 
              ? 'bg-blue-100 border-l-2 border-blue-500' 
              : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${indent + 12}px` }}
          onClick={() => onCategorySelect(category.id)}
        >
          {/* Индикатор раскрытия/сворачивания */}
          <div className="flex items-center w-6 mr-2">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(category.id);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors duration-150"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-1 h-1 bg-gray-300 rounded-full" />
              </div>
            )}
          </div>

          {/* Иконка категории */}
          <div className="mr-3">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-600" />
              ) : (
                <Folder className="h-4 w-4 text-blue-500" />
              )
            ) : (
              <Package2 className="h-4 w-4 text-gray-400" />
            )}
          </div>
          
          {/* Основной контент */}
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div className="flex items-center space-x-3 min-w-0">
              <span className={`font-medium truncate ${
                level === 0 ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {category.name}
              </span>
              
              {/* Счетчик товаров */}
              {(category.products_count || 0) > 0 && (
                <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                  (category.products_count || 0) > 0 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {category.products_count}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Подкатегории с анимацией */}
        {hasChildren && isExpanded && (
          <div className="overflow-hidden">
            <div className="transition-all duration-200 ease-in-out">
              {category.subcategories?.map(subcategory => 
                renderCategory(subcategory, level + 1)
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const filteredCategories = filterCategories(categories, searchTerm);
  const selectedCategory = selectedCategoryId ? findCategoryById(categories, selectedCategoryId) : null;
  const selectedPath = selectedCategoryId ? getCategoryPath(selectedCategoryId) : [];

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">Загрузка категорий каталога...</div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-black mb-2">
            Привязка к каталогу товаров
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Выберите категорию каталога, к которой будут привязаны товары из прайс-листа
          </p>
        </div>

        {/* Поиск */}
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск категорий..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Дерево категорий */}
        <div className="border border-gray-200 rounded-lg bg-white max-h-96 overflow-y-auto">
          {filteredCategories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">
                {searchTerm ? 'Категории не найдены' : 'Каталог пуст'}
              </p>
              <p className="text-sm text-gray-400">
                {searchTerm 
                  ? 'Попробуйте изменить поисковый запрос' 
                  : 'Добавьте категории в каталог'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCategories.map(category => renderCategory(category, 0))}
            </div>
          )}
        </div>

        {/* Информация о выбранной категории */}
        {selectedCategory && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Выбрана категория:</strong> {selectedPath.join(' → ')}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Товары из прайс-листа будут автоматически привязаны к этой категории каталога
            </p>
            {selectedCategory.products_count && selectedCategory.products_count > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                В категории уже есть {selectedCategory.products_count} товаров
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
