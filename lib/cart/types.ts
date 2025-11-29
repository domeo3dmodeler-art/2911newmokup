// lib/cart/types.ts
// Типы для системы корзины калькулятора

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  categoryId: string;
  categoryName: string;
  
  // Основные характеристики
  quantity: number;
  basePrice: number;
  
  // Дополнительные опции и модификации
  options: CartItemOption[];
  modifications: CartItemModification[];
  
  // Расчеты
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  
  // Метаданные
  notes?: string;
  specifications?: Record<string, any>;
  images?: string[];
  
  // Временные метки
  addedAt: Date;
  updatedAt: Date;
}

export interface CartItemOption {
  id: string;
  name: string;
  type: 'select' | 'checkbox' | 'number' | 'text';
  value: any;
  price: number;
  required: boolean;
}

export interface CartItemModification {
  id: string;
  name: string;
  type: 'size' | 'color' | 'material' | 'finish' | 'custom';
  value: any;
  priceMultiplier: number; // Коэффициент изменения цены (1.0 = без изменений)
  priceAdd: number; // Дополнительная стоимость
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  
  // Основные данные
  items: CartItem[];
  
  // Расчеты корзины
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  deliveryCost: number;
  installationCost: number;
  tax: number;
  taxRate: number;
  total: number;
  
  // Информация о клиенте
  clientInfo?: ClientInfo;
  
  // Статус и метаданные
  status: CartStatus;
  notes?: string;
  
  // Временные метки
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface ClientInfo {
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  inn?: string;
  contactPerson?: string;
}

export enum CartStatus {
  DRAFT = 'draft',           // Черновик
  ACTIVE = 'active',         // Активная корзина
  QUOTE = 'quote',           // Преобразована в КП
  INVOICE = 'invoice',       // Преобразована в счет
  ORDER = 'order',           // Преобразована в заказ
  COMPLETED = 'completed',   // Завершена
  ABANDONED = 'abandoned'    // Брошена
}

export interface CartCalculation {
  items: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
  cart: {
    subtotal: number;
    discount: number;
    delivery: number;
    installation: number;
    tax: number;
    total: number;
  };
  breakdown: {
    baseItems: number;
    options: number;
    modifications: number;
    discounts: number;
    delivery: number;
    installation: number;
    tax: number;
  };
}

export interface CartValidationResult {
  isValid: boolean;
  errors: CartValidationError[];
  warnings: CartValidationWarning[];
}

export interface CartValidationError {
  itemId?: string;
  field: string;
  message: string;
  type: 'required' | 'invalid' | 'unavailable' | 'limit';
}

export interface CartValidationWarning {
  itemId?: string;
  field: string;
  message: string;
  type: 'price' | 'availability' | 'recommendation';
}

export interface CartExportOptions {
  format: 'quote' | 'invoice' | 'order' | 'excel' | 'pdf';
  includeImages: boolean;
  includeSpecifications: boolean;
  includeOptions: boolean;
  includeModifications: boolean;
  template?: string;
}

export interface CartSaveOptions {
  saveAs: 'draft' | 'quote' | 'order';
  clientInfo?: ClientInfo;
  notes?: string;
  expiresAt?: Date;
}

// События корзины
export interface CartEvent {
  type: CartEventType;
  cartId: string;
  itemId?: string;
  data: any;
  timestamp: Date;
  userId?: string;
}

export enum CartEventType {
  ITEM_ADDED = 'item_added',
  ITEM_UPDATED = 'item_updated',
  ITEM_REMOVED = 'item_removed',
  QUANTITY_CHANGED = 'quantity_changed',
  OPTION_CHANGED = 'option_changed',
  MODIFICATION_CHANGED = 'modification_changed',
  DISCOUNT_APPLIED = 'discount_applied',
  CLIENT_INFO_UPDATED = 'client_info_updated',
  CART_CLEARED = 'cart_cleared',
  CART_SAVED = 'cart_saved',
  CART_EXPORTED = 'cart_exported'
}

// Настройки корзины
export interface CartSettings {
  autoSave: boolean;
  autoSaveInterval: number; // в секундах
  maxItems: number;
  maxQuantity: number;
  allowNegativeQuantities: boolean;
  defaultTaxRate: number;
  currency: string;
  locale: string;
}

// Статистика корзины
export interface CartStats {
  totalItems: number;
  totalValue: number;
  averageItemPrice: number;
  mostPopularCategory: string;
  conversionRate: number;
  abandonmentRate: number;
  averageCartValue: number;
  averageItemsPerCart: number;
}



