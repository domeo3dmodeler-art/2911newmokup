import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, X, Plus, Minus, Trash2, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui';
import { CartService } from '../../lib/cart/cart-service';
import { Cart, CartItem, CartCalculation } from '../../lib/cart/types';
import { clientLogger } from '@/lib/logging/client-logger';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateQuote?: () => void;
  onGenerateInvoice?: () => void;
  onGenerateOrder?: () => void;
}

export default function CartSidebar({
  isOpen,
  onClose,
  onGenerateQuote,
  onGenerateInvoice,
  onGenerateOrder
}: CartSidebarProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [calculation, setCalculation] = useState<CartCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const cartService = React.useMemo(() => CartService.getInstance(), []);

  useEffect(() => {
    // Подписываемся на изменения корзины
    const unsubscribe = cartService.subscribe((updatedCart) => {
      setCart(updatedCart);
      setCalculation(cartService.getCalculation());
    });

    // Загружаем текущее состояние корзины
    const currentCart = cartService.getCart();
    setCart(currentCart);
    setCalculation(cartService.getCalculation());

    return unsubscribe;
  }, [cartService]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    setIsLoading(true);
    try {
      if (newQuantity <= 0) {
        cartService.removeItem(itemId);
      } else {
        cartService.updateQuantity(itemId, newQuantity);
      }
    } catch (error) {
      clientLogger.error('Error updating quantity:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setIsLoading(true);
    try {
      cartService.removeItem(itemId);
    } catch (error) {
      clientLogger.error('Error removing item:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Вы уверены, что хотите очистить корзину?')) {
      setIsLoading(true);
      try {
        cartService.clearCart();
      } catch (error) {
        clientLogger.error('Error clearing cart:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!cart) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Корзина ({cart.items.length})
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {cart.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Корзина пуста
                </h3>
                <p className="text-gray-500 mb-6">
                  Добавьте товары из каталога, чтобы начать формирование заказа
                </p>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Продолжить покупки
                </Button>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {cart.items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.items.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-4">
              {/* Calculation Summary */}
              {calculation && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Товары:</span>
                    <span className="font-medium">
                      {calculation.cart.subtotal.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  
                  {calculation.cart.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Скидка:</span>
                      <span>-{calculation.cart.discount.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  )}
                  
                  {calculation.cart.delivery > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Доставка:</span>
                      <span>{calculation.cart.delivery.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  )}
                  
                  {calculation.cart.installation > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Установка:</span>
                      <span>{calculation.cart.installation.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  )}
                  
                  {calculation.cart.tax > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">НДС ({cart.taxRate}%):</span>
                      <span>{calculation.cart.tax.toLocaleString('ru-RU')} ₽</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Итого:</span>
                      <span className="text-blue-600">
                        {calculation.cart.total.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  onClick={onGenerateQuote}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Создать КП
                </Button>
                
                <Button
                  onClick={onGenerateInvoice}
                  variant="outline"
                  className="w-full border-green-600 text-green-600 hover:bg-green-50"
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Создать счет
                </Button>
                
                <Button
                  onClick={onGenerateOrder}
                  variant="outline"
                  className="w-full border-orange-600 text-orange-600 hover:bg-orange-50"
                  disabled={isLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Заказ поставщику
                </Button>
                
                <Button
                  onClick={handleClearCart}
                  variant="outline"
                  className="w-full border-red-600 text-red-600 hover:bg-red-50"
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Очистить корзину
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Компонент карточки товара в корзине
interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  isLoading: boolean;
}

function CartItemCard({ item, onUpdateQuantity, onRemove, isLoading }: CartItemCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">
            {item.productName}
          </h4>
          <p className="text-sm text-gray-500">
            {item.productSku} • {item.categoryName}
          </p>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4 text-gray-400" />
        </button>
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



