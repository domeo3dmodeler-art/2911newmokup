'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Card, Badge } from '../ui';
import { 
  ShoppingCart, 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  Trash2, 
  Download, 
  FileText,
  Calculator,
  Eye,
  ChevronDown,
  ChevronRight,
  Grid,
  List,
  Sliders
} from 'lucide-react';
import { clientLogger } from '@/lib/logging/client-logger';

// ===== ТИПЫ =====

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  properties: { [key: string]: string };
  categoryId: string;
  sku?: string;
  stock?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedOptions: { [key: string]: string };
  totalPrice: number;
}

interface ConstructorConfig {
  blocks: BlockSettings[];
  categories: CategoryConfig[];
  globalSettings: any;
}

interface BlockSettings {
  id: string;
  name: string;
  type: string;
  categoryId?: string;
  subcategoryIds?: string[];
  additionalCategoryIds?: string[];
  layout: 'grid' | 'list' | 'masonry' | 'carousel';
  columns: number;
  itemsPerPage: number;
  imageSize: 'small' | 'medium' | 'large' | 'xlarge';
  imageAspectRatio: 'square' | 'landscape' | 'portrait' | 'auto';
  showImages: boolean;
  showPrices: boolean;
  showDescriptions: boolean;
  showFilters: boolean;
  showSearch: boolean;
  filters: any[];
  sortBy: 'name' | 'price' | 'popularity' | 'date';
  sortOrder: 'asc' | 'desc';
  pricingRules: any[];
  cartSettings: any;
  exportSettings: any;
  styles: any;
}

interface CategoryConfig {
  id: string;
  name: string;
  type: 'main' | 'sub' | 'additional';
  parentId?: string;
  catalogCategoryId: string;
  products: Product[];
  properties: any[];
  pricingRules: any;
}

// ===== КОМПОНЕНТЫ =====

// Компонент отображения товаров
const ProductGrid = ({ 
  products, 
  layout, 
  columns, 
  imageSize, 
  imageAspectRatio, 
  showImages, 
  showPrices, 
  showDescriptions,
  onAddToCart 
}: {
  products: Product[];
  layout: string;
  columns: number;
  imageSize: string;
  imageAspectRatio: string;
  showImages: boolean;
  showPrices: boolean;
  showDescriptions: boolean;
  onAddToCart: (product: Product) => void;
}) => {
  const getImageSizeClass = () => {
    switch (imageSize) {
      case 'small': return 'h-32';
      case 'medium': return 'h-48';
      case 'large': return 'h-64';
      case 'xlarge': return 'h-80';
      default: return 'h-48';
    }
  };

  const getAspectRatioClass = () => {
    switch (imageAspectRatio) {
      case 'square': return 'aspect-square';
      case 'landscape': return 'aspect-video';
      case 'portrait': return 'aspect-[3/4]';
      default: return 'aspect-auto';
    }
  };

  const getGridCols = () => {
    switch (columns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-3';
      case 4: return 'grid-cols-4';
      case 5: return 'grid-cols-5';
      case 6: return 'grid-cols-6';
      default: return 'grid-cols-3';
    }
  };

  if (layout === 'list') {
    return (
      <div className="space-y-4">
        {products.map((product) => (
          <Card key={product.id} className="p-4">
            <div className="flex items-center space-x-4">
              {showImages && product.image && (
                <div className={`flex-shrink-0 ${getImageSizeClass()} ${getAspectRatioClass()}`}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {product.name}
                </h3>
                {showDescriptions && product.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                )}
                {showPrices && (
                  <p className="text-lg font-semibold text-blue-600 mt-2">
                    {product.price.toLocaleString()} ₽
                  </p>
                )}
              </div>
              <div className="flex-shrink-0">
                <Button onClick={() => onAddToCart(product)}>
                  <Plus className="w-4 h-4 mr-2" />
                  В корзину
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid ${getGridCols()} gap-4`}>
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          {showImages && product.image && (
            <div className={`${getImageSizeClass()} ${getAspectRatioClass()}`}>
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {product.name}
            </h3>
            {showDescriptions && product.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                {product.description}
              </p>
            )}
            {showPrices && (
              <p className="text-xl font-bold text-blue-600 mb-3">
                {product.price.toLocaleString()} ₽
              </p>
            )}
            <Button 
              onClick={() => onAddToCart(product)}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              В корзину
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

// Компонент фильтров
const ProductFilters = ({ 
  properties, 
  filters, 
  onFiltersChange 
}: {
  properties: any[];
  filters: { [key: string]: string[] };
  onFiltersChange: (filters: { [key: string]: string[] }) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (property: string, value: string, checked: boolean) => {
    const newFilters = { ...filters };
    if (!newFilters[property]) {
      newFilters[property] = [];
    }
    
    if (checked) {
      newFilters[property].push(value);
    } else {
      newFilters[property] = newFilters[property].filter(v => v !== value);
    }
    
    onFiltersChange(newFilters);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
      >
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Фильтры</span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      
      {isOpen && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {properties.map((property) => (
            <div key={property.name}>
              <h4 className="font-medium text-gray-900 mb-2">{property.name}</h4>
              <div className="space-y-2">
                {property.values?.map((value: string) => (
                  <label key={value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters[property.name]?.includes(value) || false}
                      onChange={(e) => handleFilterChange(property.name, value, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{value}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент корзины
const Cart = ({ 
  items, 
  onQuantityChange, 
  onRemoveItem, 
  onClearCart,
  settings 
}: {
  items: CartItem[];
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  settings: any;
}) => {
  const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <ShoppingCart className="w-5 h-5 mr-2" />
          Корзина ({items.length})
        </h3>
        {items.length > 0 && (
          <Button onClick={onClearCart} variant="outline" size="sm">
            Очистить
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Корзина пуста</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center space-x-3 p-3 border border-gray-100 rounded-lg">
              {item.product.image && (
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {item.product.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {item.product.price.toLocaleString()} ₽
                </p>
              </div>
              {settings.allowQuantityChange && (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onQuantityChange(item.product.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onQuantityChange(item.product.id, item.quantity + 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              )}
              {settings.allowItemRemoval && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveItem(item.product.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          
          {settings.showCalculations && (
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Итого:</span>
                <span>{totalPrice.toLocaleString()} ₽</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Компонент генератора документов
const DocumentGenerator = ({ 
  items, 
  settings 
}: {
  items: CartItem[];
  settings: any;
}) => {
  const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const generateQuote = () => {
    const quoteData = {
      items: items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        total: item.totalPrice
      })),
      total: totalPrice,
      date: new Date().toLocaleDateString()
    };
    
    clientLogger.debug('Генерация коммерческого предложения:', quoteData);
    // Здесь будет реальная генерация документа
    alert('Коммерческое предложение сгенерировано!');
  };

  const generateInvoice = () => {
    clientLogger.debug('Генерация счета-фактуры');
    alert('Счет-фактура сгенерирована!');
  };

  const generateOrder = () => {
    clientLogger.debug('Генерация заказа');
    alert('Заказ сгенерирован!');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2" />
        Документы
      </h3>
      
      <div className="space-y-3">
        {settings.quoteEnabled && (
          <Button onClick={generateQuote} className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Коммерческое предложение
          </Button>
        )}
        
        {settings.invoiceEnabled && (
          <Button onClick={generateInvoice} className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Счет-фактура
          </Button>
        )}
        
        {settings.orderEnabled && (
          <Button onClick={generateOrder} className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Заказ
          </Button>
        )}
      </div>
      
      {settings.showTotals && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Общая стоимость: <span className="font-semibold">{totalPrice.toLocaleString()} ₽</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Главный компонент предпросмотра
export default function ProfessionalPreview({ 
  config 
}: { 
  config: ConstructorConfig 
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Загрузка товаров
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch('/api/catalog/products?limit=100');
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        clientLogger.error('Ошибка загрузки товаров:', error);
      }
    };

    loadProducts();
  }, []);

  // Фильтрация товаров
  useEffect(() => {
    let filtered = products;

    // Фильтр по категории
    if (selectedCategory) {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }

    // Поиск
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фильтры по свойствам
    Object.entries(filters).forEach(([property, values]) => {
      if (values.length > 0) {
        filtered = filtered.filter(product => 
          values.includes(product.properties[property])
        );
      }
    });

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery, filters]);

  // Добавление в корзину
  const handleAddToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.product.id === product.id);
    
    if (existingItem) {
      setCartItems(items =>
        items.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * product.price }
            : item
        )
      );
    } else {
      const newItem: CartItem = {
        product,
        quantity: 1,
        selectedOptions: {},
        totalPrice: product.price
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  // Изменение количества в корзине
  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCartItems(items =>
      items.map(item =>
        item.product.id === productId
          ? { ...item, quantity, totalPrice: quantity * item.product.price }
          : item
      )
    );
  };

  // Удаление из корзины
  const handleRemoveItem = (productId: string) => {
    setCartItems(items => items.filter(item => item.product.id !== productId));
  };

  // Очистка корзины
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Получение настроек блока по типу
  const getBlockSettings = (type: string) => {
    const block = config.blocks.find(b => b.type === type);
    return block || {
      layout: 'grid',
      columns: 3,
      itemsPerPage: 12,
      imageSize: 'medium',
      imageAspectRatio: 'square',
      showImages: true,
      showPrices: true,
      showDescriptions: true,
      showFilters: true,
      showSearch: true,
      cartSettings: {},
      exportSettings: {}
    };
  };

  // Получение свойств категории для фильтров
  const getCategoryProperties = () => {
    if (!selectedCategory) return [];
    
    const category = config.categories.find(cat => cat.id === selectedCategory);
    return category?.properties || [];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Предпросмотр конфигуратора
          </h1>
          <p className="text-gray-600">
            Реальные данные и функциональность
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Основной контент */}
          <div className="lg:col-span-3 space-y-8">
            {/* Поиск и фильтры */}
            {config.blocks.some(block => block.showSearch || block.showFilters) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {config.blocks.some(block => block.showSearch) && (
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Поиск товаров..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}
                  
                  {config.blocks.some(block => block.showFilters) && (
                    <div className="lg:w-64">
                      <Select
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        options={[
                          { value: '', label: 'Все категории' },
                          ...config.categories.map(cat => ({
                            value: cat.id,
                            label: cat.name
                          }))
                        ]}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Фильтры по свойствам */}
            {config.blocks.some(block => block.showFilters) && getCategoryProperties().length > 0 && (
              <ProductFilters
                properties={getCategoryProperties()}
                filters={filters}
                onFiltersChange={setFilters}
              />
            )}

            {/* Блоки контента */}
            {config.blocks.map((block) => {
              switch (block.type) {
                case 'main-category':
                case 'subcategory':
                case 'additional-category':
                case 'product-selector':
                  const settings = getBlockSettings(block.type);
                  return (
                    <div key={block.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">{block.name}</h2>
                        <Badge variant="outline">{block.type}</Badge>
                      </div>
                      
                      <ProductGrid
                        products={filteredProducts.slice(0, settings.itemsPerPage)}
                        layout={settings.layout}
                        columns={settings.columns}
                        imageSize={settings.imageSize}
                        imageAspectRatio={settings.imageAspectRatio}
                        showImages={settings.showImages}
                        showPrices={settings.showPrices}
                        showDescriptions={settings.showDescriptions}
                        onAddToCart={handleAddToCart}
                      />
                      
                      {filteredProducts.length > settings.itemsPerPage && (
                        <div className="mt-6 text-center">
                          <Button variant="outline">
                            Показать еще ({filteredProducts.length - settings.itemsPerPage})
                          </Button>
                        </div>
                      )}
                    </div>
                  );

                case 'text':
                  return (
                    <div key={block.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div 
                        className="prose max-w-none"
                        style={block.styles}
                      >
                        <h2>{block.name}</h2>
                        <p>Это пример текстового блока. Здесь может быть любой контент.</p>
                      </div>
                    </div>
                  );

                default:
                  return null;
              }
            })}
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* Корзина */}
            {config.blocks.some(block => block.type === 'cart') && (
              <Cart
                items={cartItems}
                onQuantityChange={handleQuantityChange}
                onRemoveItem={handleRemoveItem}
                onClearCart={handleClearCart}
                settings={getBlockSettings('cart').cartSettings}
              />
            )}

            {/* Генератор документов */}
            {config.blocks.some(block => block.type === 'document-generator') && (
              <DocumentGenerator
                items={cartItems}
                settings={getBlockSettings('document-generator').exportSettings}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

