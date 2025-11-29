'use client';

import React, { useState, useEffect } from 'react';
import { useProductData } from './ProductDataProvider';
import { 
  Package, Search, Filter, Grid, List, 
  ChevronDown, Star, ShoppingCart, Heart, Eye,
  Loader2, AlertCircle
} from 'lucide-react';

interface ProductComponentsProps {
  onProductSelect?: (product: any) => void;
  onPropertySelect?: (property: any) => void;
  className?: string;
}

export const ProductComponents: React.FC<ProductComponentsProps> = ({
  onProductSelect,
  onPropertySelect,
  className = ''
}) => {
  const {
    products,
    properties,
    selectedCategory,
    loading,
    error
  } = useProductData();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState(products);

  // Фильтрация товаров
  useEffect(() => {
    if (!searchQuery && !selectedProperty) {
      setFilteredProducts(products);
      return;
    }

    let filtered = products;

    // Поиск по названию и описанию
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query)
      );
    }

    // Фильтр по свойству
    if (selectedProperty) {
      filtered = filtered.filter(product =>
        product.properties_data[selectedProperty] !== undefined &&
        product.properties_data[selectedProperty] !== null &&
        product.properties_data[selectedProperty] !== ''
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedProperty]);

  // Обработка выбора товара
  const handleProductSelect = (product: any) => {
    onProductSelect?.(product);
  };

  // Обработка выбора свойства
  const handlePropertySelect = (property: any) => {
    setSelectedProperty(property.key);
    onPropertySelect?.(property);
  };

  // Рендер товара в виде карточки
  const renderProductCard = (product: any) => (
    <div
      key={product.id}
      className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => handleProductSelect(product)}
    >
      {/* Изображение */}
      <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
        {product.primaryImage ? (
          <img
            src={product.primaryImage.url}
            alt={product.primaryImage.alt_text || product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-xs text-gray-500 mb-2">
          {product.sku}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-blue-600">
            {product.base_price} {product.currency}
          </span>
          
          <div className="flex items-center space-x-1">
            <button className="p-1 hover:bg-gray-100 rounded">
              <Heart className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded">
              <ShoppingCart className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Рендер товара в виде списка
  const renderProductList = (product: any) => (
    <div
      key={product.id}
      className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
      onClick={() => handleProductSelect(product)}
    >
      {/* Изображение */}
      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        {product.primaryImage ? (
          <img
            src={product.primaryImage.url}
            alt={product.primaryImage.alt_text || product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="flex-1 ml-4 min-w-0">
        <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">
          {product.name}
        </h3>
        
        <p className="text-xs text-gray-500 mb-1">
          {product.sku}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-blue-600">
            {product.base_price} {product.currency}
          </span>
          
          <div className="flex items-center space-x-1">
            <button className="p-1 hover:bg-gray-100 rounded">
              <Heart className="w-4 h-4 text-gray-400" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded">
              <ShoppingCart className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!selectedCategory) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center ${className}`}>
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Выберите категорию</h3>
        <p className="text-gray-500">Для отображения товаров необходимо выбрать категорию из каталога</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Заголовок */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Товары ({filteredProducts.length})
          </h3>
          
          {/* Переключатель вида */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Поиск */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск товаров..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Свойства для фильтрации */}
      {properties.length > 0 && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center mb-2">
            <Filter className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Фильтры по свойствам:</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {properties.map(property => (
              <button
                key={property.key}
                onClick={() => handlePropertySelect(property)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedProperty === property.key
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {property.displayName}
                {property.count && (
                  <span className="ml-1 text-gray-500">({property.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Контент */}
      <div className="p-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="ml-2 text-sm text-gray-600">Загрузка товаров...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!loading && !error && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">
                  {searchQuery || selectedProperty ? 'Товары не найдены' : 'Товары не загружены'}
                </p>
              </div>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                  : 'space-y-3'
              }>
                {filteredProducts.map(product => 
                  viewMode === 'grid' ? renderProductCard(product) : renderProductList(product)
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

