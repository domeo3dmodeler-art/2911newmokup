'use client';

import React, { useState, useEffect } from 'react';

interface PriceCalculatorProps {
  categoryIds?: string[];
  basePrice?: number;
  title?: string;
  showDimensions?: boolean;
  showStyle?: boolean;
}

export function PriceCalculator({ 
  categoryIds = [], 
  basePrice = 15000,
  title = "Калькулятор цен",
  showDimensions = true,
  showStyle = true
}: PriceCalculatorProps) {
  const [dimensions, setDimensions] = useState({
    width: 800,
    height: 2000
  });
  const [style, setStyle] = useState('modern');
  const [material, setMaterial] = useState('wood');
  const [finish, setFinish] = useState('matte');
  const [calculatedPrice, setCalculatedPrice] = useState(basePrice);

  const styles = [
    { value: 'modern', label: 'Современный', multiplier: 1.0 },
    { value: 'classic', label: 'Классический', multiplier: 1.2 },
    { value: 'minimalist', label: 'Минимализм', multiplier: 0.9 },
    { value: 'luxury', label: 'Люкс', multiplier: 1.5 }
  ];

  const materials = [
    { value: 'wood', label: 'Дерево', multiplier: 1.0 },
    { value: 'mdf', label: 'МДФ', multiplier: 0.7 },
    { value: 'glass', label: 'Стекло', multiplier: 1.3 },
    { value: 'metal', label: 'Металл', multiplier: 1.4 }
  ];

  const finishes = [
    { value: 'matte', label: 'Матовый', multiplier: 1.0 },
    { value: 'glossy', label: 'Глянцевый', multiplier: 1.1 },
    { value: 'textured', label: 'Текстурированный', multiplier: 1.05 }
  ];

  const calculatePrice = () => {
    const area = (dimensions.width * dimensions.height) / 1000000; // в м²
    
    const styleMultiplier = styles.find(s => s.value === style)?.multiplier || 1.0;
    const materialMultiplier = materials.find(m => m.value === material)?.multiplier || 1.0;
    const finishMultiplier = finishes.find(f => f.value === finish)?.multiplier || 1.0;
    
    const totalMultiplier = styleMultiplier * materialMultiplier * finishMultiplier;
    const calculated = Math.round(basePrice * area * totalMultiplier);
    
    setCalculatedPrice(calculated);
  };

  useEffect(() => {
    calculatePrice();
  }, [dimensions, style, material, finish, basePrice]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-6">{title}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Параметры */}
        <div className="space-y-4">
          {showDimensions && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Размеры</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ширина (мм)
                </label>
                <input
                  type="number"
                  value={dimensions.width}
                  onChange={(e) => setDimensions(prev => ({ ...prev, width: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="400"
                  max="1200"
                  step="50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Высота (мм)
                </label>
                <input
                  type="number"
                  value={dimensions.height}
                  onChange={(e) => setDimensions(prev => ({ ...prev, height: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1800"
                  max="2200"
                  step="50"
                />
              </div>
            </div>
          )}

          {showStyle && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Стиль
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {styles.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Материал
            </label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {materials.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Покрытие
            </label>
            <select
              value={finish}
              onChange={(e) => setFinish(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {finishes.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Результат */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-4">Расчет стоимости</h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Площадь:</span>
              <span className="font-medium">
                {((dimensions.width * dimensions.height) / 1000000).toFixed(2)} м²
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Базовая цена за м²:</span>
              <span className="font-medium">{basePrice.toLocaleString()} ₽</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Стиль:</span>
              <span className="font-medium">
                {styles.find(s => s.value === style)?.label}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Материал:</span>
              <span className="font-medium">
                {materials.find(m => m.value === material)?.label}
              </span>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Итого:</span>
              <span className="text-2xl font-bold text-blue-600">
                {calculatedPrice.toLocaleString()} ₽
              </span>
            </div>
          </div>
          
          <button className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
            Заказать
          </button>
        </div>
      </div>
    </div>
  );
}