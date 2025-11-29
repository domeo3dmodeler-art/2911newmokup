'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '../../../hooks/useCart';
import { priceService, PriceCalculationRequest } from '../../../lib/price/price-service';
import { clientLogger } from '@/lib/logging/client-logger';

interface DoorCalculatorProps {
  title?: string;
  showDimensions?: boolean;
  showStyle?: boolean;
  showSystem?: boolean;
  showFinish?: boolean;
}

interface CalculationResult {
  basePrice: number;
  styleMultiplier: number;
  systemMultiplier: number;
  finishMultiplier: number;
  hardwareMultiplier: number;
  areaMultiplier: number;
  totalPrice: number;
}

export function DoorCalculator({ 
  title = "Калькулятор дверей Domeo",
  showDimensions = true,
  showStyle = true,
  showSystem = true,
  showFinish = true
}: DoorCalculatorProps) {
  const { addItem } = useCart();
  
  const [dimensions, setDimensions] = useState({
    width: 800,
    height: 2000
  });
  const [style, setStyle] = useState('modern');
  const [doorSystem, setDoorSystem] = useState('swing');
  const [finish, setFinish] = useState('pvc');
  const [hardware, setHardware] = useState('standard');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<CalculationResult>({
    basePrice: 15000,
    styleMultiplier: 1.0,
    systemMultiplier: 1.0,
    finishMultiplier: 1.0,
    hardwareMultiplier: 1.0,
    areaMultiplier: 1.0,
    totalPrice: 15000
  });
  
  // Состояние для фотографий
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  
  // Состояние для расчета цены через API
  const [apiPrice, setApiPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Стили дверей (из базы данных)
  const styles = [
    { value: 'modern', label: 'Современная', multiplier: 1.0, basePrice: 15000 },
    { value: 'classic', label: 'Классическая', multiplier: 1.3, basePrice: 18000 },
    { value: 'neoclassic', label: 'Неоклассика', multiplier: 1.2, basePrice: 17000 },
    { value: 'hidden', label: 'Скрытая', multiplier: 1.8, basePrice: 31150 },
    { value: 'aluminum', label: 'Алюминиевая', multiplier: 1.5, basePrice: 22000 }
  ];

  // Системы открывания
  const systems = [
    { value: 'swing', label: 'Поворотная', multiplier: 1.0 },
    { value: 'sliding', label: 'Раздвижная', multiplier: 1.4 },
    { value: 'pocket', label: 'Пенал', multiplier: 1.6 },
    { value: 'folding', label: 'Складная', multiplier: 1.3 }
  ];

  // Покрытия (из базы данных)
  const finishes = [
    { value: 'pvc', label: 'ПВХ', multiplier: 1.0 },
    { value: 'paint', label: 'Эмаль', multiplier: 1.1 },
    { value: 'veneer', label: 'Шпон', multiplier: 1.3 },
    { value: 'nanotex', label: 'Нанотекс', multiplier: 1.2 },
    { value: 'glass', label: 'Стекло', multiplier: 1.4 },
    { value: 'finish', label: 'Под отделку', multiplier: 0.9 }
  ];

  // Фурнитура
  const hardwareOptions = [
    { value: 'standard', label: 'Стандартная', multiplier: 1.0 },
    { value: 'premium', label: 'Премиум', multiplier: 1.3 },
    { value: 'luxury', label: 'Люкс', multiplier: 1.8 }
  ];

  // Расчет цены через унифицированный сервис
  const calculatePriceViaAPI = async () => {
    try {
      setPriceLoading(true);
      setPriceError(null);
      
      const requestData: PriceCalculationRequest = {
        style: styles.find(s => s.value === style)?.label || 'Современная',
        model: 'DomeoDoors_Base_1', // Реальная модель из базы
        finish: finishes.find(f => f.value === finish)?.label || 'ПВХ',
        color: 'Белый', // Базовый цвет
        width: dimensions.width,
        height: dimensions.height,
        hardware_kit: hardwareOptions.find(h => h.value === hardware)?.label === 'Премиум' ? { id: 'premium-kit' } : undefined
      };
      
      const priceResult = await priceService.calculatePriceUniversal(requestData);
      setApiPrice(priceResult.total);
      
    } catch (error) {
      clientLogger.error('❌ Ошибка расчета цены:', error);
      setPriceError('Ошибка расчета цены');
    } finally {
      setPriceLoading(false);
    }
  };

  // Локальный расчет цены (для демонстрации)
  const calculatePrice = () => {
    const newWarnings: string[] = [];
    
    // Валидация размеров
    const validWidth = Math.max(600, Math.min(1200, dimensions.width));
    const validHeight = Math.max(1800, Math.min(2200, dimensions.height));
    
    if (dimensions.width !== validWidth) {
      newWarnings.push(`Ширина скорректирована до ${validWidth} мм (допустимый диапазон: 600-1200 мм)`);
    }
    
    if (dimensions.height !== validHeight) {
      newWarnings.push(`Высота скорректирована до ${validHeight} мм (допустимый диапазон: 1800-2200 мм)`);
    }
    
    const area = (validWidth * validHeight) / 1000000; // в м²
    const areaMultiplier = Math.max(0.8, Math.min(1.5, area)); // от 0.8 до 1.5
    
    const selectedStyle = styles.find(s => s.value === style);
    const selectedSystem = systems.find(s => s.value === doorSystem);
    const selectedFinish = finishes.find(f => f.value === finish);
    const selectedHardware = hardwareOptions.find(h => h.value === hardware);
    
    const basePrice = selectedStyle?.basePrice || 15000;
    const styleMultiplier = selectedStyle?.multiplier || 1.0;
    const systemMultiplier = selectedSystem?.multiplier || 1.0;
    const finishMultiplier = selectedFinish?.multiplier || 1.0;
    const hardwareMultiplier = selectedHardware?.multiplier || 1.0;
    
    const totalMultiplier = styleMultiplier * systemMultiplier * finishMultiplier * hardwareMultiplier;
    const totalPrice = Math.round(basePrice * areaMultiplier * totalMultiplier);
    
    setWarnings(newWarnings);
    setResult({
      basePrice,
      styleMultiplier,
      systemMultiplier,
      finishMultiplier,
      hardwareMultiplier,
      areaMultiplier,
      totalPrice
    });
  };

  // Функция загрузки фотографии для выбранного стиля
  const loadPhoto = async (styleName: string) => {
    try {
      setPhotoLoading(true);
      setPhotoError(null);
      
      clientLogger.debug('🔄 Загружаем фото для стиля:', styleName);
      
      // Используем оптимизированный API
      const response = await fetch(`/api/catalog/doors/photos-optimized?model=${encodeURIComponent(styleName)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.photos && data.photos.length > 0) {
          const photoPath = data.photos[0];
          const imageUrl = photoPath.startsWith('/uploads') ? photoPath : `/uploads${photoPath}`;
          setCurrentPhoto(imageUrl);
          clientLogger.debug('✅ Фото загружено:', imageUrl);
        } else {
          setCurrentPhoto(null);
          clientLogger.debug('ℹ️ Фото не найдено для стиля:', styleName);
        }
      } else {
        setPhotoError('Ошибка загрузки фотографии');
        setCurrentPhoto(null);
      }
    } catch (error) {
      clientLogger.error('❌ Ошибка загрузки фото:', error);
      setPhotoError('Ошибка загрузки фотографии');
      setCurrentPhoto(null);
    } finally {
      setPhotoLoading(false);
    }
  };

  // Добавление товара в корзину
  const handleAddToCart = async () => {
    try {
      const selectedStyle = styles.find(s => s.value === style);
      const selectedFinish = finishes.find(f => f.value === finish);
      
      const cartItem = {
        productId: `door-${style}-${finish}-${dimensions.width}x${dimensions.height}`,
        productName: `Дверь ${selectedStyle?.label || 'Современный'} ${selectedFinish?.label || 'Эмаль'}`,
        categoryId: 'doors',
        categoryName: 'Межкомнатные двери',
        basePrice: apiPrice || result.totalPrice,
        quantity: 1,
        options: [],
        modifications: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        metadata: {
          style: selectedStyle?.label || 'Современный',
          model: 'DomeoDoors_Modern_1',
          finish: selectedFinish?.label || 'Эмаль',
          color: 'Белый',
          width: dimensions.width,
          height: dimensions.height,
          doorSystem: doorSystem,
          hardware: hardware
        }
      };
      
      await addItem(cartItem);
      clientLogger.debug('✅ Товар добавлен в корзину:', cartItem);
      
      // Показываем уведомление
      alert(`✅ Товар "${cartItem.productName}" добавлен в корзину!\nЦена: ${cartItem.basePrice.toLocaleString()} ₽`);
      
    } catch (error) {
      clientLogger.error('❌ Ошибка добавления в корзину:', error);
      alert('❌ Ошибка при добавлении товара в корзину');
    }
  };

  // Debounced расчет цены через API
  useEffect(() => {
    setIsCalculating(true);
    
    const timeoutId = setTimeout(() => {
      calculatePriceViaAPI().finally(() => {
        setIsCalculating(false);
      });
    }, 500); // Задержка 500мс для оптимизации

    return () => {
      clearTimeout(timeoutId);
      setIsCalculating(false);
    };
  }, [dimensions, style, doorSystem, finish, hardware]);

  // Мгновенный локальный расчет
  useEffect(() => {
    calculatePrice();
  }, [dimensions, style, doorSystem, finish, hardware]);

  // Загружаем фото при изменении стиля
  useEffect(() => {
    if (style) {
      loadPhoto(style);
    }
  }, [style]);

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">Рассчитайте стоимость вашей двери</p>
        
        {/* Предупреждения */}
        {warnings.length > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-800">
              <div className="font-semibold mb-2">⚠️ Предупреждения:</div>
              <ul className="list-disc list-inside space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Параметры */}
        <div className="space-y-6">
          {showDimensions && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                📏 Размеры двери
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ширина (мм)
                  </label>
                  <input
                    type="number"
                    value={dimensions.width}
                    onChange={(e) => setDimensions(prev => ({ ...prev, width: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="600"
                    max="1200"
                    step="50"
                  />
                  <div className="text-xs text-gray-500 mt-1">600-1200 мм</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Высота (мм)
                  </label>
                  <input
                    type="number"
                    value={dimensions.height}
                    onChange={(e) => setDimensions(prev => ({ ...prev, height: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1800"
                    max="2200"
                    step="50"
                  />
                  <div className="text-xs text-gray-500 mt-1">1800-2200 мм</div>
                </div>
              </div>
            </div>
          )}

          {showStyle && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                🎨 Стиль двери
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {styles.map(s => (
                  <label key={s.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                    <input
                      type="radio"
                      name="style"
                      value={s.value}
                      checked={style === s.value}
                      onChange={(e) => setStyle(e.target.value)}
                      className="mr-3 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{s.label}</div>
                      <div className="text-sm text-gray-600">от {s.basePrice.toLocaleString()} ₽/м²</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {showSystem && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                🔧 Система открывания
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {systems.map(s => (
                  <label key={s.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                    <input
                      type="radio"
                      name="system"
                      value={s.value}
                      checked={doorSystem === s.value}
                      onChange={(e) => setDoorSystem(e.target.value)}
                      className="mr-3 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{s.label}</div>
                      <div className="text-sm text-gray-600">
                        {s.multiplier === 1.0 ? 'Базовая цена' : `+${Math.round((s.multiplier - 1) * 100)}%`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {showFinish && (
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                🎭 Покрытие
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {finishes.map(f => (
                  <label key={f.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                    <input
                      type="radio"
                      name="finish"
                      value={f.value}
                      checked={finish === f.value}
                      onChange={(e) => setFinish(e.target.value)}
                      className="mr-3 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{f.label}</div>
                      <div className="text-sm text-gray-600">
                        {f.multiplier === 1.0 ? 'Базовое покрытие' : `+${Math.round((f.multiplier - 1) * 100)}%`}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🔩 Фурнитура
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {hardwareOptions.map(h => (
                <label key={h.value} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                  <input
                    type="radio"
                    name="hardware"
                    value={h.value}
                    checked={hardware === h.value}
                    onChange={(e) => setHardware(h.value)}
                    className="mr-3 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{h.label}</div>
                    <div className="text-sm text-gray-600">
                      {h.multiplier === 1.0 ? 'Стандартная фурнитура' : `+${Math.round((h.multiplier - 1) * 100)}%`}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Результат */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Расчет стоимости</h3>
          
          {/* Фотография двери */}
          <div className="mb-6 text-center">
            <div className="bg-white p-4 rounded-lg shadow-sm inline-block">
              {photoLoading ? (
                <div className="w-48 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : currentPhoto ? (
                <img 
                  src={currentPhoto} 
                  alt={`Дверь стиля ${style}`}
                  className="w-48 h-32 object-cover rounded-lg"
                  onError={() => setPhotoError('Ошибка загрузки изображения')}
                />
              ) : (
                <div className="w-48 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  {photoError ? '❌' : '🚪'}
                </div>
              )}
              {photoError && (
                <div className="text-xs text-red-500 mt-2">{photoError}</div>
              )}
            </div>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-700">Размер:</span>
              <span className="font-semibold text-gray-900">
                {dimensions.width} × {dimensions.height} мм
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-700">Площадь:</span>
              <span className="font-semibold text-gray-900">
                {((dimensions.width * dimensions.height) / 1000000).toFixed(2)} м²
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-700">Стиль:</span>
              <span className="font-semibold text-gray-900">
                {styles.find(s => s.value === style)?.label}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-700">Система:</span>
              <span className="font-semibold text-gray-900">
                {systems.find(s => s.value === doorSystem)?.label}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-700">Покрытие:</span>
              <span className="font-semibold text-gray-900">
                {finishes.find(f => f.value === finish)?.label}
              </span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-gray-700">Фурнитура:</span>
              <span className="font-semibold text-gray-900">
                {hardwareOptions.find(h => h.value === hardware)?.label}
              </span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border-2 border-blue-200">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">Итоговая стоимость</div>
              
              {/* Отображение цены */}
              {priceLoading || isCalculating ? (
                <div className="text-4xl font-bold text-blue-600 mb-2 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                  Расчет...
                </div>
              ) : priceError ? (
                <div className="text-4xl font-bold text-red-600 mb-2">
                  {result.totalPrice.toLocaleString()} ₽
                </div>
              ) : apiPrice ? (
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {apiPrice.toLocaleString()} ₽
                </div>
              ) : (
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {result.totalPrice.toLocaleString()} ₽
                </div>
              )}
              
              <div className="text-sm text-gray-500">
                {apiPrice ? 'Цена рассчитана через API' : 'Примерная стоимость'}
              </div>
              
              {isCalculating && (
                <div className="text-xs text-blue-500 mt-1">
                  🔄 Обновление цены...
                </div>
              )}
              
              {priceError && (
                <div className="text-xs text-red-500 mt-1">
                  ⚠️ Ошибка API, показана примерная цена
                </div>
              )}
            </div>
            
            {/* Детализация расчета */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Детализация расчета:</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Базовая цена:</span>
                  <span>{result.basePrice.toLocaleString()} ₽</span>
                </div>
                <div className="flex justify-between">
                  <span>Множитель площади:</span>
                  <span>{result.areaMultiplier.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Множитель стиля:</span>
                  <span>{result.styleMultiplier.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Множитель системы:</span>
                  <span>{result.systemMultiplier.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Множитель покрытия:</span>
                  <span>{result.finishMultiplier.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Множитель фурнитуры:</span>
                  <span>{result.hardwareMultiplier.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Итого:</span>
                  <span>{result.totalPrice.toLocaleString()} ₽</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
            <button className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg">
              📞 Заказать консультацию
            </button>
            
            <button 
              onClick={handleAddToCart}
              disabled={priceLoading}
              className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {priceLoading ? '⏳ Расчет...' : '🛒 Добавить в корзину'}
            </button>
            
            <button className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              💾 Сохранить расчет
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

