'use client';

import React, { useState } from 'react';
import { Button, Card, Input, Select } from '@/components/ui';
import { Percent, Minus, Plus, Calculator } from 'lucide-react';

interface DiscountRule {
  id: string;
  type: 'percentage' | 'fixed' | 'bulk';
  name: string;
  value: number;
  minQuantity?: number;
  minAmount?: number;
  maxDiscount?: number;
  description: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface DiscountManagerProps {
  cartItems: CartItem[];
  onApplyDiscount: (itemId: string, discount: number, discountType: 'percentage' | 'fixed') => void;
  onRemoveDiscount: (itemId: string) => void;
}

const DISCOUNT_RULES: DiscountRule[] = [
  {
    id: 'bulk_5',
    type: 'percentage',
    name: 'Оптовая скидка 5%',
    value: 5,
    minQuantity: 10,
    description: 'Скидка 5% при заказе от 10 штук'
  },
  {
    id: 'bulk_10',
    type: 'percentage',
    name: 'Оптовая скидка 10%',
    value: 10,
    minQuantity: 20,
    description: 'Скидка 10% при заказе от 20 штук'
  },
  {
    id: 'bulk_15',
    type: 'percentage',
    name: 'Оптовая скидка 15%',
    value: 15,
    minQuantity: 50,
    description: 'Скидка 15% при заказе от 50 штук'
  },
  {
    id: 'amount_5000',
    type: 'percentage',
    name: 'Скидка по сумме 5%',
    value: 5,
    minAmount: 50000,
    description: 'Скидка 5% при заказе от 50,000 ₽'
  },
  {
    id: 'amount_10',
    type: 'percentage',
    name: 'Скидка по сумме 10%',
    value: 10,
    minAmount: 100000,
    description: 'Скидка 10% при заказе от 100,000 ₽'
  },
  {
    id: 'fixed_1000',
    type: 'fixed',
    name: 'Фиксированная скидка',
    value: 1000,
    minAmount: 10000,
    description: 'Скидка 1,000 ₽ при заказе от 10,000 ₽'
  }
];

export default function DiscountManager({ cartItems, onApplyDiscount, onRemoveDiscount }: DiscountManagerProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [customDiscount, setCustomDiscount] = useState<string>('');
  const [customDiscountType, setCustomDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [appliedDiscounts, setAppliedDiscounts] = useState<Record<string, { value: number; type: 'percentage' | 'fixed'; ruleName?: string }>>({});

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const getTotalQuantity = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getItemTotal = (item: CartItem) => {
    const discount = appliedDiscounts[item.id];
    if (!discount) return item.subtotal;
    
    if (discount.type === 'percentage') {
      return item.subtotal * (1 - discount.value / 100);
    } else {
      return Math.max(0, item.subtotal - discount.value);
    }
  };

  const getTotalWithDiscounts = () => {
    return cartItems.reduce((sum, item) => sum + getItemTotal(item), 0);
  };

  const getTotalSavings = () => {
    return getCartTotal() - getTotalWithDiscounts();
  };

  const getAvailableRules = () => {
    const totalAmount = getCartTotal();
    const totalQuantity = getTotalQuantity();
    
    return DISCOUNT_RULES.filter(rule => {
      if (rule.minAmount && totalAmount < rule.minAmount) return false;
      if (rule.minQuantity && totalQuantity < rule.minQuantity) return false;
      return true;
    });
  };

  const applyRuleDiscount = () => {
    if (!selectedItemId || !selectedRuleId) return;
    
    const rule = DISCOUNT_RULES.find(r => r.id === selectedRuleId);
    if (!rule) return;
    
    const item = cartItems.find(i => i.id === selectedItemId);
    if (!item) return;
    
    setAppliedDiscounts(prev => ({
      ...prev,
      [selectedItemId]: {
        value: rule.value,
        type: rule.type,
        ruleName: rule.name
      }
    }));
    
    onApplyDiscount(selectedItemId, rule.value, rule.type);
  };

  const applyCustomDiscount = () => {
    if (!selectedItemId || !customDiscount) return;
    
    const value = parseFloat(customDiscount);
    if (isNaN(value) || value <= 0) return;
    
    setAppliedDiscounts(prev => ({
      ...prev,
      [selectedItemId]: {
        value,
        type: customDiscountType
      }
    }));
    
    onApplyDiscount(selectedItemId, value, customDiscountType);
  };

  const removeDiscount = (itemId: string) => {
    setAppliedDiscounts(prev => {
      const newDiscounts = { ...prev };
      delete newDiscounts[itemId];
      return newDiscounts;
    });
    
    onRemoveDiscount(itemId);
  };

  const selectedItem = cartItems.find(item => item.id === selectedItemId);

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Calculator className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Управление скидками</h3>
      </div>

      {/* Статистика корзины */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{getCartTotal().toLocaleString()} ₽</div>
          <div className="text-sm text-gray-600">Сумма без скидок</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{getTotalSavings().toLocaleString()} ₽</div>
          <div className="text-sm text-gray-600">Экономия</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{getTotalWithDiscounts().toLocaleString()} ₽</div>
          <div className="text-sm text-gray-600">Итого к оплате</div>
        </div>
      </div>

      {/* Выбор товара */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Выберите товар для скидки</label>
        <Select
          value={selectedItemId}
          onValueChange={setSelectedItemId}
          placeholder="Выберите товар"
        >
          {cartItems.map(item => (
            <option key={item.id} value={item.id}>
              {item.name} (×{item.quantity}) - {item.subtotal.toLocaleString()} ₽
            </option>
          ))}
        </Select>
      </div>

      {selectedItem && (
        <div className="space-y-6">
          {/* Информация о товаре */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">{selectedItem.name}</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Количество:</span>
                <span className="ml-2 font-medium">{selectedItem.quantity} шт.</span>
              </div>
              <div>
                <span className="text-blue-700">Цена за шт:</span>
                <span className="ml-2 font-medium">{item.price.toLocaleString()} ₽</span>
              </div>
              <div>
                <span className="text-blue-700">Сумма:</span>
                <span className="ml-2 font-medium">{selectedItem.subtotal.toLocaleString()} ₽</span>
              </div>
              <div>
                <span className="text-blue-700">Итого со скидкой:</span>
                <span className="ml-2 font-medium text-green-600">{getItemTotal(selectedItem).toLocaleString()} ₽</span>
              </div>
            </div>
            
            {appliedDiscounts[selectedItem.id] && (
              <div className="mt-3 p-2 bg-green-100 rounded">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-green-800">
                    <strong>Применена скидка:</strong> {appliedDiscounts[selectedItem.id].ruleName || 'Пользовательская'}
                    {' '}({appliedDiscounts[selectedItem.id].type === 'percentage' ? `${appliedDiscounts[selectedItem.id].value}%` : `${appliedDiscounts[selectedItem.id].value} ₽`})
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDiscount(selectedItem.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Автоматические скидки */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Автоматические скидки</h4>
            <div className="space-y-2">
              {getAvailableRules().length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  Нет доступных автоматических скидок для текущего заказа
                </p>
              ) : (
                getAvailableRules().map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{rule.name}</div>
                      <div className="text-xs text-gray-600">{rule.description}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedRuleId(rule.id);
                        applyRuleDiscount();
                      }}
                      disabled={!!appliedDiscounts[selectedItem.id]}
                    >
                      Применить
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Пользовательская скидка */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Пользовательская скидка</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Тип скидки</label>
                <Select
                  value={customDiscountType}
                  onValueChange={(value: 'percentage' | 'fixed') => setCustomDiscountType(value)}
                >
                  <option value="percentage">Процент</option>
                  <option value="fixed">Фиксированная сумма</option>
                </Select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  {customDiscountType === 'percentage' ? 'Процент (%)' : 'Сумма (₽)'}
                </label>
                <Input
                  type="number"
                  value={customDiscount}
                  onChange={(e) => setCustomDiscount(e.target.value)}
                  placeholder={customDiscountType === 'percentage' ? '10' : '1000'}
                  min="0"
                  max={customDiscountType === 'percentage' ? '100' : undefined}
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={applyCustomDiscount}
                  disabled={!customDiscount || !!appliedDiscounts[selectedItem.id]}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Применить
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Список примененных скидок */}
      {Object.keys(appliedDiscounts).length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">Примененные скидки</h4>
          <div className="space-y-2">
            {Object.entries(appliedDiscounts).map(([itemId, discount]) => {
              const item = cartItems.find(i => i.id === itemId);
              if (!item) return null;
              
              return (
                <div key={itemId} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <div className="font-medium text-sm text-green-900">{item.name}</div>
                    <div className="text-xs text-green-700">
                      Скидка: {discount.type === 'percentage' ? `${discount.value}%` : `${discount.value} ₽`}
                      {discount.ruleName && ` (${discount.ruleName})`}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDiscount(itemId)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}

