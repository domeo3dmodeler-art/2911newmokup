import { useState, useEffect, useCallback } from 'react';
import { CartService } from '../lib/cart/cart-service';
import { Cart, CartItem, CartEvent, CartEventType } from '../lib/cart/types';

export interface UseCartResult {
  cart: Cart | null;
  isLoading: boolean;
  error: Error | null;
  
  // Основные операции
  addItem: (item: Omit<CartItem, 'id' | 'subtotal' | 'discount' | 'tax' | 'total' | 'addedAt' | 'updatedAt'>) => Promise<CartItem>;
  updateItem: (itemId: string, updates: Partial<CartItem>) => Promise<CartItem>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<CartItem>;
  clearCart: () => Promise<void>;
  
  // Дополнительные операции
  addOption: (itemId: string, option: any) => Promise<CartItem>;
  addModification: (itemId: string, modification: any) => Promise<CartItem>;
  applyDiscount: (type: 'percentage' | 'fixed', value: number) => Promise<void>;
  recalculateItemPrice: (itemId: string) => Promise<void>;
  
  // Утилиты
  getItemCount: () => number;
  getTotalValue: () => number;
  getCategoryCount: () => number;
  getItemsByCategory: (categoryId: string) => CartItem[];
  validateCart: () => any;
}

export const useCart = (): UseCartResult => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cartService = CartService.getInstance();

  useEffect(() => {
    // Подписываемся на изменения корзины
    const unsubscribe = cartService.subscribe((updatedCart) => {
      setCart(updatedCart);
    });

    // Подписываемся на события корзины
    const unsubscribeEvents = cartService.subscribeToEvents((event: CartEvent) => {
      console.log('Cart event:', event);
    });

    // Загружаем текущее состояние корзины
    const currentCart = cartService.getCart();
    setCart(currentCart);

    return () => {
      unsubscribe();
      unsubscribeEvents();
    };
  }, []);

  const addItem = useCallback(async (item: Omit<CartItem, 'id' | 'subtotal' | 'discount' | 'tax' | 'total' | 'addedAt' | 'updatedAt'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = cartService.addItem(item);
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (itemId: string, updates: Partial<CartItem>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = cartService.updateItem(itemId, updates);
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      cartService.removeItem(itemId);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = cartService.updateQuantity(itemId, quantity);
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      cartService.clearCart();
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addOption = useCallback(async (itemId: string, option: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = cartService.addOption(itemId, option);
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addModification = useCallback(async (itemId: string, modification: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = cartService.addModification(itemId, modification);
      return result;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const applyDiscount = useCallback(async (type: 'percentage' | 'fixed', value: number) => {
    setIsLoading(true);
    setError(null);
    try {
      cartService.applyDiscount(type, value);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const recalculateItemPrice = useCallback(async (itemId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await cartService.recalculateItemPrice(itemId);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getItemCount = useCallback(() => {
    return cart?.items.length || 0;
  }, [cart]);

  const getTotalValue = useCallback(() => {
    return cart?.total || 0;
  }, [cart]);

  const getCategoryCount = useCallback(() => {
    if (!cart) return 0;
    const categories = new Set(cart.items.map(item => item.categoryId));
    return categories.size;
  }, [cart]);

  const getItemsByCategory = useCallback((categoryId: string) => {
    if (!cart) return [];
    return cart.items.filter(item => item.categoryId === categoryId);
  }, [cart]);

  const validateCart = useCallback(() => {
    return cartService.validateCart();
  }, []);

  return {
    cart,
    isLoading,
    error,
    addItem,
    updateItem,
    removeItem,
    updateQuantity,
    clearCart,
    addOption,
    addModification,
    applyDiscount,
    recalculateItemPrice,
    getItemCount,
    getTotalValue,
    getCategoryCount,
    getItemsByCategory,
    validateCart
  };
};