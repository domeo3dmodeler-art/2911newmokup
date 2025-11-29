'use client';

import React, { useState, useEffect } from 'react';

interface CatalogCategory {
  id: string;
  name: string;
  level: number;
  path: string;
  children?: CatalogCategory[];
  productCount?: number;
}

interface Property {
  name: string;
  type: string;
  values?: string[];
  count?: number;
}

interface CatalogSelectorProps {
  selectedCategoryIds: string[];
  selectedPropertyName: string;
  onCategoryChange: (categoryIds: string[]) => void;
  onPropertyChange: (propertyName: string) => void;
  showPropertySelector?: boolean;
}

export function CatalogSelector({ 
  selectedCategoryIds, 
  selectedPropertyName, 
  onCategoryChange, 
  onPropertyChange,
  showPropertySelector = true 
}: CatalogSelectorProps) {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Загрузка дерева каталога
  useEffect(() => {
    const loadCatalogTree = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/catalog/categories/tree');
        if (response.ok) {
          const responseData = await response.json();
          // API возвращает {success: true, data: {categories: [...]}}
          const data = responseData.data || responseData;
          setCategories(data.categories || []);
          
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
          autoExpand(data.categories || []);
        }
      } catch (error) {
        clientLogger.error('Error loading catalog tree:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCatalogTree();
  }, []);

  // Загрузка свойств для выбранных категорий
  useEffect(() => {
    if (selectedCategoryIds.length === 0) {
      setProperties([]);
      return;
    }

    const loadProperties = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        selectedCategoryIds.forEach(id => query.append('categoryIds', id));
        
        const response = await fetch(`/api/catalog/properties?${query.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties || []);
        }
      } catch (error) {
        clientLogger.error('Error loading properties:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [selectedCategoryIds]);

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

  const handleCategoryToggle = (categoryId: string) => {
    const newSelection = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter(id => id !== categoryId)
      : [...selectedCategoryIds, categoryId];
    
    onCategoryChange(newSelection);
  };

  // Функция для фильтрации категорий с сохранением иерархии
  const filterCategories = (categories: CatalogCategory[], searchTerm: string): CatalogCategory[] => {
    if (!searchTerm.trim()) {
      return categories;
    }

    const filtered: CatalogCategory[] = [];
    
    categories.forEach(category => {
      const matchesSearch = 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.path.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Фильтруем детей
      const filteredChildren = category.children ? filterCategories(category.children, searchTerm) : [];
      
      // Если категория или её дети соответствуют поиску
      if (matchesSearch || filteredChildren.length > 0) {
        filtered.push({
          ...category,
          children: filteredChildren
        });
      }
    });
    
    return filtered;
  };

  const filteredCategories = filterCategories(categories, searchTerm);

  const renderCategoryNode = (category: CatalogCategory, level = 0) => {
    const isExpanded = expandedNodes.has(category.id);
    const isSelected = selectedCategoryIds.includes(category.id);
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category.id} className="select-none">
        <div 
          className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer rounded text-sm ${
            isSelected ? 'bg-blue-100 text-blue-800' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {/* Expand/Collapse Icon */}
          <div 
            className="w-4 h-4 flex items-center justify-center mr-1 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) {
                toggleNode(category.id);
              }
            }}
          >
            {hasChildren ? (
              <svg 
                className={`w-3 h-3 transition-transform text-gray-500 hover:text-gray-700 ${isExpanded ? 'rotate-90' : ''}`}
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
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
            ) : (
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
          </div>
          
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleCategoryToggle(category.id)}
            className="mr-2 w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          
          <span 
            className="flex-1 truncate" 
            title={category.path}
            onClick={() => handleCategoryToggle(category.id)}
          >
            {category.name}
          </span>
          
          {category.productCount && (
            <span className="text-xs text-gray-500 ml-2">
              ({category.productCount})
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {category.children!.map(child => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Поиск категорий */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Поиск категорий
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Поиск по названию..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Выбор категорий */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Категории товаров
        </label>
        <div className="border border-gray-300 rounded-lg p-2 max-h-40 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              Загрузка категорий...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              Категории не найдены
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCategories.map(category => renderCategoryNode(category))}
            </div>
          )}
        </div>
        {selectedCategoryIds.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            Выбрано категорий: {selectedCategoryIds.length}
          </div>
        )}
      </div>

      {/* Выбор свойств */}
      {showPropertySelector && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Свойство для фильтрации
          </label>
          {selectedCategoryIds.length === 0 ? (
            <div className="text-sm text-gray-500 p-3 border border-gray-200 rounded-lg bg-gray-50">
              Сначала выберите категории товаров
            </div>
          ) : (
            <select
              value={selectedPropertyName}
              onChange={(e) => onPropertyChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Выберите свойство</option>
              {properties.map((property) => (
                <option key={property.name} value={property.name}>
                  {property.name} ({property.type})
                </option>
              ))}
            </select>
          )}
          {selectedPropertyName && (
            <div className="mt-1 text-xs text-gray-600">
              Выбрано: {selectedPropertyName}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
