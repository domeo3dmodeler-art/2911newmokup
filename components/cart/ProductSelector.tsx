'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, ShoppingCart, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { CartService } from '../../lib/cart/cart-service';
import { CartItem } from '../../lib/cart/types';
import { clientLogger } from '@/lib/logging/client-logger';

interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  basePrice: number;
  properties: Record<string, any>;
  images?: string[];
  description?: string;
}

interface ProductSelectorProps {
  onProductAdded?: (product: Product) => void;
  className?: string;
}

export default function ProductSelector({ onProductAdded, className = "" }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const cartService = CartService.getInstance();

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadProducts(selectedCategory);
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/catalog/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      clientLogger.error('Error loading categories:', error);
    }
  };

  const loadProducts = async (categoryId?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId);
      if (searchTerm) params.append('search', searchTerm);
      params.append('limit', '50');

      const response = await fetch(`/api/catalog/products?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      clientLogger.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadProducts(selectedCategory);
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
        setQuantities(prev => ({ ...prev, [productId]: 1 }));
      }
      return newSet;
    });
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [productId]: Math.max(1, quantity) }));
  };

  const handleAddToCart = async (product: Product) => {
    const quantity = quantities[product.id] || 1;
    
    try {
      const cartItem: Omit<CartItem, 'id' | 'subtotal' | 'discount' | 'tax' | 'total' | 'addedAt' | 'updatedAt'> = {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        categoryId: product.categoryId,
        categoryName: product.categoryName,
        quantity,
        basePrice: product.basePrice,
        options: [],
        modifications: [],
        specifications: product.properties,
        images: product.images || []
      };

      cartService.addItem(cartItem);
      
      // Убираем товар из выбранных
      setSelectedProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(product.id);
        return newSet;
      });
      
      // Вызываем колбэк
      if (onProductAdded) {
        onProductAdded(product);
      }

    } catch (error) {
      clientLogger.error('Error adding product to cart:', error);
      alert('Ошибка при добавлении товара в корзину');
    }
  };

  const handleAddSelectedToCart = async () => {
    const selectedProductsData = products.filter(p => selectedProducts.has(p.id));
    
    for (const product of selectedProductsData) {
      await handleAddToCart(product);
    }
  };

  const filteredProducts = products.filter(product => 
    !searchTerm || 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Выбор товаров
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-1" />
            Фильтры
          </Button>
        </div>

        {/* Search and Category Selection */}
        <div className="space-y-3">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск товаров по названию или артикулу..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              Поиск
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Все категории</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.products_count || 0})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Selected Products Summary */}
        {selectedProducts.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                Выбрано товаров: {selectedProducts.size}
              </span>
              <div className="space-x-2">
                <Button
                  size="sm"
                  onClick={handleAddSelectedToCart}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить все в корзину
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedProducts(new Set());
                    setQuantities({});
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Очистить выбор
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Products List */}
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Загрузка товаров...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
            <p>Товары не найдены</p>
            <p className="text-sm">Попробуйте изменить фильтры поиска</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                isSelected={selectedProducts.has(product.id)}
                quantity={quantities[product.id] || 1}
                onSelect={() => handleProductSelect(product.id)}
                onQuantityChange={(qty) => handleQuantityChange(product.id, qty)}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Компонент карточки товара
interface ProductCardProps {
  product: Product;
  isSelected: boolean;
  quantity: number;
  onSelect: () => void;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
}

function ProductCard({ product, isSelected, quantity, onSelect, onQuantityChange, onAddToCart }: ProductCardProps) {
  return (
    <div className={`border rounded-lg p-4 transition-all ${
      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="text-gray-400">
            <ShoppingCart className="h-8 w-8 mx-auto" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 truncate">{product.name}</h4>
        <p className="text-sm text-gray-500">{product.sku}</p>
        <p className="text-sm text-gray-600">{product.categoryName}</p>
        
        {product.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-blue-600">
            {product.basePrice.toLocaleString('ru-RU')} ₽
          </span>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded"
            />
            <span className="text-sm">Выбрать</span>
          </label>
        </div>

        {/* Quantity and Add Button */}
        {isSelected && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onQuantityChange(quantity - 1)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                -
              </button>
              <span className="w-8 text-center">{quantity}</span>
              <button
                onClick={() => onQuantityChange(quantity + 1)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                +
              </button>
            </div>
            <Button
              onClick={onAddToCart}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              В корзину
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}



