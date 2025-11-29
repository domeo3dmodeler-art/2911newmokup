import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui';
import { CartService } from '../../lib/cart/cart-service';
import { Cart } from '../../lib/cart/types';

interface CartButtonProps {
  onOpenCart: () => void;
  className?: string;
}

export default function CartButton({ onOpenCart, className = "" }: CartButtonProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [itemCount, setItemCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const cartService = CartService.getInstance();

  useEffect(() => {
    // Подписываемся на изменения корзины
    const unsubscribe = cartService.subscribe((updatedCart) => {
      setCart(updatedCart);
      setItemCount(updatedCart.items.length);
      setTotalAmount(updatedCart.total);
    });

    // Загружаем текущее состояние корзины
    const currentCart = cartService.getCart();
    setCart(currentCart);
    setItemCount(currentCart.items.length);
    setTotalAmount(currentCart.total);

    return unsubscribe;
  }, [cartService]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onOpenCart}
      className={`relative p-2 ${className}`}
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <>
          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
          {totalAmount > 0 && (
            <span className="hidden sm:inline-block ml-2 text-sm font-medium">
              {totalAmount.toLocaleString('ru-RU')} ₽
            </span>
          )}
        </>
      )}
    </Button>
  );
}



