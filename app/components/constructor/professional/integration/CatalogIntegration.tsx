'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, Search, Filter, Settings, Eye, 
  ChevronDown, ChevronRight, Check, X,
  AlertCircle, Loader2, RefreshCw
} from 'lucide-react';

export interface CatalogCategory {
  id: string;
  name: string;
  parent_id?: string;
  level: number;
  path: string;
  sort_order: number;
  is_active: boolean;
  products_count?: number;
  subcategories?: CatalogCategory[];
}

export interface ProductProperty {
  key: string;
  displayName: string;
  type: 'select' | 'text' | 'number' | 'boolean';
  values?: string[];
  count?: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  base_price: number;
  currency: string;
  properties_data: Record<string, any>;
  images: Array<{
    id: string;
    url: string;
    alt_text?: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  primaryImage?: {
    id: string;
    url: string;
    alt_text?: string;
    is_primary: boolean;
    sort_order: number;
  };
}

export interface CatalogData {
  categories: CatalogCategory[];
  products: Product[];
  properties: ProductProperty[];
  selectedCategoryId?: string;
}

interface CatalogIntegrationProps {
  onCategorySelect: (categoryId: string, categoryName: string) => void;
  onDataLoad: (data: CatalogData) => void;
  selectedCategoryId?: string;
}

export const CatalogIntegration: React.FC<CatalogIntegrationProps> = ({
  onCategorySelect,
  onDataLoad,
  selectedCategoryId
}) => {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [properties, setProperties] = useState<ProductProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка дерева каталога
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/catalog/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
      
      // Автоматически разворачиваем категории с товарами
      const categoriesWithProducts = data.categories?.filter((cat: CatalogCategory) => 
        cat.products_count && cat.products_count > 0
      ) || [];
      
      setExpandedCategories(new Set(categoriesWithProducts.map((cat: CatalogCategory) => cat.id)));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка товаров категории
  const loadCategoryProducts = useCallback(async (categoryId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/products/category/${categoryId}?limit=1000`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products || []);
        setProperties(data.data.filters?.available || []);
        
        // Передаем данные родительскому компоненту
        onDataLoad({
          categories,
          products: data.data.products || [],
          properties: data.data.filters?.available || [],
          selectedCategoryId: categoryId
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [categories, onDataLoad]);

  // Поиск категорий
  const searchCategories = useCallback(async (query: string) => {
    if (!query.trim()) {
      loadCategories();
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/catalog/categories?search=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to search categories');
      }
      
      const data = await response.json();
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [loadCategories]);

  // Обработка выбора категории
  const handleCategorySelect = (category: CatalogCategory) => {
    onCategorySelect(category.id, category.name);
    loadCategoryProducts(category.id);
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
  const renderCategory = (category: CatalogCategory, level: number = 0) => {
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
          onClick={() => handleCategorySelect(category)}
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
            {category.subcategories!.map(subcategory => 
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

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(() => {
        searchCategories(searchQuery);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      loadCategories();
    }
  }, [searchQuery, searchCategories, loadCategories]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Заголовок */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Каталог товаров</h3>
          <button
            onClick={loadCategories}
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

        {/* Статистика */}
        {!loading && !error && products.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Товаров:</span>
                <span className="ml-2 font-medium">{products.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Свойств:</span>
                <span className="ml-2 font-medium">{properties.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

