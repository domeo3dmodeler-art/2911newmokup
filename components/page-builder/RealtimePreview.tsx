'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button } from '../ui';
import { PageBlock, CategoryConfig } from './PageBuilder';

interface RealtimePreviewProps {
  blocks: PageBlock[];
  categories: CategoryConfig[];
  onClose: () => void;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  categoryType: 'main' | 'additional';
  pricingRule: 'separate' | 'included' | 'formula';
  formula?: string;
}

const RealtimePreview: React.FC<RealtimePreviewProps> = ({
  blocks,
  categories,
  onClose
}) => {
  const [selectedProducts, setSelectedProducts] = useState<{[key: string]: any}>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // Моковые данные товаров
  const mockProducts = {
    doors: [
      { id: 'door1', name: 'Дверь межкомнатная "Классика"', price: 15000, category: 'doors' },
      { id: 'door2', name: 'Дверь межкомнатная "Современная"', price: 18000, category: 'doors' },
      { id: 'door3', name: 'Дверь межкомнатная "Минимализм"', price: 12000, category: 'doors' },
    ],
    handles: [
      { id: 'handle1', name: 'Ручка "Элегант"', price: 2500, category: 'handles' },
      { id: 'handle2', name: 'Ручка "Модерн"', price: 3200, category: 'handles' },
      { id: 'handle3', name: 'Ручка "Классик"', price: 1800, category: 'handles' },
    ],
    hardware: [
      { id: 'hw1', name: 'Комплект фурнитуры "Премиум"', price: 4500, category: 'hardware' },
      { id: 'hw2', name: 'Комплект фурнитуры "Стандарт"', price: 2800, category: 'hardware' },
    ]
  };

  // Расчет общей цены
  useEffect(() => {
    let total = 0;
    
    cart.forEach(item => {
      switch (item.pricingRule) {
        case 'separate':
          total += item.price * item.quantity;
          break;
        case 'included':
          // Уже включено в основную цену
          break;
        case 'formula':
          if (item.formula) {
            // Простая формула: base_price * 0.1 (10%)
            const mainProduct = cart.find(cartItem => cartItem.categoryType === 'main');
            if (mainProduct) {
              const multiplier = parseFloat(item.formula.replace('base_price * ', '')) || 0;
              total += mainProduct.price * multiplier * item.quantity;
            }
          }
          break;
      }
    });

    setTotalPrice(total);
  }, [cart]);

  const addToCart = (product: any, categoryConfig: CategoryConfig) => {
    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      categoryType: categoryConfig.type,
      pricingRule: categoryConfig.pricingRule,
      formula: categoryConfig.pricingFormula,
    };

    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, cartItem];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev => prev.map(item =>
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const renderBlock = (block: PageBlock) => {
    switch (block.type) {
      case 'category-selector':
        const mainCategory = categories.find(cat => cat.type === 'main');
        return (
          <Card key={block.id} variant="base" className="p-4">
            <h3 className="text-lg font-semibold mb-3">{block.title}</h3>
            {mainCategory && (
              <div className="space-y-2">
                <h4 className="font-medium">{mainCategory.name}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {mockProducts.doors.map(product => (
                    <div key={product.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">{product.price.toLocaleString()} ₽</div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addToCart(product, mainCategory)}
                      >
                        Выбрать
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );

      case 'additional-category':
        const additionalCategories = categories.filter(cat => cat.type === 'additional');
        return (
          <Card key={block.id} variant="base" className="p-4">
            <h3 className="text-lg font-semibold mb-3">{block.title}</h3>
            {additionalCategories.map(category => (
              <div key={category.id} className="mb-4">
                <h4 className="font-medium mb-2">{category.name}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {(category.name.includes('Ручка') ? mockProducts.handles : mockProducts.hardware).map(product => (
                    <div key={product.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">{product.price.toLocaleString()} ₽</div>
                        <div className="text-xs text-blue-600">
                          {category.pricingRule === 'included' && 'Включено в стоимость'}
                          {category.pricingRule === 'separate' && 'Отдельная позиция'}
                          {category.pricingRule === 'formula' && `Формула: ${category.pricingFormula}`}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => addToCart(product, category)}
                      >
                        Добавить
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Card>
        );

      case 'price-calculator':
        return (
          <Card key={block.id} variant="base" className="p-4">
            <h3 className="text-lg font-semibold mb-3">{block.title}</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {totalPrice.toLocaleString()} ₽
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Итоговая стоимость
              </div>
            </div>
          </Card>
        );

      case 'cart':
        return (
          <Card key={block.id} variant="base" className="p-4">
            <h3 className="text-lg font-semibold mb-3">{block.title}</h3>
            {cart.length === 0 ? (
              <p className="text-gray-500">Корзина пуста</p>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-2 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-600">
                        {item.price.toLocaleString()} ₽ × {item.quantity}
                      </div>
                      <div className="text-xs text-blue-600">
                        {item.pricingRule === 'included' && 'Включено в стоимость'}
                        {item.pricingRule === 'separate' && 'Отдельная позиция'}
                        {item.pricingRule === 'formula' && `Формула: ${item.formula}`}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                        className="w-16 px-2 py-1 text-sm border rounded"
                      />
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-2 mt-4">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Итого:</span>
                    <span className="text-lg">{totalPrice.toLocaleString()} ₽</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        );

      case 'text-block':
        return (
          <Card key={block.id} variant="base" className="p-4">
            <div className="prose max-w-none">
              <p>{block.config.text || 'Текстовый блок'}</p>
            </div>
          </Card>
        );

      default:
        return (
          <Card key={block.id} variant="base" className="p-4">
            <p>Блок: {block.type}</p>
          </Card>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Заголовок */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Предпросмотр конфигуратора</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Контент */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Левая колонка - блоки */}
            <div className="space-y-4">
              {blocks.map(block => renderBlock(block))}
            </div>

            {/* Правая колонка - информация */}
            <div className="space-y-4">
              <Card variant="base" className="p-4">
                <h3 className="font-semibold mb-3">Информация о конфигураторе</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Блоков:</strong> {blocks.length}</div>
                  <div><strong>Категорий:</strong> {categories.length}</div>
                  <div><strong>Основных категорий:</strong> {categories.filter(c => c.type === 'main').length}</div>
                  <div><strong>Дополнительных категорий:</strong> {categories.filter(c => c.type === 'additional').length}</div>
                </div>
              </Card>

              <Card variant="base" className="p-4">
                <h3 className="font-semibold mb-3">Статистика корзины</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Позиций в корзине:</strong> {cart.length}</div>
                  <div><strong>Общая стоимость:</strong> {totalPrice.toLocaleString()} ₽</div>
                  <div><strong>Основных товаров:</strong> {cart.filter(c => c.categoryType === 'main').length}</div>
                  <div><strong>Дополнительных товаров:</strong> {cart.filter(c => c.categoryType === 'additional').length}</div>
                </div>
              </Card>

              <Card variant="base" className="p-4">
                <h3 className="font-semibold mb-3">Действия</h3>
                <div className="space-y-2">
                  <Button className="w-full" variant="primary">
                    Создать коммерческое предложение
                  </Button>
                  <Button className="w-full" variant="secondary">
                    Экспортировать в Excel
                  </Button>
                  <Button className="w-full" variant="outline">
                    Отправить на почту
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealtimePreview;

