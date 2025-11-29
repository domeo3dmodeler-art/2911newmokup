'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Select, Alert } from '@/components/ui';
import { Package, ShoppingCart, Settings, Calculator } from 'lucide-react';
import { clientLogger } from '@/lib/logging/client-logger';

export interface DoorConfiguratorNoCodeProps {
  id: string;
  config: {
    categoryId?: string;
    showStyleSelector?: boolean;
    showColorSelector?: boolean;
    showMaterialSelector?: boolean;
    showSizeSelector?: boolean;
    showPriceDisplay?: boolean;
    showProductDetails?: boolean;
    showRecommendations?: boolean;
    showProgress?: boolean;
    configuratorType?: 'step-by-step' | 'all-at-once' | 'guided';
  };
  data?: any;
  onUpdate?: (id: string, data: any) => void;
  className?: string;
}

interface DoorProduct {
  id: string;
  model: string;
  style: string;
  finish: string;
  color: string;
  type: string;
  width: number;
  height: number;
  rrc_price: number;
  sku_1c: string;
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
}

export default function DoorConfiguratorNoCode({ 
  id, 
  config, 
  data, 
  onUpdate, 
  className 
}: DoorConfiguratorNoCodeProps) {
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
  const [currentPrice, setCurrentPrice] = useState<number>(0);

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
  }, [config.categoryId]);

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
    return cart.reduce((sum, item) => sum + (item.calculated_price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Загрузка конфигуратора дверей...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 ${className}`}>
        <Alert variant="error">{error}</Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Основная панель конфигуратора */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Package className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Конфигуратор дверей</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Стиль */}
          {config.showStyleSelector !== false && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Стиль</label>
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
          )}

          {/* Модель */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Модель</label>
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
          {config.showMaterialSelector !== false && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Отделка</label>
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
          )}

          {/* Цвет */}
          {config.showColorSelector !== false && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Цвет</label>
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
          )}

          {/* Тип */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Тип</label>
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
          {config.showSizeSelector !== false && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ширина (мм)</label>
                <Select
                  value={selectedWidth.toString()}
                  onValueChange={(value) => setSelectedWidth(parseInt(value))}
                >
                  {widths.map(width => (
                    <option key={width} value={width.toString()}>{width}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Высота (мм)</label>
                <Select
                  value={selectedHeight.toString()}
                  onValueChange={(value) => setSelectedHeight(parseInt(value))}
                >
                  {heights.map(height => (
                    <option key={height} value={height.toString()}>{height}</option>
                  ))}
                </Select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Дополнительные опции */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Дополнительные опции</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Комплект фурнитуры */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Комплект фурнитуры</label>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ручка</label>
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
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              {config.showPriceDisplay !== false && (
                <h3 className="text-lg font-semibold text-gray-900">Итого: {currentPrice.toLocaleString()} ₽</h3>
              )}
              <p className="text-sm text-gray-600">
                {selectedProduct.model} • {selectedWidth}×{selectedHeight}мм
              </p>
            </div>
            <Button
              onClick={addToCart}
              className="flex items-center space-x-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Добавить в корзину</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Корзина */}
      {cart.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Корзина</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {cart.length}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Итого: <span className="font-semibold text-gray-900">{getCartTotal().toLocaleString()} ₽</span>
            </div>
          </div>

          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm text-gray-900">{item.product.model}</h4>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:text-red-700 text-xs"
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
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-xs"
                    >
                      -
                    </button>
                    <span className="text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-xs"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-medium text-sm">
                    {(item.calculated_price * item.quantity).toLocaleString()} ₽
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

