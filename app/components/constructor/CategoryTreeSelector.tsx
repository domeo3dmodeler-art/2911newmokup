'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  parentId?: string | null;
  level?: number;
  productCount?: number;
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  children?: Category[];
}

interface CategoryTreeSelectorProps {
  value: string;
  onChange: (categoryId: string, categoryInfo?: any) => void;
  categories: Category[];
}

const CategoryTreeSelector: React.FC<CategoryTreeSelectorProps> = ({
  value,
  onChange,
  categories
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const buildTree = (categories: Category[], parentId: string | null = null): Category[] => {
    return categories
      .filter(cat => {
        // Если parentId null, ищем корневые категории
        if (parentId === null) {
          return cat.parentId === null;
        }
        return cat.parentId === parentId;
      })
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(cat => {
        const children = buildTree(categories, cat.id);
        return {
          ...cat,
          children: children.length > 0 ? children : undefined
        };
      });
  };

  // Фильтрация категорий по поиску
  const filteredCategories = searchTerm.trim() 
    ? categories.filter(cat => 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : categories;

  const tree = buildTree(filteredCategories);
  
  // Отладка
  clientLogger.debug('CategoryTreeSelector - categories:', categories);
  clientLogger.debug('CategoryTreeSelector - filteredCategories:', filteredCategories);
  clientLogger.debug('CategoryTreeSelector - tree:', tree);
  
  // Показываем категории "Двери"
  const doorsCategories = categories.filter(cat => cat.name.includes('Двер'));
  clientLogger.debug('CategoryTreeSelector - doors categories:', doorsCategories);

  const renderNode = (node: Category, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = value === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`
            flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 rounded
            ${isSelected ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}
          `}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onChange(node.id, node)}
        >
          <div
            className="flex items-center mr-2"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) {
                toggleExpanded(node.id);
              }
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>
          
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
          ) : (
            <Folder className="w-4 h-4 mr-2 text-gray-500" />
          )}
          
          <span className="text-sm font-medium truncate">{node.name}</span>
          
          {node.productCount !== undefined && node.productCount > 0 && (
            <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {node.productCount}
            </span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg max-h-64 overflow-hidden flex flex-col">
      {/* Поле поиска */}
      <div className="p-2 border-b border-gray-200">
        <input
          type="text"
          placeholder="Поиск категорий..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      {/* Список категорий */}
      <div className="flex-1 overflow-y-auto">
        {tree.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {searchTerm.trim() ? 'Категории не найдены' : 'Категории не загружены'}
          </div>
        ) : (
          tree.map(node => renderNode(node))
        )}
      </div>
    </div>
  );
};

export default CategoryTreeSelector;
