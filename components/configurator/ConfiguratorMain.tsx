'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui';
import ConfiguratorCategoryDisplay from './ConfiguratorCategoryDisplay';
import ConfiguratorCart from './ConfiguratorCart';
import { clientLogger } from '@/lib/logging/client-logger';

interface ConfiguratorCategory {
  id: string;
  name: string;
  slug: string;
}

interface CatalogCategory {
  id: string;
  name: string;
  level: number;
  path: string;
}

interface CategoryLink {
  id: string;
  configurator_category_id: string;
  catalog_category_id: string;
  link_type: 'main' | 'additional';
  display_order: number;
  is_required: boolean;
  pricing_type: 'separate' | 'included' | 'formula';
  formula?: string;
  export_as_separate: boolean;
  catalog_category: CatalogCategory;
}

interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  description?: string;
  properties_data?: string;
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  category_link: CategoryLink;
  calculated_price?: number;
}

interface ConfiguratorMainProps {
  configuratorCategoryId: string;
  configuratorCategory: ConfiguratorCategory;
}

export default function ConfiguratorMain({
  configuratorCategoryId,
  configuratorCategory
}: ConfiguratorMainProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    // Загружаем корзину из localStorage при инициализации
    const savedCart = localStorage.getItem(`cart_${configuratorCategoryId}`);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        clientLogger.error('Error loading cart from localStorage:', error);
      }
    }
  }, [configuratorCategoryId]);

  useEffect(() => {
    // Сохраняем корзину в localStorage при изменении
    localStorage.setItem(`cart_${configuratorCategoryId}`, JSON.stringify(cartItems));
    
    // Показываем корзину автоматически при добавлении товаров
    if (cartItems.length > 0 && !showCart) {
      setShowCart(true);
    }
  }, [cartItems, configuratorCategoryId, showCart]);

  const handleAddToCart = (item: CartItem) => {
    setCartItems(prev => {
      // Проверяем, есть ли уже такой товар в корзине
      const existingItemIndex = prev.findIndex(cartItem => 
        cartItem.product.id === item.product.id && 
        cartItem.category_link.id === item.category_link.id
      );

      if (existingItemIndex >= 0) {
        // Если товар уже есть, увеличиваем количество
        const updatedItems = [...prev];
        updatedItems[existingItemIndex].quantity += item.quantity;
        return updatedItems;
      } else {
        // Если товара нет, добавляем новый
        return [...prev, item];
      }
    });
  };

  const handleUpdateCartQuantity = (itemId: string, quantity: number) => {
    setCartItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleClearCart = () => {
    if (confirm('Очистить корзину?')) {
      setCartItems([]);
      localStorage.removeItem(`cart_${configuratorCategoryId}`);
    }
  };

  const handleExport = async (type: 'quote' | 'invoice' | 'order', exportSettingId?: string) => {
    try {
      // Подготавливаем данные для экспорта
      const exportData = {
        configurator_category: configuratorCategory,
        cart_items: cartItems,
        export_type: type,
        total_price: cartItems.reduce((sum, item) => 
          sum + (item.calculated_price || item.product.price) * item.quantity, 0
        ),
        export_setting_id: exportSettingId
      };

      const response = await fetch('/api/configurator/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const typeNames = {
          quote: 'коммерческое_предложение',
          invoice: 'счет',
          order: 'заказ_поставщику'
        };
        
        link.download = `${typeNames[type]}_${configuratorCategory.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Ошибка экспорта');
      }
    } catch (error) {
      clientLogger.error('Error exporting:', error);
      alert('Ошибка при экспорте документа');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {configuratorCategory.name}
              </h1>
              <p className="text-gray-600">
                Конфигуратор для подбора товаров
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCart(!showCart)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showCart 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>Корзина</span>
                {cartItems.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Конфигуратор */}
          <div className={showCart ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <ConfiguratorCategoryDisplay
              configuratorCategoryId={configuratorCategoryId}
              onAddToCart={handleAddToCart}
              onUpdateCartQuantity={handleUpdateCartQuantity}
              onRemoveFromCart={handleRemoveFromCart}
              cartItems={cartItems}
            />
          </div>

          {/* Корзина */}
          {showCart && (
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <ConfiguratorCart
                  cartItems={cartItems}
                  onUpdateQuantity={handleUpdateCartQuantity}
                  onRemoveItem={handleRemoveFromCart}
                  onClearCart={handleClearCart}
                  onExport={handleExport}
                  showGrouped={true}
                  configuratorCategoryId={configuratorCategoryId}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
