'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Checkbox } from '../ui';
import { ChevronDown, ChevronRight, Package, Search } from 'lucide-react';

interface CatalogCategory {
  id: string;
  name: string;
  path: string;
  level: number;
  products_count: number;
  subcategories?: CatalogCategory[];
}

interface CatalogSelectorProps {
  selectedCategories: string[];
  multiSelect: boolean;
  showProductCount: boolean;
  onSelectionChange: (selectedIds: string[]) => void;
}

export default function CatalogSelector({
  selectedCategories,
  multiSelect,
  showProductCount,
  onSelectionChange
}: CatalogSelectorProps) {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Загрузка категорий каталога
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/catalog/categories');
      const data = await response.json();
      
      if (data.success && Array.isArray(data)) {
        setCategories(data);
      } else if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        clientLogger.error('Неожиданный формат данных каталога:', data);
        setCategories([]);
      }
    } catch (error) {
      clientLogger.error('Ошибка при загрузке категорий:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Переключение развертывания категории
  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Обработка выбора категории
  const handleCategorySelect = (categoryId: string) => {
    if (multiSelect) {
      const newSelection = selectedCategories.includes(categoryId)
        ? selectedCategories.filter(id => id !== categoryId)
        : [...selectedCategories, categoryId];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange([categoryId]);
    }
  };

  // Фильтрация категорий по поисковому запросу
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Рендер категории с подкатегориями
  const renderCategory = (category: CatalogCategory, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategories.includes(category.id);
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;

    return (
      <div key={category.id} className="select-none">
        <div
          className={`flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded transition-colors ${
            isSelected ? 'bg-blue-50 border border-blue-200' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => handleCategorySelect(category.id)}
        >
          {/* Кнопка развертывания */}
          <div className="w-6 h-6 flex items-center justify-center mr-2">
            {hasSubcategories ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(category.id);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>

          {/* Чекбокс */}
          <div className="mr-3">
            <Checkbox
              checked={isSelected}
              onChange={() => handleCategorySelect(category.id)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Иконка категории */}
          <div className="mr-3">
            <Package className="w-4 h-4 text-gray-500" />
          </div>

          {/* Информация о категории */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${
                isSelected ? 'text-blue-700' : 'text-gray-900'
              }`}>
                {category.name}
              </span>
              {showProductCount && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {category.products_count} товаров
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {category.path}
            </div>
          </div>
        </div>

        {/* Подкатегории */}
        {isExpanded && hasSubcategories && (
          <div>
            {category.subcategories?.map(subcategory =>
              renderCategory(subcategory, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка категорий...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Выбор категорий каталога
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {multiSelect 
            ? 'Выберите категории с товарами для конфигуратора'
            : 'Выберите основную категорию для конфигуратора'
          }
        </p>

        {/* Поиск */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Поиск категорий..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Список категорий */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: '400px' }}>
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm ? 'Категории не найдены' : 'Категории не загружены'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredCategories.map(category => renderCategory(category))}
          </div>
        )}
      </div>

      {/* Итоговая информация */}
      {selectedCategories.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Выбрано категорий: {selectedCategories.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectionChange([])}
            >
              Очистить выбор
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}



