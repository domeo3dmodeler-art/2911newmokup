'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Select, Input, Alert } from '@/components/ui';
import { ShoppingCart, Package, Settings, Calculator } from 'lucide-react';
import DiscountManager from '../cart/DiscountManager';
import { clientLogger } from '@/lib/logging/client-logger';

interface DoorProduct {
  id: string;
  model: string;
  modelPhoto?: string;
  style: string;
  finish: string;
  color: string;
  type: string;
  width: number;
  height: number;
  rrc_price: number;
  sku_1c: string;
  supplier: string;
  collection: string;
  supplier_item_name: string;
  supplier_color_finish: string;
  price_opt: number;
}

interface HardwareKit {
  id: string;
  name: string;
  group: number;
  price_rrc: number;
}

interface Handle {
  id: string;
  name: string;
  supplier_name: string;
  supplier_sku: string;
  price_opt: number;
  price_rrc: number;
  price_group_multiplier: number;
}

interface CartItem {
  id: string;
  product: DoorProduct;
  quantity: number;
  selectedKit?: HardwareKit;
  selectedHandle?: Handle;
  calculated_price: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
}

interface DoorsConfiguratorProps {
  categoryId?: string;
}

export default function DoorsConfigurator({ categoryId = 'doors' }: DoorsConfiguratorProps) {
  const [products, setProducts] = useState<DoorProduct[]>([]);
  const [hardwareKits, setHardwareKits] = useState<HardwareKit[]>([]);
  const [handles, setHandles] = useState<Handle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние конфигуратора
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedFinish, setSelectedFinish] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedWidth, setSelectedWidth] = useState<number>(800);
  const [selectedHeight, setSelectedHeight] = useState<number>(2000);
  const [selectedKit, setSelectedKit] = useState<string>('');
  const [selectedHandle, setSelectedHandle] = useState<string>('');
  
  // Корзина
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showDiscountManager, setShowDiscountManager] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, [categoryId]);

  // Обновляем цену при изменении параметров
  useEffect(() => {
    if (selectedProduct) {
      calculateTotalPrice().then(price => {
        setCurrentPrice(price);
      });
    } else {
      setCurrentPrice(0);
    }
  }, [selectedProduct, selectedKit, selectedHandle]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Загружаем опции дверей из API
      const optionsResponse = await fetch('/api/catalog/doors/options');
      const optionsData = await optionsResponse.json();
      
      if (optionsData.ok && optionsData.domain) {
        // Преобразуем данные в формат, ожидаемый компонентом
        const doorProducts: DoorProduct[] = [];
        
        // Создаем комбинации всех возможных параметров
        const { style, model, finish, color, type, width, height } = optionsData.domain;
        
        // Для демонстрации создаем несколько комбинаций
        if (style.length > 0 && model.length > 0 && finish.length > 0 && color.length > 0 && type.length > 0 && width.length > 0 && height.length > 0) {
          // Берем первые несколько комбинаций для демонстрации
          for (let i = 0; i < Math.min(10, style.length * model.length); i++) {
            const s = style[i % style.length];
            const m = model[i % model.length];
            const f = finish[i % finish.length];
            const c = color[i % color.length];
            const t = type[i % type.length];
            const w = width[i % width.length];
            const h = height[i % height.length];
            
            doorProducts.push({
              id: `${m}-${f}-${c}-${w}x${h}`,
              model: m,
              style: s,
              finish: f,
              color: c,
              type: t,
              width: w,
              height: h,
              rrc_price: 15000 + Math.random() * 10000, // Примерная цена
              sku_1c: `SKU-${m}-${w}x${h}-${c}`,
              supplier: "Supplier1",
              collection: "Collection A",
              supplier_item_name: m,
              supplier_color_finish: `${c}/${f}`,
              price_opt: 10000 + Math.random() * 5000,
            });
          }
        }
        
        setProducts(doorProducts);
        
        // Устанавливаем комплекты и ручки из API
        setHardwareKits(optionsData.domain.kits || []);
        setHandles(optionsData.domain.handles || []);
      } else {
        throw new Error('Ошибка загрузки опций дверей');
      }

    } catch (err) {
      clientLogger.error('Error loading data:', err);
      setError('Ошибка загрузки данных. Проверьте подключение к серверу.');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Получаем уникальные значения для фильтров
  const styles = [...new Set(products.map(p => p.style))].sort();
  const models = [...new Set(
    products
      .filter(p => !selectedStyle || p.style === selectedStyle)
      .map(p => p.model)
  )].sort();
  const finishes = [...new Set(
    products
      .filter(p => {
        if (selectedStyle && p.style !== selectedStyle) return false;
        if (selectedModel && p.model !== selectedModel) return false;
        return true;
      })
      .map(p => p.finish)
  )].sort();
  const colors = [...new Set(
    products
      .filter(p => {
        if (selectedStyle && p.style !== selectedStyle) return false;
        if (selectedModel && p.model !== selectedModel) return false;
        if (selectedFinish && p.finish !== selectedFinish) return false;
        return true;
      })
      .map(p => p.color)
  )].sort();
  const types = [...new Set(products.map(p => p.type))].sort();
  const widths = [...new Set(products.map(p => p.width))].sort();
  const heights = [...new Set(products.map(p => p.height))].sort();

  // Находим выбранный продукт
  const selectedProduct = products.find(p => 
    p.style === selectedStyle &&
    p.model === selectedModel &&
    p.finish === selectedFinish &&
    p.color === selectedColor &&
    p.type === selectedType &&
    p.width === selectedWidth &&
    p.height === selectedHeight
  );

  // Вычисляем итоговую цену
  const calculateTotalPrice = useCallback(async () => {
    if (!selectedProduct) return 0;
    
    try {
      const response = await fetch('/api/price/doors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selection: {
            model: selectedProduct.model,
            finish: selectedProduct.finish,
            color: selectedProduct.color,
            type: selectedProduct.type,
            width: selectedProduct.width,
            height: selectedProduct.height,
            hardware_kit: selectedKit ? { id: selectedKit } : undefined,
            handle: selectedHandle ? { id: selectedHandle } : undefined,
          }
        })
      });

      if (response.ok) {
        const priceData = await response.json();
        return priceData.total || 0;
      }
    } catch (error) {
      clientLogger.error('Error calculating price:', error);
    }
    
    // Fallback к локальному расчету
    let total = selectedProduct.rrc_price;
    
    if (selectedKit) {
      const kit = hardwareKits.find(k => k.id === selectedKit);
      if (kit) total += kit.price_rrc;
    }
    
    if (selectedHandle) {
      const handle = handles.find(h => h.id === selectedHandle);
      if (handle) total += handle.price_rrc;
    }
    
    return total;
  }, [selectedProduct, selectedKit, selectedHandle, hardwareKits, handles]);

  // Обновляем цену при изменении параметров
  useEffect(() => {
    if (selectedProduct) {
      calculateTotalPrice().then(price => {
        setCurrentPrice(price);
      });
    } else {
      setCurrentPrice(0);
    }
  }, [selectedProduct, selectedKit, selectedHandle, calculateTotalPrice]);

  const addToCart = () => {
    if (!selectedProduct) return;

    const cartItem: CartItem = {
      id: `${selectedProduct.id}-${Date.now()}`,
      product: selectedProduct,
      quantity: 1,
      selectedKit: selectedKit ? hardwareKits.find(k => k.id === selectedKit) : undefined,
      selectedHandle: selectedHandle ? handles.find(h => h.id === selectedHandle) : undefined,
      calculated_price: currentPrice
    };

    setCart(prev => [...prev, cartItem]);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => {
      let itemPrice = item.calculated_price;
      
      // Применяем скидку
      if (item.discount && item.discountType) {
        if (item.discountType === 'percentage') {
          itemPrice = itemPrice * (1 - item.discount / 100);
        } else {
          itemPrice = Math.max(0, itemPrice - item.discount);
        }
      }
      
      return sum + (itemPrice * item.quantity);
    }, 0);
  };

  const getCartTotalWithoutDiscounts = () => {
    return cart.reduce((sum, item) => sum + (item.calculated_price * item.quantity), 0);
  };

  const handleApplyDiscount = (itemId: string, discount: number, discountType: 'percentage' | 'fixed') => {
    setCart(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, discount, discountType }
        : item
    ));
  };

  const handleRemoveDiscount = (itemId: string) => {
    setCart(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, discount: undefined, discountType: undefined }
        : item
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка конфигуратора дверей...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Alert variant="error">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Конфигуратор дверей</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Создайте идеальную дверь для вашего интерьера. Выберите стиль, модель, материалы и размеры.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основная панель конфигуратора */}
          <div className="lg:col-span-2 space-y-6">
            {/* Прогресс-бар */}
            <Card className="p-6 bg-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Настройка параметров</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Шаг 1 из 3</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full w-1/3"></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Стиль */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Стиль двери</label>
                  <Select
                    value={selectedStyle}
                    onValueChange={setSelectedStyle}
                    placeholder="Выберите стиль"
                  >
                    {styles.map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </Select>
                </div>

                {/* Модель */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Модель</label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                    placeholder="Выберите модель"
                    disabled={!selectedStyle}
                  >
                    {models.map(model => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </Select>
                </div>

                {/* Отделка */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Отделка</label>
                  <Select
                    value={selectedFinish}
                    onValueChange={setSelectedFinish}
                    placeholder="Выберите отделку"
                    disabled={!selectedModel}
                  >
                    {finishes.map(finish => (
                      <option key={finish} value={finish}>{finish}</option>
                    ))}
                  </Select>
                </div>

                {/* Цвет */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Цвет</label>
                  <Select
                    value={selectedColor}
                    onValueChange={setSelectedColor}
                    placeholder="Выберите цвет"
                    disabled={!selectedFinish}
                  >
                    {colors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </Select>
                </div>

                {/* Тип */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Тип открывания</label>
                  <Select
                    value={selectedType}
                    onValueChange={setSelectedType}
                    placeholder="Выберите тип"
                  >
                    {types.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </div>

                {/* Размеры */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Размеры</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      value={selectedWidth.toString()}
                      onValueChange={(value) => setSelectedWidth(parseInt(value))}
                    >
                      {widths.map(width => (
                        <option key={width} value={width.toString()}>{width} мм</option>
                      ))}
                    </Select>
                    <Select
                      value={selectedHeight.toString()}
                      onValueChange={(value) => setSelectedHeight(parseInt(value))}
                    >
                      {heights.map(height => (
                        <option key={height} value={height.toString()}>{height} мм</option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Дополнительные опции */}
            <Card className="p-6 bg-white shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                Дополнительные опции
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Комплект фурнитуры */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Комплект фурнитуры</label>
                  <Select
                    value={selectedKit}
                    onValueChange={setSelectedKit}
                    placeholder="Выберите комплект"
                  >
                    {hardwareKits.map(kit => (
                      <option key={kit.id} value={kit.id}>
                        {kit.name} (+{kit.price_rrc.toLocaleString()} ₽)
                      </option>
                    ))}
                  </Select>
                </div>

                {/* Ручка */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Ручка</label>
                  <Select
                    value={selectedHandle}
                    onValueChange={setSelectedHandle}
                    placeholder="Выберите ручку"
                  >
                    {handles.map(handle => (
                      <option key={handle.id} value={handle.id}>
                        {handle.name} (+{handle.price_rrc.toLocaleString()} ₽)
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </Card>

            {/* Кнопка добавления в корзину */}
            {selectedProduct && (
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Итого: {currentPrice.toLocaleString()} ₽</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedProduct.model} • {selectedWidth}×{selectedHeight}мм • {selectedColor}
                    </p>
                    {selectedKit && (
                      <p className="text-xs text-gray-500 mt-1">
                        + {hardwareKits.find(k => k.id === selectedKit)?.name}
                      </p>
                    )}
                    {selectedHandle && (
                      <p className="text-xs text-gray-500 mt-1">
                        + {handles.find(h => h.id === selectedHandle)?.name}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={addToCart}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>Добавить в корзину</span>
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Панель корзины */}
          <div className="space-y-6">
            <Card className="p-6 bg-white shadow-lg sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Корзина</h2>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {cart.length}
                  </span>
                </div>
                {cart.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDiscountManager(!showDiscountManager)}
                    className="flex items-center space-x-1"
                  >
                    <Calculator className="h-4 w-4" />
                    <span>Скидки</span>
                  </Button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">Корзина пуста</p>
                  <p className="text-xs text-gray-400 mt-1">Выберите параметры двери и добавьте в корзину</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm text-gray-900">{item.product.model}</h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2">
                        {item.product.width}×{item.product.height}мм • {item.product.color}
                      </p>
                      
                      {item.selectedKit && (
                        <p className="text-xs text-gray-600 mb-1">+ {item.selectedKit.name}</p>
                      )}
                      
                      {item.selectedHandle && (
                        <p className="text-xs text-gray-600 mb-1">+ {item.selectedHandle.name}</p>
                      )}
                      
                      {item.discount && (
                        <div className="mb-2 p-2 bg-green-100 rounded text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-green-800">
                              Скидка: {item.discountType === 'percentage' ? `${item.discount}%` : `${item.discount} ₽`}
                            </span>
                            <span className="text-green-700 font-medium">
                              -{((item.calculated_price * item.quantity) - (getCartTotal() / cart.length)).toLocaleString()} ₽
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-xs hover:bg-gray-300 transition-colors"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-xs hover:bg-gray-300 transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          {item.discount && (
                            <div className="text-xs text-gray-500 line-through">
                              {(item.calculated_price * item.quantity).toLocaleString()} ₽
                            </div>
                          )}
                          <span className="font-medium text-sm">
                            {(getCartTotal() / cart.length).toLocaleString()} ₽
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t border-gray-200 pt-3">
                    {getCartTotalWithoutDiscounts() !== getCartTotal() && (
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>Сумма без скидок:</span>
                        <span>{getCartTotalWithoutDiscounts().toLocaleString()} ₽</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between font-semibold text-lg">
                      <span>Итого:</span>
                      <span className="text-blue-600">{getCartTotal().toLocaleString()} ₽</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Менеджер скидок */}
            {showDiscountManager && cart.length > 0 && (
              <DiscountManager
                cartItems={cart.map(item => ({
                  id: item.id,
                  name: `${item.product.model} ${item.product.width}×${item.product.height}мм`,
                  price: item.calculated_price,
                  quantity: item.quantity,
                  subtotal: item.calculated_price * item.quantity
                }))}
                onApplyDiscount={handleApplyDiscount}
                onRemoveDiscount={handleRemoveDiscount}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
