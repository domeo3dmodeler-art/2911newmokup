import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, FileText, Download, User } from 'lucide-react';
import { Button } from '@/components/ui';
import { CartService } from '../../lib/cart/cart-service';
import { Cart, CartItem } from '../../lib/cart/types';
import MultiCategoryCart from '../cart/MultiCategoryCart';
import DocumentGeneratorSimple from '../documents/DocumentGeneratorSimple';

interface CartBlockProps {
  settings: {
    showItemList: boolean;
    showCalculation: boolean;
    showActions: boolean;
    allowQuantityChange: boolean;
    allowItemRemoval: boolean;
    showClientForm: boolean;
    autoCalculate: boolean;
    showTax: boolean;
    showDiscount: boolean;
    maxItems: number;
  };
  className?: string;
}

export default function CartBlock({ settings, className = "" }: CartBlockProps) {
        // Если включен полный функционал, используем MultiCategoryCart с генератором документов
        if (settings.showItemList && settings.showCalculation && settings.showActions) {
            return (
                <div className={className}>
                    <div className="space-y-6">
                        <MultiCategoryCart />
                        <DocumentGeneratorSimple />
                    </div>
                </div>
            );
        }

        // Иначе используем упрощенную версию
        return <SimplifiedCartBlock settings={settings} className={className} />;
}

// Компонент карточки товара в корзине
interface CartItemCardProps {
  item: CartItem;
  settings: any;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  isLoading: boolean;
}

// Упрощенная версия блока корзины
function SimplifiedCartBlock({ settings, className = "" }: CartBlockProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const cartService = CartService.getInstance();

  useEffect(() => {
    const unsubscribe = cartService.subscribe((updatedCart) => {
      setCart(updatedCart);
    });

    const currentCart = cartService.getCart();
    setCart(currentCart);

    return unsubscribe;
  }, [cartService]);

  if (!cart) {
    return (
      <div className={`p-4 border-2 border-dashed border-gray-300 rounded-lg ${className}`}>
        <div className="text-center text-gray-500">
          <ShoppingCart className="h-12 w-12 mx-auto mb-2" />
          <p>Загрузка корзины...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <ShoppingCart className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">
            Корзина ({cart.items.length})
          </h3>
        </div>

        {cart.items.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p>Корзина пуста</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.items.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{item.productName}</span>
                <span className="font-medium">{item.total.toLocaleString('ru-RU')} ₽</span>
              </div>
            ))}
            {cart.items.length > 3 && (
              <div className="text-xs text-gray-500 text-center">
                и еще {cart.items.length - 3} товаров
              </div>
            )}
          </div>
        )}

        {settings.showCalculation && cart.total > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between font-semibold">
              <span>Итого:</span>
              <span className="text-blue-600">
                {cart.total.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CartItemCard({ item, settings, onUpdateQuantity, onRemove, isLoading }: CartItemCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h5 className="font-medium text-gray-900 truncate">
            {item.productName}
          </h5>
          <p className="text-sm text-gray-500">
            {item.productSku} • {item.categoryName}
          </p>
        </div>
        {settings.allowItemRemoval && (
          <button
            onClick={() => onRemove(item.id)}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Options */}
      {item.options.length > 0 && (
        <div className="space-y-1">
          {item.options.map((option) => (
            <div key={option.id} className="text-xs text-gray-600">
              <span className="font-medium">{option.name}:</span> {String(option.value)}
              {option.price > 0 && (
                <span className="ml-1 text-green-600">
                  +{option.price.toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modifications */}
      {item.modifications.length > 0 && (
        <div className="space-y-1">
          {item.modifications.map((modification) => (
            <div key={modification.id} className="text-xs text-gray-600">
              <span className="font-medium">{modification.name}:</span> {String(modification.value)}
              {(modification.priceMultiplier !== 1 || modification.priceAdd > 0) && (
                <span className="ml-1 text-orange-600">
                  {modification.priceMultiplier !== 1 && `×${modification.priceMultiplier}`}
                  {modification.priceAdd > 0 && `+${modification.priceAdd.toLocaleString('ru-RU')} ₽`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Quantity and Price */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {settings.allowQuantityChange ? (
            <>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                disabled={isLoading}
              >
                <Minus className="h-4 w-4 text-gray-500" />
              </button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4 text-gray-500" />
              </button>
            </>
          ) : (
            <span className="text-sm text-gray-600">Количество: {item.quantity}</span>
          )}
        </div>
        
        <div className="text-right">
          <div className="font-semibold text-gray-900">
            {item.total.toLocaleString('ru-RU')} ₽
          </div>
          {item.quantity > 1 && (
            <div className="text-xs text-gray-500">
              {item.basePrice.toLocaleString('ru-RU')} ₽ за шт.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
