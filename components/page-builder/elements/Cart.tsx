'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/auth/token-interceptor';
import { clientLogger } from '@/lib/logging/client-logger';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  configuration?: Record<string, string>;
  price: number;
  quantity: number;
  totalPrice: number;
}

import { BaseElement } from '../types';

interface CartProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

export function Cart({ element, onUpdate }: CartProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  // Получаем роль пользователя
  useEffect(() => {
    const user = getCurrentUser();
    if (user && user.role) {
      setUserRole(user.role);
    }
  }, []);

  // Загрузка корзины из localStorage или API
  useEffect(() => {
    const savedCart = localStorage.getItem('page-builder-cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        clientLogger.error('Error loading cart:', error);
      }
    }
  }, []);

  // Сохранение корзины
  useEffect(() => {
    localStorage.setItem('page-builder-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: Omit<CartItem, 'id' | 'totalPrice'>) => {
    const existingItem = cartItems.find(
      cartItem => 
        cartItem.productId === item.productId &&
        JSON.stringify(cartItem.configuration) === JSON.stringify(item.configuration)
    );

    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + item.quantity);
    } else {
      const newItem: CartItem = {
        ...item,
        id: Date.now().toString(),
        totalPrice: item.price * item.quantity
      };
      setCartItems(prev => [...prev, newItem]);
    }
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity, totalPrice: item.price * quantity }
          : item
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Экспорт корзины
  const exportCart = (format: 'quote' | 'invoice' | 'supplier') => {
    const exportData = {
      items: cartItems,
      total: getTotalPrice(),
      format,
      timestamp: new Date().toISOString()
    };

    // Экспорт корзины через API будет реализован позже
    clientLogger.debug('Exporting cart:', exportData);
  };

  const renderCartItem = (item: CartItem) => (
    <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-gray-200">
      {/* Изображение товара */}
      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        {item.productImage ? (
          <img
            src={item.productImage}
            alt={item.productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Информация о товаре */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 text-sm truncate">
          {item.productName}
        </h4>
        
        {/* Конфигурация */}
        {item.configuration && Object.keys(item.configuration).length > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            {Object.entries(item.configuration).map(([key, value]) => (
              <span key={key} className="mr-2">
                {key}: {value}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
            >
              -
            </button>
            <span className="text-sm font-medium">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300"
            >
              +
            </button>
          </div>
          
          <div className="text-right">
            <div className="font-medium text-gray-900">
              {item.totalPrice.toLocaleString()} ₽
            </div>
            <div className="text-xs text-gray-500">
              {item.price.toLocaleString()} ₽ за шт.
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка удаления */}
      <button
        onClick={() => removeFromCart(item.id)}
        className="p-1 text-gray-400 hover:text-red-600"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );

  const renderCartContent = () => (
    <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Cart Items */}
      <div className="max-h-96 overflow-y-auto">
        {cartItems.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h2m0 0h10" />
            </svg>
            <p className="text-gray-500">Корзина пуста</p>
          </div>
        ) : (
          <div className="p-4">
            {cartItems.map(renderCartItem)}
          </div>
        )}
      </div>

      {/* Footer */}
      {cartItems.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          {/* Total */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-900">Итого:</span>
            <span className="text-xl font-bold text-gray-900">
              {getTotalPrice().toLocaleString()} ₽
            </span>
          </div>

          {/* Export Buttons */}
          <div className="space-y-2">
            {/* Проверки разрешений по ролям */}
            {(userRole === 'admin' || userRole === 'complectator' || userRole === 'executor') && (
              <button
                onClick={() => exportCart('quote')}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Создать коммерческое предложение
              </button>
            )}
            {(userRole === 'admin' || userRole === 'complectator' || userRole === 'executor') && (
              <button
                onClick={() => exportCart('invoice')}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Создать счет
              </button>
            )}
            {(userRole === 'admin' || userRole === 'executor') && (
              <button
                onClick={() => exportCart('supplier')}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
              >
                Заказ поставщику
              </button>
            )}
          </div>

          {/* Clear Cart */}
          <button
            onClick={clearCart}
            className="w-full mt-2 text-sm text-gray-500 hover:text-red-600"
          >
            Очистить корзину
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Cart Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0h2m0 0h10" />
        </svg>
        
        {/* Badge */}
        {getTotalItems() > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {getTotalItems()}
          </span>
        )}
      </button>

      {/* Cart Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {renderCartContent()}
        </div>
      )}
    </>
  );
}
