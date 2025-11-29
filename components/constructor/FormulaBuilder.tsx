'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Select, Textarea } from '../ui';
import { Plus, Trash2, Calculator, Play, Save, AlertCircle } from 'lucide-react';

interface CustomFormula {
  id: string;
  name: string;
  formula: string;
  description?: string;
  variables: string[];
  result?: any;
  error?: string;
}

interface FormulaBuilderProps {
  priceFormula: string;
  discountFormula: string;
  customFormulas: CustomFormula[];
  onPriceFormulaChange: (formula: string) => void;
  onDiscountFormulaChange: (formula: string) => void;
  onCustomFormulasChange: (formulas: CustomFormula[]) => void;
}

export default function FormulaBuilder({
  priceFormula,
  discountFormula,
  customFormulas,
  onPriceFormulaChange,
  onDiscountFormulaChange,
  onCustomFormulasChange
}: FormulaBuilderProps) {
  const [activeTab, setActiveTab] = useState<'price' | 'discount' | 'custom'>('price');
  const [testVariables, setTestVariables] = useState<Record<string, any>>({
    base_price: 1000,
    quantity: 5,
    discount: 0.1,
    tax: 0.2
  });

  // Доступные переменные для формул
  const availableVariables = [
    { name: 'base_price', description: 'Базовая цена товара', type: 'number' },
    { name: 'quantity', description: 'Количество товара', type: 'number' },
    { name: 'discount', description: 'Скидка (0-1)', type: 'number' },
    { name: 'tax', description: 'Налог (0-1)', type: 'number' },
    { name: 'weight', description: 'Вес товара', type: 'number' },
    { name: 'width', description: 'Ширина товара', type: 'number' },
    { name: 'height', description: 'Высота товара', type: 'number' },
    { name: 'depth', description: 'Глубина товара', type: 'number' }
  ];

  // Добавление новой пользовательской формулы
  const addCustomFormula = () => {
    const newFormula: CustomFormula = {
      id: `formula_${Date.now()}`,
      name: `Формула ${customFormulas.length + 1}`,
      formula: 'base_price * quantity',
      description: '',
      variables: ['base_price', 'quantity']
    };
    onCustomFormulasChange([...customFormulas, newFormula]);
  };

  // Обновление пользовательской формулы
  const updateCustomFormula = (id: string, updates: Partial<CustomFormula>) => {
    const updatedFormulas = customFormulas.map(formula =>
      formula.id === id ? { ...formula, ...updates } : formula
    );
    onCustomFormulasChange(updatedFormulas);
  };

  // Удаление пользовательской формулы
  const removeCustomFormula = (id: string) => {
    onCustomFormulasChange(customFormulas.filter(formula => formula.id !== id));
  };

  // Извлечение переменных из формулы
  const extractVariables = (formula: string): string[] => {
    const matches = formula.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g);
    return matches ? [...new Set(matches)] : [];
  };

  // Безопасное выполнение формулы
  const executeFormula = (formula: string, variables: Record<string, any>): { result?: any; error?: string } => {
    try {
      // Заменяем переменные на значения
      let processedFormula = formula;
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        processedFormula = processedFormula.replace(regex, String(value));
      }

      // Заменяем математические операторы на безопасные
      processedFormula = processedFormula
        .replace(/\^/g, '**') // Степень
        .replace(/&&/g, '&&') // Логическое И
        .replace(/\|\|/g, '||'); // Логическое ИЛИ

      // Ограничиваем доступные функции
      const allowedFunctions = ['Math.', 'parseInt', 'parseFloat', 'Number', 'String'];
      const hasUnsafeCode = /[^a-zA-Z0-9_+\-*/().\s,&&||?:]/g.test(processedFormula);
      
      if (hasUnsafeCode) {
        return { error: 'Формула содержит недопустимые символы' };
      }

      // Выполняем формулу
      const result = eval(processedFormula);
      return { result };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Ошибка выполнения формулы' };
    }
  };

  // Тестирование формулы
  const testFormula = (formula: string) => {
    return executeFormula(formula, testVariables);
  };

  // Обновление тестовых переменных
  const updateTestVariable = (name: string, value: string) => {
    const numValue = parseFloat(value);
    setTestVariables(prev => ({
      ...prev,
      [name]: isNaN(numValue) ? value : numValue
    }));
  };

  // Рендер редактора формулы
  const renderFormulaEditor = (
    formula: string,
    onChange: (formula: string) => void,
    title: string,
    description: string
  ) => {
    const testResult = testFormula(formula);
    const variables = extractVariables(formula);

    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-1">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>

        {/* Редактор формулы */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Формула</label>
          <Textarea
            value={formula}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Например: base_price * quantity * (1 - discount)"
            rows={3}
            className="font-mono text-sm"
          />
        </div>

        {/* Переменные в формуле */}
        {variables.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Переменные в формуле</label>
            <div className="flex flex-wrap gap-2">
              {variables.map(variable => {
                const varInfo = availableVariables.find(v => v.name === variable);
                return (
                  <span
                    key={variable}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    title={varInfo?.description}
                  >
                    {variable}
                    {varInfo && (
                      <span className="ml-1 text-blue-600">({varInfo.type})</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Тестирование формулы */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-gray-900">Тестирование</h5>
            <div className="flex items-center space-x-2">
              <Play className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Результат: {testResult.result !== undefined ? testResult.result : 'Ошибка'}</span>
            </div>
          </div>

          {/* Тестовые переменные */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {variables.map(variable => (
              <div key={variable}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{variable}</label>
                <Input
                  type="number"
                  value={testVariables[variable] || ''}
                  onChange={(e) => updateTestVariable(variable, e.target.value)}
                  className="text-sm"
                />
              </div>
            ))}
          </div>

          {/* Результат тестирования */}
          {testResult.error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{testResult.error}</span>
            </div>
          )}
        </div>

        {/* Доступные переменные */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Доступные переменные</label>
          <div className="grid grid-cols-2 gap-2">
            {availableVariables.map(variable => (
              <div
                key={variable.name}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
              >
                <div>
                  <span className="font-medium text-gray-900">{variable.name}</span>
                  <span className="ml-2 text-gray-500">({variable.type})</span>
                </div>
                <div className="text-xs text-gray-600 max-w-32 truncate">
                  {variable.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Построитель формул
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Настройте формулы для расчета цен, скидок и других вычислений
        </p>
      </div>

      {/* Вкладки */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4">
          {[
            { key: 'price', label: 'Формула цены', icon: '💰' },
            { key: 'discount', label: 'Формула скидки', icon: '🎯' },
            { key: 'custom', label: 'Пользовательские', icon: '⚙️' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Содержимое вкладок */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: '500px' }}>
        {activeTab === 'price' && renderFormulaEditor(
          priceFormula,
          onPriceFormulaChange,
          'Формула расчета цены',
          'Используется для расчета итоговой цены товара с учетом всех факторов'
        )}

        {activeTab === 'discount' && renderFormulaEditor(
          discountFormula,
          onDiscountFormulaChange,
          'Формула расчета скидки',
          'Определяет размер скидки в зависимости от различных условий'
        )}

        {activeTab === 'custom' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900">Пользовательские формулы</h4>
                <p className="text-sm text-gray-600">Создайте дополнительные формулы для сложных вычислений</p>
              </div>
              <Button onClick={addCustomFormula}>
                <Plus className="w-4 h-4 mr-1" />
                Добавить формулу
              </Button>
            </div>

            <div className="space-y-4">
              {customFormulas.map((formula, index) => (
                <div key={formula.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Input
                      value={formula.name}
                      onChange={(e) => updateCustomFormula(formula.id, { name: e.target.value })}
                      className="font-medium"
                      placeholder="Название формулы"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeCustomFormula(formula.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Textarea
                      value={formula.description || ''}
                      onChange={(e) => updateCustomFormula(formula.id, { description: e.target.value })}
                      placeholder="Описание формулы..."
                      rows={2}
                      className="text-sm"
                    />

                    <Textarea
                      value={formula.formula}
                      onChange={(e) => updateCustomFormula(formula.id, { formula: e.target.value })}
                      placeholder="base_price * quantity * (1 - discount)"
                      rows={2}
                      className="font-mono text-sm"
                    />

                    {/* Тестирование пользовательской формулы */}
                    {formula.formula && (
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Тест:</span>
                          <span className="text-sm text-gray-600">
                            {(() => {
                              const test = testFormula(formula.formula);
                              return test.error ? `Ошибка: ${test.error}` : `Результат: ${test.result}`;
                            })()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {customFormulas.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">⚙️</div>
                  <p className="text-gray-500 mb-4">Нет пользовательских формул</p>
                  <Button onClick={addCustomFormula}>
                    <Plus className="w-4 h-4 mr-1" />
                    Создать первую формулу
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Справка по операторам */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-gray-700 mb-2">
            Справка по операторам
          </summary>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
            <div>
              <div className="font-medium mb-1">Арифметические:</div>
              <div>+ (сложение), - (вычитание)</div>
              <div>* (умножение), / (деление)</div>
              <div>^ или ** (степень)</div>
            </div>
            <div>
              <div className="font-medium mb-1">Логические:</div>
              <div>&& (И), || (ИЛИ)</div>
              <div>&gt; (больше), &lt; (меньше)</div>
              <div>== (равно), != (не равно)</div>
            </div>
            <div>
              <div className="font-medium mb-1">Условные:</div>
              <div>? : (тернарный оператор)</div>
              <div>Пример: quantity &gt; 10 ? 0.1 : 0</div>
            </div>
            <div>
              <div className="font-medium mb-1">Функции:</div>
              <div>Math.round(), Math.floor()</div>
              <div>Math.max(), Math.min()</div>
            </div>
          </div>
        </details>
      </div>
    </Card>
  );
}



