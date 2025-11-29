'use client';

import React, { useState, useEffect } from 'react';
import { clientLogger } from '@/lib/logging/client-logger';
import { parseApiResponse } from '@/lib/utils/parse-api-response';

interface CatalogCategory {
  id: string;
  name: string;
  level: number;
  path: string;
  children?: CatalogCategory[];
  productCount?: number;
}

interface CatalogTreePanelProps {
  onCategorySelect?: (categoryId: string) => void;
  selectedCategoryIds?: string[];
}

export function CatalogTreePanel({ onCategorySelect, selectedCategoryIds = [] }: CatalogTreePanelProps) {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Загрузка дерева каталога
  useEffect(() => {
    const loadCatalogTree = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/catalog/categories');
        if (response.ok) {
          const data = await response.json();
          // apiSuccess возвращает { success: true, data: { categories: ..., total_count: ... } }
          const responseData = parseApiResponse<{ categories: CatalogCategory[]; total_count: number }>(data);
          const categories = responseData?.categories || [];
          
          setCategories(categories);
          
          // Автоматически раскрываем первые уровни
          const autoExpand = (cats: CatalogCategory[], level = 0) => {
            if (level < 2) {
              cats.forEach(cat => {
                setExpandedNodes(prev => new Set([...prev, cat.id]));
                if (cat.children) {
                  autoExpand(cat.children, level + 1);
                }
              });
            }
          };
          autoExpand(categories);
        }
      } catch (error) {
        clientLogger.error('Error loading catalog tree', error instanceof Error ? error : new Error(String(error)));
      } finally {
        setLoading(false);
      }
    };

    loadCatalogTree();
  }, []);

  const toggleNode = (categoryId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const renderCategory = (category: CatalogCategory, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedNodes.has(category.id);
    const isSelected = selectedCategoryIds.includes(category.id);
    const indentClass = `pl-${level * 4}`;

    return (
      <div key={category.id} className="select-none">
        <div 
          className={`flex items-center py-1 px-2 hover:bg-gray-50 cursor-pointer group ${
            isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(category.id);
            }
            onCategorySelect?.(category.id);
          }}
        >
          {/* Expand/Collapse Icon */}
          <div className="w-4 h-4 flex items-center justify-center mr-1">
            {hasChildren ? (
              <svg 
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
            )}
          </div>

          {/* Category Icon */}
          <div className="w-4 h-4 mr-2 flex items-center justify-center">
            {hasChildren ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
          </div>

          {/* Category Name */}
          <span className="text-xs font-medium truncate flex-1">
            {category.name}
          </span>

          {/* Product Count */}
          {category.productCount !== undefined && (
            <span className="text-xs text-gray-400 ml-1">
              ({category.productCount})
            </span>
          )}

          {/* Selection Indicator */}
          {isSelected && (
            <div className="w-2 h-2 bg-blue-600 rounded-full ml-1" />
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredCategories = categories.filter(category => 
    !searchTerm || category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-2 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Каталог товаров</h3>
        </div>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Поиск категорий..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <div className="text-sm text-gray-500">Загрузка каталога...</div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-4 text-center">
            <div className="text-sm text-gray-500">
              {searchTerm ? 'Категории не найдены' : 'Нет категорий'}
            </div>
          </div>
        ) : (
          <div>
            {filteredCategories.map(category => renderCategory(category))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          {selectedCategoryIds.length > 0 
            ? `Выбрано: ${selectedCategoryIds.length}`
            : 'Кликните для выбора'
          }
        </div>
      </div>
    </div>
  );
}
