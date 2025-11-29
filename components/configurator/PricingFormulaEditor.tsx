'use client';

import React, { useState } from 'react';
import { Button, Card, Input, Select, Alert } from '@/components/ui';
import { Calculator, Plus, Minus, Save, Play } from 'lucide-react';

interface PricingRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed' | 'formula';
  value: number;
  formula?: string;
  conditions: {
    minQuantity?: number;
    maxQuantity?: number;
    minAmount?: number;
    maxAmount?: number;
    categoryIds?: string[];
  };
  description: string;
}

interface PricingFormulaEditorProps {
  categoryLinkId: string;
  linkType: 'main' | 'additional';
  onSave: (rule: PricingRule) => void;
  onCancel: () => void;
}

const FORMULA_TEMPLATES = [
  {
    name: 'Простая наценка',
    formula: 'basePrice * (1 + margin/100)',
    description: 'Базовая цена плюс процент наценки'
  },
  {
    name: 'Наценка с минимумом',
    formula: 'Math.max(basePrice * (1 + margin/100), minPrice)',
    description: 'Наценка с минимальной ценой'
  },
  {
    name: 'Оптовая скидка',
    formula: 'quantity >= 10 ? basePrice * 0.9 : basePrice * (1 + margin/100)',
    description: 'Скидка при большом количестве'
  },
  {
    name: 'Ступенчатая цена',
    formula: 'quantity <= 5 ? basePrice * 1.2 : quantity <= 20 ? basePrice * 1.1 : basePrice',
    description: 'Разные цены в зависимости от количества'
  },
  {
    name: 'Цена с учетом сезона',
    formula: 'basePrice * (1 + margin/100) * (isSeason ? 1.1 : 1)',
    description: 'Сезонная наценка'
  }
];

const AVAILABLE_VARIABLES = [
  { name: 'basePrice', description: 'Базовая цена товара', type: 'number' },
  { name: 'margin', description: 'Наценка в процентах', type: 'number' },
  { name: 'quantity', description: 'Количество товара', type: 'number' },
  { name: 'totalAmount', description: 'Общая сумма заказа', type: 'number' },
  { name: 'minPrice', description: 'Минимальная цена', type: 'number' },
  { name: 'maxPrice', description: 'Максимальная цена', type: 'number' },
  { name: 'isSeason', description: 'Сезонный период (true/false)', type: 'boolean' },
  { name: 'customerType', description: 'Тип клиента (1-5)', type: 'number' },
  { name: 'discount', description: 'Скидка в процентах', type: 'number' }
];

export default function PricingFormulaEditor({ categoryLinkId, linkType, onSave, onCancel }: PricingFormulaEditorProps) {
  const [rule, setRule] = useState<PricingRule>({
    id: `rule_${Date.now()}`,
    name: '',
    type: 'percentage',
    value: 0,
    formula: 'basePrice * (1 + margin/100)',
    conditions: {},
    description: ''
  });

  const [testData, setTestData] = useState({
    basePrice: 10000,
    margin: 30,
    quantity: 1,
    totalAmount: 10000,
    minPrice: 5000,
    maxPrice: 50000,
    isSeason: false,
    customerType: 1,
    discount: 0
  });

  const [testResult, setTestResult] = useState<number | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const updateRule = (field: keyof PricingRule, value: any) => {
    setRule(prev => ({ ...prev, [field]: value }));
  };

  const updateCondition = (field: keyof PricingRule['conditions'], value: any) => {
    setRule(prev => ({
      ...prev,
      conditions: { ...prev.conditions, [field]: value }
    }));
  };

  const updateTestData = (field: string, value: any) => {
    setTestData(prev => ({ ...prev, [field]: value }));
  };

  const testFormula = () => {
    if (!rule.formula) {
      setTestError('Формула не указана');
      return;
    }

    try {
      // Создаем безопасную функцию для вычисления формулы
      const func = new Function(...AVAILABLE_VARIABLES.map(v => v.name), `return ${rule.formula}`);
      const result = func(
        testData.basePrice,
        testData.margin,
        testData.quantity,
        testData.totalAmount,
        testData.minPrice,
        testData.maxPrice,
        testData.isSeason,
        testData.customerType,
        testData.discount
      );
      
      setTestResult(typeof result === 'number' ? result : parseFloat(result));
      setTestError(null);
    } catch (error) {
      setTestError(error instanceof Error ? error.message : 'Ошибка в формуле');
      setTestResult(null);
    }
  };

  const applyTemplate = (template: typeof FORMULA_TEMPLATES[0]) => {
    setRule(prev => ({
      ...prev,
      formula: template.formula,
      description: template.description
    }));
  };

  const handleSave = () => {
    if (!rule.name) {
      alert('Введите название правила');
      return;
    }

    if (rule.type === 'formula' && !rule.formula) {
      alert('Введите формулу');
      return;
    }

    onSave(rule);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Настройка ценообразования для {linkType === 'main' ? 'основной' : 'дополнительной'} категории
            </h2>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onCancel}>
                Отмена
              </Button>
              <Button onClick={handleSave} className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>Сохранить</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Левая панель - настройки правила */}
            <div className="space-y-6">
              {/* Основные настройки */}
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 mb-4">Основные настройки</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название правила
                    </label>
                    <Input
                      value={rule.name}
                      onChange={(e) => updateRule('name', e.target.value)}
                      placeholder="Например: Стандартная наценка 30%"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Тип ценообразования
                    </label>
                    <Select
                      value={rule.type}
                      onValueChange={(value: 'percentage' | 'fixed' | 'formula') => updateRule('type', value)}
                    >
                      <option value="percentage">Процент от базовой цены</option>
                      <option value="fixed">Фиксированная сумма</option>
                      <option value="formula">Формула</option>
                    </Select>
                  </div>

                  {rule.type !== 'formula' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {rule.type === 'percentage' ? 'Процент (%)' : 'Сумма (₽)'}
                      </label>
                      <Input
                        type="number"
                        value={rule.value}
                        onChange={(e) => updateRule('value', parseFloat(e.target.value) || 0)}
                        placeholder={rule.type === 'percentage' ? '30' : '1000'}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание
                    </label>
                    <textarea
                      value={rule.description}
                      onChange={(e) => updateRule('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      rows={2}
                      placeholder="Описание правила ценообразования"
                    />
                  </div>
                </div>
              </Card>

              {/* Условия применения */}
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 mb-4">Условия применения</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Мин. количество
                    </label>
                    <Input
                      type="number"
                      value={rule.conditions.minQuantity || ''}
                      onChange={(e) => updateCondition('minQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Макс. количество
                    </label>
                    <Input
                      type="number"
                      value={rule.conditions.maxQuantity || ''}
                      onChange={(e) => updateCondition('maxQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Мин. сумма (₽)
                    </label>
                    <Input
                      type="number"
                      value={rule.conditions.minAmount || ''}
                      onChange={(e) => updateCondition('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="1000"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Макс. сумма (₽)
                    </label>
                    <Input
                      type="number"
                      value={rule.conditions.maxAmount || ''}
                      onChange={(e) => updateCondition('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="100000"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Правая панель - формулы и тестирование */}
            <div className="space-y-6">
              {/* Шаблоны формул */}
              {rule.type === 'formula' && (
                <Card className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Шаблоны формул</h3>
                  
                  <div className="space-y-2">
                    {FORMULA_TEMPLATES.map((template, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                           onClick={() => applyTemplate(template)}>
                        <div className="font-medium text-sm text-gray-900">{template.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{template.description}</div>
                        <div className="text-xs text-gray-500 mt-1 font-mono">{template.formula}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Редактор формулы */}
              {rule.type === 'formula' && (
                <Card className="p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Формула</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        JavaScript формула
                      </label>
                      <textarea
                        value={rule.formula || ''}
                        onChange={(e) => updateRule('formula', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                        rows={4}
                        placeholder="basePrice * (1 + margin/100)"
                      />
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Доступные переменные:</h4>
                      <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                        {AVAILABLE_VARIABLES.map(variable => (
                          <div key={variable.name} className="flex items-center justify-between text-xs">
                            <span className="font-mono text-blue-600">{variable.name}</span>
                            <span className="text-gray-600">{variable.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Тестирование */}
              <Card className="p-4">
                <h3 className="font-medium text-gray-900 mb-4">Тестирование</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(testData).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {key}
                        </label>
                        <Input
                          type={typeof value === 'boolean' ? 'checkbox' : 'number'}
                          checked={typeof value === 'boolean' ? value : undefined}
                          value={typeof value === 'boolean' ? undefined : value}
                          onChange={(e) => {
                            if (typeof value === 'boolean') {
                              updateTestData(key, e.target.checked);
                            } else {
                              updateTestData(key, parseFloat(e.target.value) || 0);
                            }
                          }}
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={testFormula}
                    className="w-full flex items-center justify-center space-x-2"
                    disabled={rule.type !== 'formula'}
                  >
                    <Play className="h-4 w-4" />
                    <span>Тестировать формулу</span>
                  </Button>

                  {testError && (
                    <Alert variant="error">{testError}</Alert>
                  )}

                  {testResult !== null && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm font-medium text-green-900">Результат:</div>
                      <div className="text-lg font-bold text-green-600">{testResult.toLocaleString()} ₽</div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

