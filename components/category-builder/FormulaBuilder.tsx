'use client';

import React, { useState } from 'react';
import { Card, Button, Input, Select } from '../ui';

interface FormulaConfig {
  clientPriceFormula: string;
  discountFormula: string;
  factoryOrderFormula: string;
  defaultMargin: number;
  currency: string;
}

interface FormulaBuilderProps {
  availableFields: string[];
  onFormulaComplete: (config: FormulaConfig) => void;
  onBack: () => void;
}

export default function FormulaBuilder({ 
  availableFields, 
  onFormulaComplete, 
  onBack 
}: FormulaBuilderProps) {
  const [config, setConfig] = useState<FormulaConfig>({
    clientPriceFormula: 'basePrice * (1 + margin/100)',
    discountFormula: 'clientPrice * (1 - discount/100)',
    factoryOrderFormula: 'basePrice * quantity',
    defaultMargin: 30,
    currency: 'RUB'
  });

  const [previewData, setPreviewData] = useState({
    basePrice: 10000,
    margin: 30,
    discount: 10,
    quantity: 2
  });

  const updateConfig = (field: keyof FormulaConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const updatePreviewData = (field: string, value: number) => {
    setPreviewData(prev => ({ ...prev, [field]: value }));
  };

  const calculatePreview = (formula: string, data: any) => {
    try {
      // Заменяем переменные в формуле на значения
      let expression = formula;
      Object.keys(data).forEach(key => {
        expression = expression.replace(new RegExp(key, 'g'), data[key]);
      });
      
      // Вычисляем результат
      return eval(expression);
    } catch (error) {
      return 'Ошибка в формуле';
    }
  };

  const handleComplete = () => {
    onFormulaComplete(config);
  };

  const formulaTemplates = [
    {
      name: 'Простая наценка',
      clientPrice: 'basePrice * (1 + margin/100)',
      discount: 'clientPrice * (1 - discount/100)',
      factoryOrder: 'basePrice * quantity'
    },
    {
      name: 'Сложная наценка',
      clientPrice: 'basePrice * (1 + margin/100) + additionalCost',
      discount: 'clientPrice * (1 - discount/100)',
      factoryOrder: 'basePrice * quantity * (1 + factoryMargin/100)'
    },
    {
      name: 'Оптовая скидка',
      clientPrice: 'basePrice * (1 + margin/100)',
      discount: 'quantity >= 10 ? clientPrice * 0.9 : clientPrice * (1 - discount/100)',
      factoryOrder: 'basePrice * quantity'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-black">Настройка формул расчета</h3>
          <p className="text-gray-600">Определите как будут рассчитываться цены в корзине</p>
        </div>
        <Button variant="secondary" onClick={onBack}>
          ← Назад
        </Button>
      </div>

      {/* Шаблоны формул */}
      <Card variant="base">
        <div className="p-6">
          <h4 className="font-medium text-black mb-4">Шаблоны формул</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formulaTemplates.map((template, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded cursor-pointer hover:border-black transition-colors">
                <h5 className="font-medium text-black mb-2">{template.name}</h5>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Цена клиента:</strong> {template.clientPrice}</div>
                  <div><strong>Скидка:</strong> {template.discount}</div>
                  <div><strong>Заказ фабрике:</strong> {template.factoryOrder}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-3 w-full"
                  onClick={() => {
                    updateConfig('clientPriceFormula', template.clientPrice);
                    updateConfig('discountFormula', template.discount);
                    updateConfig('factoryOrderFormula', template.factoryOrder);
                  }}
                >
                  Использовать
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Настройка формул */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Формула цены для клиента */}
        <Card variant="base">
          <div className="p-6">
            <h4 className="font-medium text-black mb-4">💰 Цена для клиента</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Формула</label>
                <Input
                  value={config.clientPriceFormula}
                  onChange={(e) => updateConfig('clientPriceFormula', e.target.value)}
                  placeholder="basePrice * (1 + margin/100)"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Наценка по умолчанию (%)</label>
                <Input
                  type="number"
                  value={config.defaultMargin}
                  onChange={(e) => updateConfig('defaultMargin', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Валюта</label>
                <Select
                  value={config.currency}
                  onChange={(e) => updateConfig('currency', e.target.value)}
                  options={[
                    { value: 'RUB', label: 'RUB (Российский рубль)' },
                    { value: 'USD', label: 'USD (Доллар США)' },
                    { value: 'EUR', label: 'EUR (Евро)' }
                  ]}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Формула скидки */}
        <Card variant="base">
          <div className="p-6">
            <h4 className="font-medium text-black mb-4">🎯 Формула скидки</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Формула</label>
                <Input
                  value={config.discountFormula}
                  onChange={(e) => updateConfig('discountFormula', e.target.value)}
                  placeholder="clientPrice * (1 - discount/100)"
                />
              </div>
              <div className="text-sm text-gray-500">
                <p><strong>Доступные переменные:</strong></p>
                <ul className="list-disc list-inside mt-1">
                  <li>clientPrice - цена для клиента</li>
                  <li>discount - процент скидки</li>
                  <li>quantity - количество</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Формула заказа на фабрику */}
        <Card variant="base">
          <div className="p-6">
            <h4 className="font-medium text-black mb-4">🏭 Заказ на фабрику</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Формула</label>
                <Input
                  value={config.factoryOrderFormula}
                  onChange={(e) => updateConfig('factoryOrderFormula', e.target.value)}
                  placeholder="basePrice * quantity"
                />
              </div>
              <div className="text-sm text-gray-500">
                <p><strong>Доступные переменные:</strong></p>
                <ul className="list-disc list-inside mt-1">
                  <li>basePrice - базовая цена</li>
                  <li>quantity - количество</li>
                  <li>factoryMargin - наценка фабрики</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Предпросмотр расчетов */}
        <Card variant="base">
          <div className="p-6">
            <h4 className="font-medium text-black mb-4">👁️ Предпросмотр расчетов</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Базовая цена</label>
                  <Input
                    type="number"
                    value={previewData.basePrice}
                    onChange={(e) => updatePreviewData('basePrice', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Наценка (%)</label>
                  <Input
                    type="number"
                    value={previewData.margin}
                    onChange={(e) => updatePreviewData('margin', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Скидка (%)</label>
                  <Input
                    type="number"
                    value={previewData.discount}
                    onChange={(e) => updatePreviewData('discount', Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Количество</label>
                  <Input
                    type="number"
                    value={previewData.quantity}
                    onChange={(e) => updatePreviewData('quantity', Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Цена для клиента:</span>
                  <span className="font-medium">
                    {calculatePreview(config.clientPriceFormula, previewData).toLocaleString()} {config.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Цена со скидкой:</span>
                  <span className="font-medium">
                    {calculatePreview(config.discountFormula, { 
                      ...previewData, 
                      clientPrice: calculatePreview(config.clientPriceFormula, previewData) 
                    }).toLocaleString()} {config.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Заказ на фабрику:</span>
                  <span className="font-medium">
                    {calculatePreview(config.factoryOrderFormula, previewData).toLocaleString()} {config.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Кнопки действий */}
      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>
          Отмена
        </Button>
        <Button variant="primary" onClick={handleComplete}>
          Сохранить формулы
        </Button>
      </div>
    </div>
  );
}
