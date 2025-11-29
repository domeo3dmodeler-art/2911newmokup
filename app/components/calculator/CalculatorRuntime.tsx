'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FormulaEngine, Variable, Formula } from '@/lib/calculator/FormulaEngine';
import { Calculator, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface CalculatorRuntimeProps {
  config: any; // Конфигурация калькулятора
  onResult?: (results: any) => void;
  className?: string;
}

export default function CalculatorRuntime({ 
  config, 
  onResult,
  className = '' 
}: CalculatorRuntimeProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCalculating, setIsCalculating] = useState(false);

  // Инициализируем движок формул
  const formulaEngine = useMemo(() => new FormulaEngine(), []);

  // Инициализация переменных и формул
  useEffect(() => {
    if (!config) return;

    try {
      // Добавляем переменные
      config.variables?.forEach((variable: any) => {
        const engineVariable: Variable = {
          id: variable.id,
          name: variable.name,
          type: variable.type,
          value: variable.defaultValue,
          source: 'input'
        };
        formulaEngine.addVariable(engineVariable);
        
        // Устанавливаем начальные значения
        if (variable.defaultValue !== undefined) {
          setValues(prev => ({ ...prev, [variable.id]: variable.defaultValue }));
        }
      });

      // Добавляем формулы
      config.formulas?.forEach((formula: any) => {
        const engineFormula: Formula = {
          id: formula.id,
          name: formula.name,
          expression: formula.expression,
          variables: formula.variables || [],
          resultType: 'number'
        };
        formulaEngine.addFormula(engineFormula);
      });

      // Добавляем формулы из элементов
      config.elements?.forEach((element: any) => {
        if (element.type === 'formula' && element.config.formula) {
          const engineFormula: Formula = {
            id: element.id,
            name: element.name,
            expression: element.config.formula,
            variables: element.config.variables || [],
            resultType: 'number'
          };
          formulaEngine.addFormula(engineFormula);
        }
      });

    } catch (error) {
      clientLogger.error('Ошибка инициализации калькулятора:', error);
    }
  }, [config, formulaEngine]);

  // Пересчет всех формул
  const recalculate = useCallback(async () => {
    setIsCalculating(true);
    
    try {
      const newResults: Record<string, any> = {};
      
      // Вычисляем все формулы
      for (const formula of formulaEngine.getFormulas()) {
        try {
          const result = formulaEngine.calculate(formula.id);
          newResults[formula.id] = result;
        } catch (error) {
          clientLogger.error(`Ошибка вычисления формулы ${formula.id}:`, error);
          newResults[formula.id] = 'Ошибка';
        }
      }
      
      // Вычисляем формулы элементов
      config.elements?.forEach((element: any) => {
        if (element.type === 'formula' && element.config.formula) {
          try {
            const result = formulaEngine.calculate(element.id);
            newResults[element.id] = result;
          } catch (error) {
            clientLogger.error(`Ошибка вычисления элемента ${element.id}:`, error);
            newResults[element.id] = 'Ошибка';
          }
        }
      });
      
      setResults(newResults);
      
      // Вызываем callback с результатами
      if (onResult) {
        onResult(newResults);
      }
      
    } catch (error) {
      clientLogger.error('Ошибка пересчета:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [formulaEngine, config, onResult]);

  // Обновление значения переменной
  const updateValue = useCallback((elementId: string, value: any) => {
    setValues(prev => ({ ...prev, [elementId]: value }));
    
    try {
      // Обновляем значение в движке формул
      formulaEngine.setVariable(elementId, value);
      
      // Очищаем ошибку для этого поля
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[elementId];
        return newErrors;
      });
      
      // Пересчитываем все формулы
      recalculate();
      
    } catch (error) {
      clientLogger.error('Ошибка обновления значения:', error);
      setErrors(prev => ({ 
        ...prev, 
        [elementId]: error instanceof Error ? error.message : 'Ошибка валидации'
      }));
    }
  }, [formulaEngine, recalculate]);

  // Рендер элемента
  const renderElement = useCallback((element: any) => {
    const value = values[element.id];
    const result = results[element.id];
    const error = errors[element.id];
    
    const baseStyle = {
      ...element.styles,
      width: element.size.width,
      height: element.size.height
    };

    switch (element.type) {
      case 'input':
        return (
          <div key={element.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {element.label}
              {element.config.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={element.config.inputType || 'text'}
              value={value || ''}
              onChange={(e) => {
                const newValue = element.config.inputType === 'number' 
                  ? parseFloat(e.target.value) || 0
                  : e.target.value;
                updateValue(element.id, newValue);
              }}
              placeholder={element.config.placeholder}
              min={element.config.min}
              max={element.config.max}
              step={element.config.step}
              disabled={element.config.disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              style={baseStyle}
            />
            {error && (
              <div className="flex items-center mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                {error}
              </div>
            )}
            {element.config.helpText && (
              <p className="mt-1 text-sm text-gray-500">{element.config.helpText}</p>
            )}
          </div>
        );

      case 'slider':
        return (
          <div key={element.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {element.label}: <span className="font-normal">{value || element.config.min || 0}</span>
            </label>
            <input
              type="range"
              value={value || element.config.min || 0}
              onChange={(e) => updateValue(element.id, parseFloat(e.target.value))}
              min={element.config.min || 0}
              max={element.config.max || 100}
              step={element.config.step || 1}
              disabled={element.config.disabled}
              className="w-full"
              style={baseStyle}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{element.config.min || 0}</span>
              <span>{element.config.max || 100}</span>
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={element.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {element.label}
              {element.config.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <select
              value={value || ''}
              onChange={(e) => updateValue(element.id, e.target.value)}
              disabled={element.config.disabled}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
              style={baseStyle}
            >
              <option value="">Выберите...</option>
              {element.config.options?.map((option: any, index: number) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && (
              <div className="flex items-center mt-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-1" />
                {error}
              </div>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={element.id} className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => updateValue(element.id, e.target.checked)}
                disabled={element.config.disabled}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                {element.label}
              </span>
            </label>
          </div>
        );

      case 'output':
      case 'formula':
        return (
          <div key={element.id} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {element.label}
            </label>
            <div 
              className={`px-3 py-2 bg-gray-50 border border-gray-300 rounded-md flex items-center ${
                isCalculating ? 'animate-pulse' : ''
              }`}
              style={baseStyle}
            >
              {isCalculating ? (
                <Loader className="w-4 h-4 mr-2 animate-spin text-blue-500" />
              ) : result !== undefined ? (
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              ) : null}
              
              <span className="font-medium">
                {isCalculating ? 'Вычисление...' : (
                  result !== undefined ? formatResult(result) : '—'
                )}
              </span>
            </div>
          </div>
        );

      case 'text':
        return (
          <div key={element.id} className="mb-4" style={baseStyle}>
            <div 
              className="text-gray-900"
              style={{ 
                fontSize: element.styles.fontSize,
                fontWeight: element.styles.fontWeight,
                color: element.styles.textColor 
              }}
            >
              {element.label}
            </div>
          </div>
        );

      case 'button':
        return (
          <button
            key={element.id}
            onClick={() => {
              // Выполняем действие кнопки
              if (element.config.onClick) {
                try {
                  // Безопасное выполнение JavaScript кода
                  new Function('values', 'results', 'updateValue', element.config.onClick)(
                    values, results, updateValue
                  );
                } catch (error) {
                  clientLogger.error('Ошибка выполнения действия кнопки:', error);
                }
              }
            }}
            disabled={element.config.disabled}
            className="px-4 py-2 rounded-md font-medium transition-colors hover:opacity-90 disabled:opacity-50"
            style={{
              ...baseStyle,
              backgroundColor: element.styles.backgroundColor,
              color: element.styles.textColor
            }}
          >
            {element.label}
          </button>
        );

      default:
        return (
          <div key={element.id} className="mb-4 p-3 border border-gray-200 rounded-md">
            <span className="text-gray-500">
              Неподдерживаемый тип элемента: {element.type}
            </span>
          </div>
        );
    }
  }, [values, results, errors, isCalculating, updateValue]);

  // Форматирование результата
  const formatResult = (value: any): string => {
    if (typeof value === 'number') {
      return value.toLocaleString('ru-RU', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
      });
    }
    return String(value);
  };

  if (!config) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <p>Конфигурация калькулятора не найдена</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {/* Заголовок */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {config.name}
        </h2>
        {config.description && (
          <p className="text-gray-600">{config.description}</p>
        )}
      </div>

      {/* Элементы калькулятора */}
      <div className="space-y-4">
        {config.elements
          ?.filter((element: any) => element.config.visible !== false)
          ?.sort((a: any, b: any) => a.position.y - b.position.y)
          ?.map(renderElement)}
      </div>

      {/* Индикатор вычислений */}
      {isCalculating && (
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center text-blue-700">
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            <span className="text-sm">Выполняются вычисления...</span>
          </div>
        </div>
      )}
    </div>
  );
}
