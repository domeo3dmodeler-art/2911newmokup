'use client';

import React from 'react';
import { Button } from '../ui';
import { Minus, Plus, Trash2, Package, ShoppingCart } from 'lucide-react';
import { CartDisplaySettings } from './advancedTypes';

interface CartItem {
  id: string;
  productId: string;
  categoryId: string;
  categoryName: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  properties?: Record<string, any>;
}

interface CartDisplayComponentProps {
  items: CartItem[];
  settings: CartDisplaySettings;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
}

export default function CartDisplayComponent({
  items,
  settings,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}: CartDisplayComponentProps) {
  
  // Группируем товары по категориям
  const groupedItems = settings.groupByCategory 
    ? items.reduce((acc, item) => {
        if (!acc[item.categoryId]) {
          acc[item.categoryId] = [];
        }
        acc[item.categoryId].push(item);
        return acc;
      }, {} as Record<string, CartItem[]>)
    : { 'all': items };

  // Упрощенное вычисление цен без связей между категориями
  const calculatePricing = () => {
    const pricing: Array<{
      type: 'separate';
      items: CartItem[];
      subtotal: number;
      label: string;
    }> = [];

    // Все товары отображаются отдельно
    items.forEach(item => {
      const subtotal = item.price * item.quantity;
      pricing.push({
        type: 'separate',
        items: [item],
        subtotal,
        label: item.name
      });
    });

    return pricing;
  };

  const pricing = calculatePricing();
  const total = pricing.reduce((sum, p) => sum + p.subtotal, 0);

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="text-center py-8">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Корзина пуста</h3>
          <p className="text-gray-500">Добавьте товары из каталога</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Корзина покупок
        </h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onClearCart}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Очистить
        </Button>
      </div>

      {/* Список товаров */}
      <div className="space-y-4">
        {settings.groupByCategory ? (
          // Группировка по категориям
          Object.entries(groupedItems).map(([categoryId, categoryItems]) => (
            <div key={categoryId} className="border border-gray-100 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-3">
                {categoryItems[0].categoryName}
              </h4>
              <div className="space-y-2">
                {categoryItems.map(item => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    settings={settings}
                    onUpdateQuantity={onUpdateQuantity}
                    onRemoveItem={onRemoveItem}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Обычный список
          pricing.map((priceGroup, index) => (
            <div key={index} className="border border-gray-100 rounded-lg p-4">
              {priceGroup.type === 'main' && priceGroup.categoryLink ? (
                // Комбинированная цена
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800">{priceGroup.label}</h4>
                      {settings.showPricingBreakdown && (
                        <div className="text-sm text-gray-600">
                          {priceGroup.items.map((item, i) => (
                            <span key={item.id}>
                              {item.name}: {item.price}₽ × {item.quantity}
                              {i < priceGroup.items.length - 1 && ' + '}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">{priceGroup.subtotal}₽</div>
                      {priceGroup.categoryLink && (
                        <div className="text-xs text-gray-500">
                          {priceGroup.categoryLink.label || 'Комплект'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Отдельная строка
                <CartItemRow
                  item={priceGroup.items[0]}
                  settings={settings}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemoveItem={onRemoveItem}
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* Итоги */}
      {settings.showSubtotals && pricing.length > 1 && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="space-y-2">
            {pricing.map((priceGroup, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{priceGroup.label}</span>
                <span>{priceGroup.subtotal}₽</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {settings.showTotal && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Итого:</span>
            <span className="text-xl font-bold text-green-600">{total}₽</span>
          </div>
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex space-x-2 mt-6">
        <Button className="flex-1">
          Оформить заказ
        </Button>
        <Button variant="outline" className="flex-1">
          Сохранить в заказчика
        </Button>
      </div>
    </div>
  );
}

// Компонент строки товара
function CartItemRow({ 
  item, 
  settings, 
  onUpdateQuantity, 
  onRemoveItem 
}: {
  item: CartItem;
  settings: CartDisplaySettings;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}) {
  return (
    <div className="flex items-center space-x-3">
      {settings.showItemDetails && (
        <div className="flex-shrink-0">
          {item.image ? (
            <img 
              src={item.image} 
              alt={item.name}
              className="w-12 h-12 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-800 truncate">{item.name}</h4>
        {settings.showItemDetails && (
          <div className="text-sm text-gray-600">
            {item.categoryName} • {item.price}₽ за шт.
          </div>
        )}
      </div>

      {settings.showQuantityControls && (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center">{item.quantity}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="text-right">
        <div className="font-semibold">{(item.price * item.quantity).toLocaleString()}₽</div>
      </div>

      {settings.allowItemRemoval && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onRemoveItem(item.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
