'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';

interface CatalogCategory {
  id: string;
  name: string;
  level: number;
  parent_id?: string;
  product_count?: number;
  displayName?: string;
}

interface CatalogTreeNode extends CatalogCategory {
  children: CatalogTreeNode[];
  isExpanded?: boolean;
}

interface CatalogTreeProps {
  categories: CatalogCategory[];
  selectedCategoryId: string;
  onCategorySelect: (categoryId: string) => void;
  searchTerm?: string;
}

export default function CatalogTree({
  categories,
  selectedCategoryId,
  onCategorySelect,
  searchTerm = ''
}: CatalogTreeProps) {
  const [treeData, setTreeData] = useState<CatalogTreeNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Строим дерево из плоского списка
  useEffect(() => {
    const buildTree = (categories: CatalogCategory[]): CatalogTreeNode[] => {
      const categoryMap = new Map<string, CatalogTreeNode>();
      const rootNodes: CatalogTreeNode[] = [];

      // Создаем узлы
      categories.forEach(category => {
        categoryMap.set(category.id, {
          ...category,
          children: [],
          isExpanded: expandedNodes.has(category.id)
        });
      });

      // Строим иерархию
      categories.forEach(category => {
        const node = categoryMap.get(category.id)!;
        
        if (category.parent_id && categoryMap.has(category.parent_id)) {
          const parent = categoryMap.get(category.parent_id)!;
          parent.children.push(node);
        } else {
          rootNodes.push(node);
        }
      });

      // Сортируем узлы
      const sortNodes = (nodes: CatalogTreeNode[]): CatalogTreeNode[] => {
        return nodes.sort((a, b) => {
          // Сначала по уровню, потом по названию
          if (a.level !== b.level) {
            return a.level - b.level;
          }
          return a.name.localeCompare(b.name);
        }).map(node => ({
          ...node,
          children: sortNodes(node.children)
        }));
      };

      return sortNodes(rootNodes);
    };

    setTreeData(buildTree(categories));
  }, [categories, expandedNodes]);

  // Фильтрация по поисковому запросу
  const filteredTreeData = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return treeData;
    }

    const filterTree = (nodes: CatalogTreeNode[]): CatalogTreeNode[] => {
      return nodes.reduce((filtered: CatalogTreeNode[], node) => {
        const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase());
        const filteredChildren = filterTree(node.children);

        if (matchesSearch || filteredChildren.length > 0) {
          filtered.push({
            ...node,
            children: filteredChildren,
            isExpanded: matchesSearch || filteredChildren.length > 0
          });
        }

        return filtered;
      }, []);
    };

    return filterTree(treeData);
  }, [treeData, searchTerm]);

  // Переключение раскрытия узла
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

  // Рендер узла дерева
  const renderTreeNode = (node: CatalogTreeNode, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedCategoryId === node.id;
    const indentStyle = { paddingLeft: `${depth * 20 + 8}px` };

    return (
      <div key={node.id}>
        <div
          className={`flex items-center cursor-pointer transition-colors hover:bg-gray-50 ${
            isSelected
              ? 'bg-black text-white hover:bg-gray-800'
              : 'hover:bg-gray-50'
          }`}
          style={indentStyle}
          onClick={() => onCategorySelect(node.id)}
        >
          {/* Кнопка раскрытия */}
          <div className="flex items-center w-6 h-6 mr-2">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className="flex items-center justify-center w-4 h-4 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>

          {/* Иконка папки */}
          <div className="flex items-center mr-2">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500" />
              ) : (
                <Folder className="w-4 h-4 text-gray-400" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>

          {/* Название категории */}
          <div className="flex-1 flex items-center justify-between">
            <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-900'}`}>
              {node.name}
            </span>
            
            {/* Счетчик товаров */}
            {node.product_count !== undefined && (
              <span className={`text-sm px-2 py-1 rounded ${
                isSelected 
                  ? 'bg-gray-700 text-gray-200' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {node.product_count}
              </span>
            )}
          </div>
        </div>

        {/* Дочерние узлы */}
        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => (
              <div key={child.id}>
                {renderTreeNode(child, depth + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Автоматически раскрываем узлы при поиске
  useEffect(() => {
    if (searchTerm.trim()) {
      const expandAllNodes = (nodes: CatalogTreeNode[]): Set<string> => {
        const expanded = new Set<string>();
        
        const traverse = (nodeList: CatalogTreeNode[]) => {
          nodeList.forEach(node => {
            if (node.children.length > 0) {
              expanded.add(node.id);
              traverse(node.children);
            }
          });
        };
        
        traverse(nodes);
        return expanded;
      };
      
      setExpandedNodes(expandAllNodes(filteredTreeData));
    }
  }, [searchTerm, filteredTreeData]);

  return (
    <div className="space-y-1">
      {filteredTreeData.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          {searchTerm ? 'Категории не найдены' : 'Нет категорий'}
        </div>
      ) : (
        filteredTreeData.map(node => (
          <div key={node.id}>
            {renderTreeNode(node)}
          </div>
        ))
      )}
    </div>
  );
}
