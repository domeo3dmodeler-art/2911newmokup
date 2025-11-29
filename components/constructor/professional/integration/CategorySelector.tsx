'use client';

import React from 'react';
import { useProductData } from './ProductDataProvider';
import { 
  Package, Search, ChevronDown, ChevronRight, Check, 
  Loader2, AlertCircle, RefreshCw 
} from 'lucide-react';

interface CategorySelectorProps {
  onCategorySelect?: (categoryId: string, categoryName: string) => void;
  selectedCategoryId?: string;
  className?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  onCategorySelect,
  selectedCategoryId,
  className = ''
}) => {
  const {
    categories,
    selectedCategory,
    loading,
    error,
    selectCategory,
    refreshData
  } = useProductData();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set());

  // Обработка выбора категории
  const handleCategorySelect = async (categoryId: string, categoryName: string) => {
    await selectCategory(categoryId);
    onCategorySelect?.(categoryId, categoryName);
  };

  // Переключение развернутости категории
  const toggleCategory = (categoryId: string) => {
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

  // Рендер категории с подкатегориями
  const renderCategory = (category: any, level: number = 0) => {
    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategoryId === category.id;
    
    return (
      <div key={category.id} className="select-none">
        <div
          className={`flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer rounded-md transition-colors ${
            isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${12 + level * 20}px` }}
          onClick={() => handleCategorySelect(category.id, category.name)}
        >
          {/* Иконка развертывания */}
          {hasSubcategories ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(category.id);
              }}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <div className="w-6 mr-2" />
          )}
          
          {/* Иконка категории */}
          <Package className="w-4 h-4 text-gray-500 mr-2" />
          
          {/* Название и счетчик */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 truncate">
                {category.name}
              </span>
              {category.products_count !== undefined && (
                <span className="text-xs text-gray-500 ml-2">
                  {category.products_count}
                </span>
              )}
            </div>
          </div>
          
          {/* Индикатор выбора */}
          {isSelected && (
            <Check className="w-4 h-4 text-blue-600 ml-2" />
          )}
        </div>
        
        {/* Подкатегории */}
        {hasSubcategories && isExpanded && (
          <div>
            {category.subcategories.map((subcategory: any) => 
              renderCategory(subcategory, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // Фильтрация категорий по поиску
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Заголовок */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Выбор категории</h3>
          <button
            onClick={refreshData}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Обновить"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        {/* Поиск */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск категорий..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Контент */}
      <div className="p-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="ml-2 text-sm text-gray-600">Загрузка...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">
                  {searchQuery ? 'Категории не найдены' : 'Категории не загружены'}
                </p>
              </div>
            ) : (
              filteredCategories.map(category => renderCategory(category))
            )}
          </div>
        )}

        {/* Выбранная категория */}
        {selectedCategory && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-600">
              <Package className="w-4 h-4 mr-2 text-blue-600" />
              <span className="font-medium">Выбрано:</span>
              <span className="ml-2 text-gray-900">{selectedCategory.name}</span>
              {selectedCategory.products_count !== undefined && (
                <span className="ml-2 text-gray-500">
                  ({selectedCategory.products_count} товаров)
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

