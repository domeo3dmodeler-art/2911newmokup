'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, Grid, List, Search, Filter, ShoppingCart, 
  Heart, Eye, Star, Calculator, Settings, TrendingUp,
  BarChart3, Users, ChevronRight, ChevronDown
} from 'lucide-react';
import { BaseElement } from '../ProfessionalPageBuilder';
import { clientLogger } from '@/lib/logging/client-logger';

export interface ProductElement extends BaseElement {
  props: {
    categoryId?: string;
    showFilters?: boolean;
    showSearch?: boolean;
    itemsPerPage?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    displayMode?: 'grid' | 'list' | 'carousel';
    showPrices?: boolean;
    showImages?: boolean;
    showDescription?: boolean;
    showAddToCart?: boolean;
    showFavorites?: boolean;
    filters?: any;
    searchQuery?: string;
  };
}

interface ProductElementRendererProps {
  element: ProductElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ProductElement>) => void;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  base_price: number;
  currency: string;
  image_url?: string;
  description?: string;
  properties_data?: any;
}

interface Category {
  id: string;
  name: string;
  level: number;
  path: string;
}

export const ProductElementRenderer: React.FC<ProductElementRendererProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>(element.props.categoryId || '');
  const [searchQuery, setSearchQuery] = useState<string>(element.props.searchQuery || '');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list' | 'carousel'>(element.props.displayMode || 'grid');

  useEffect(() => {
    loadCategories();
    if (selectedCategory) {
      loadProducts();
    }
  }, [selectedCategory, searchQuery]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/catalog/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      clientLogger.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    if (!selectedCategory) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        categoryId: selectedCategory,
        limit: (element.props.itemsPerPage || 12).toString(),
        sortBy: element.props.sortBy || 'name',
        sortOrder: element.props.sortOrder || 'asc'
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/catalog/products?${params}`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      clientLogger.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onUpdate(element.id, { props: { ...element.props, categoryId } });
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onUpdate(element.id, { props: { ...element.props, searchQuery: query } });
  };

  const handleDisplayModeChange = (mode: 'grid' | 'list' | 'carousel') => {
    setDisplayMode(mode);
    onUpdate(element.id, { props: { ...element.props, displayMode: mode } });
  };

  const renderProductGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map(product => (
        <div key={product.id} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
          {element.props.showImages && (
            <div className="w-full h-32 bg-gray-100 rounded-md mb-3 flex items-center justify-center">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-md" />
              ) : (
                <Package className="w-8 h-8 text-gray-400" />
              )}
            </div>
          )}
          <h4 className="font-medium text-sm mb-1">{product.name}</h4>
          {element.props.showDescription && product.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
          )}
          <div className="flex items-center justify-between">
            {element.props.showPrices && (
              <span className="font-semibold text-sm">{product.base_price} {product.currency}</span>
            )}
            {element.props.showAddToCart && (
              <button className="p-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                <ShoppingCart className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderProductList = () => (
    <div className="space-y-3">
      {products.map(product => (
        <div key={product.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
          {element.props.showImages && (
            <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-md" />
              ) : (
                <Package className="w-6 h-6 text-gray-400" />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{product.name}</h4>
            {element.props.showDescription && product.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{product.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {element.props.showPrices && (
              <span className="font-semibold text-sm">{product.base_price} {product.currency}</span>
            )}
            {element.props.showAddToCart && (
              <button className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderProductCarousel = () => (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {products.map(product => (
        <div key={product.id} className="flex-shrink-0 w-48 border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
          {element.props.showImages && (
            <div className="w-full h-32 bg-gray-100 rounded-md mb-3 flex items-center justify-center">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-md" />
              ) : (
                <Package className="w-8 h-8 text-gray-400" />
              )}
            </div>
          )}
          <h4 className="font-medium text-sm mb-1">{product.name}</h4>
          {element.props.showDescription && product.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
          )}
          <div className="flex items-center justify-between">
            {element.props.showPrices && (
              <span className="font-semibold text-sm">{product.base_price} {product.currency}</span>
            )}
            {element.props.showAddToCart && (
              <button className="p-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">
                <ShoppingCart className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    switch (element.type) {
      case 'product-grid':
      case 'product-list':
      case 'product-carousel':
        return (
          <div className="space-y-4">
            {/* Заголовок и контролы */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {categories.find(c => c.id === selectedCategory)?.name || 'Товары'}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDisplayModeChange('grid')}
                  className={`p-2 rounded ${displayMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDisplayModeChange('list')}
                  className={`p-2 rounded ${displayMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDisplayModeChange('carousel')}
                  className={`p-2 rounded ${displayMode === 'carousel' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  <Package className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Поиск */}
            {element.props.showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Фильтры */}
            {element.props.showFilters && (
              <div className="flex items-center space-x-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Выберите категорию</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Товары */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Загрузка товаров...</div>
              </div>
            ) : products.length > 0 ? (
              displayMode === 'grid' ? renderProductGrid() :
              displayMode === 'list' ? renderProductList() :
              renderProductCarousel()
            ) : (
              <div className="text-center py-8 text-gray-500">
                Товары не найдены
              </div>
            )}
          </div>
        );

      case 'product-search':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Поиск товаров</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Введите название товара..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {products.length > 0 && (
              <div className="space-y-2">
                {products.slice(0, 5).map(product => (
                  <div key={product.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{product.name}</span>
                    {element.props.showPrices && (
                      <span className="text-sm font-medium ml-auto">{product.base_price} {product.currency}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'price-calculator':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Калькулятор цены</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Категория</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Выберите категорию</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Количество</label>
                <input
                  type="number"
                  min="1"
                  defaultValue="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-md">
              <div className="flex items-center justify-between">
                <span className="font-medium">Итоговая стоимость:</span>
                <span className="text-xl font-bold text-blue-600">0 ₽</span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Компонент товаров</p>
            <p className="text-xs text-gray-400 mt-1">{element.name}</p>
          </div>
        );
    }
  };

  return (
    <div
      className={`relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        left: element.style.left || 0,
        top: element.style.top || 0,
        width: element.style.width || '100%',
        height: element.style.height || 'auto',
        zIndex: element.style.zIndex || 1,
      }}
      onClick={() => onSelect(element.id)}
    >
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {renderContent()}
      </div>
    </div>
  );
};

