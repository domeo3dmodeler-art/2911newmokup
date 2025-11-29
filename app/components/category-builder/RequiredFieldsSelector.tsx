'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Checkbox, Select } from '../ui';

interface RequiredField {
  fieldName: string;
  displayName: string;
  isRequired: boolean;
  isForFiltering: boolean;
  isForCard: boolean;
  dataType: 'text' | 'number' | 'select' | 'boolean' | 'image';
  options?: string[];
}

interface RequiredFieldsSelectorProps {
  priceListHeaders: string[];
  priceListData: any[][];
  onFieldsConfigured: (fields: RequiredField[]) => void;
  onBack: () => void;
  catalogCategoryId?: string;
  categoryName?: string;
}

export default function RequiredFieldsSelector({
  priceListHeaders,
  priceListData,
  onFieldsConfigured,
  onBack,
  catalogCategoryId,
  categoryName
}: RequiredFieldsSelectorProps) {
  const [fields, setFields] = useState<RequiredField[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);

  useEffect(() => {
    // Инициализация полей
    const initialFields: RequiredField[] = priceListHeaders.map(header => ({
      fieldName: header,
      displayName: header,
      isRequired: false,
      isForFiltering: false,
      isForCard: false,
      dataType: detectDataType(header, priceListData),
      options: detectOptions(header, priceListData)
    }));
    setFields(initialFields);
  }, [priceListHeaders, priceListData, detectDataType, detectOptions]);

  const detectDataType = useCallback((fieldName: string, data: any[][]): RequiredField['dataType'] => {
    const fieldIndex = priceListHeaders.indexOf(fieldName);
    if (fieldIndex === -1) return 'text';

    const fieldNameLower = fieldName.toLowerCase();
    
    // Определяем тип по названию поля
    if (fieldNameLower.includes('фото') || fieldNameLower.includes('изображение') || fieldNameLower.includes('картинка')) {
      return 'image';
    }
    if (fieldNameLower.includes('цена') || fieldNameLower.includes('стоимость') || fieldNameLower.includes('руб')) {
      return 'number';
    }
    if (fieldNameLower.includes('количество') || fieldNameLower.includes('шт') || fieldNameLower.includes('штук')) {
      return 'number';
    }
    if (fieldNameLower.includes('да') || fieldNameLower.includes('нет') || fieldNameLower.includes('есть')) {
      return 'boolean';
    }
    
    // Определяем тип по данным
    const sampleValues = data
      .map(row => row[fieldIndex])
      .filter(val => val !== null && val !== undefined && val !== '')
      .map(val => String(val).trim());
    
    if (sampleValues.length === 0) return 'text';
    
    // Проверяем, являются ли все значения числами
    const isNumeric = sampleValues.every(val => {
      const num = Number(val);
      return !isNaN(num) && val !== '' && val !== '0' && num !== 0;
    });
    
    if (isNumeric && sampleValues.length > 0) return 'number';
    
    // Проверяем, подходит ли для select (ограниченное количество уникальных значений)
    const uniqueValues = [...new Set(sampleValues)];
    const totalValues = sampleValues.length;
    const uniqueRatio = uniqueValues.length / totalValues;
    
    // Если уникальных значений мало относительно общего количества, то это select
    if (uniqueValues.length <= 20 && uniqueRatio < 0.5 && totalValues > 5) {
      return 'select';
    }
    
    // Проверяем на boolean значения
    const booleanValues = ['да', 'нет', 'true', 'false', '1', '0', 'есть', 'нет', 'в наличии', 'под заказ'];
    const isBoolean = sampleValues.every(val => 
      booleanValues.includes(val.toLowerCase())
    );
    
    if (isBoolean && uniqueValues.length <= 3) return 'boolean';
    
    return 'text';
  }, [priceListHeaders]);

  const detectOptions = useCallback((fieldName: string, data: any[][]): string[] => {
    const fieldIndex = priceListHeaders.indexOf(fieldName);
    if (fieldIndex === -1) return [];

    const values = data
      .map(row => row[fieldIndex])
      .filter(val => val !== null && val !== undefined && val !== '')
      .map(val => String(val).trim());
    
    const uniqueValues = [...new Set(values)];
    return uniqueValues.slice(0, 20); // Увеличиваем лимит до 20 опций
  }, [priceListHeaders]);

  const updateField = (fieldName: string, updates: Partial<RequiredField>) => {
    setFields(prev => prev.map(field => 
      field.fieldName === fieldName ? { ...field, ...updates } : field
    ));
  };

  const toggleFieldSelection = (fieldName: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldName) 
        ? prev.filter(name => name !== fieldName)
        : [...prev, fieldName]
    );
  };

  const handleContinue = async () => {
    const configuredFields = fields.filter(field => selectedFields.includes(field.fieldName));
    
    // Создаем шаблон, если указана категория каталога
    if (catalogCategoryId && categoryName) {
      setIsCreatingTemplate(true);
      try {
        const requiredFields = configuredFields
          .filter(field => field.isRequired)
          .map(field => field.fieldName);
        
        const calculatorFields = configuredFields
          .filter(field => field.isForFiltering || field.isForCard)
          .map(field => field.fieldName);
        
        const exportFields = configuredFields
          .filter(field => field.isForCard)
          .map(field => field.fieldName);

        const templateData = {
          catalog_category_id: catalogCategoryId,
          name: `Шаблон для ${categoryName}`,
          required_fields: requiredFields,
          calculator_fields: calculatorFields,
          export_fields: exportFields
        };

        const response = await fetch('/api/catalog/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(templateData)
        });

        if (response.ok) {
          clientLogger.debug('Шаблон создан успешно');
          // Можно добавить уведомление пользователю
        } else {
          clientLogger.error('Ошибка создания шаблона');
        }
      } catch (error) {
        clientLogger.error('Ошибка при создании шаблона:', error);
      } finally {
        setIsCreatingTemplate(false);
      }
    }
    
    onFieldsConfigured(configuredFields);
  };

  const totalFields = priceListHeaders.length;
  const selectedCount = selectedFields.length;
  const requiredCount = fields.filter(f => f.isRequired).length;
  const filterCount = fields.filter(f => f.isForFiltering).length;

  return (
    <div className="space-y-6">
      {/* Заголовок и статистика */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-black">Настройка обязательных полей</h3>
          <p className="text-gray-600">Выберите поля из прайс-листа для конфигуратора</p>
        </div>
        <Button variant="outline" onClick={onBack}>
          ← Назад
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{totalFields}</div>
          <div className="text-sm text-gray-600">Всего полей</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{priceListData.length}</div>
          <div className="text-sm text-gray-600">Товаров</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{selectedCount}</div>
          <div className="text-sm text-blue-600">Выбрано</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{filterCount}</div>
          <div className="text-sm text-green-600">Фильтры</div>
        </div>
      </div>

      {/* Список полей */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-black mb-4">Поля из прайс-листа</h4>
        
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.fieldName} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                {/* Чекбокс выбора */}
                <div className="pt-1">
                  <Checkbox
                    checked={selectedFields.includes(field.fieldName)}
                    onChange={() => toggleFieldSelection(field.fieldName)}
                  />
                </div>

                {/* Информация о поле */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-600">
                        {field.dataType === 'number' ? '#' : 
                         field.dataType === 'select' ? '▼' : 
                         field.dataType === 'boolean' ? '☑' : 
                         field.dataType === 'image' ? '🖼' : '📝'}
                      </span>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{field.fieldName}</h5>
                      <p className="text-sm text-gray-500">Тип: {field.dataType}</p>
                    </div>
                  </div>

                  {/* Настройки поля */}
                  {selectedFields.includes(field.fieldName) && (
                    <div className="space-y-3 pl-11">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Отображаемое название
                        </label>
                        <input
                          type="text"
                          value={field.displayName}
                          onChange={(e) => updateField(field.fieldName, { displayName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Варианты выбора для select */}
                      {field.dataType === 'select' && field.options && field.options.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Варианты выбора ({field.options.length})
                          </label>
                          <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                            <div className="flex flex-wrap gap-1">
                              {field.options.map((option, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-white text-gray-700 rounded text-xs border"
                                  title={option}
                                >
                                  {option.length > 20 ? `${option.substring(0, 20)}...` : option}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Примеры данных для других типов */}
                      {field.dataType !== 'select' && field.options && field.options.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Примеры данных ({field.options.length})
                          </label>
                          <div className="max-h-20 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50">
                            <div className="flex flex-wrap gap-1">
                              {field.options.slice(0, 10).map((option, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-white text-gray-600 rounded text-xs border"
                                  title={String(option)}
                                >
                                  {String(option).length > 15 ? `${String(option).substring(0, 15)}...` : String(option)}
                                </span>
                              ))}
                              {field.options.length > 10 && (
                                <span className="px-2 py-1 bg-gray-200 text-gray-500 rounded text-xs">
                                  +{field.options.length - 10} еще
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Чекбоксы настроек */}
                      <div className="flex space-x-6">
                        <label className="flex items-center">
                          <Checkbox
                            checked={field.isRequired}
                            onChange={(e) => updateField(field.fieldName, { isRequired: e.target.checked })}
                          />
                          <span className="ml-2 text-sm text-gray-700">Обязательное</span>
                        </label>
                        <label className="flex items-center">
                          <Checkbox
                            checked={field.isForFiltering}
                            onChange={(e) => updateField(field.fieldName, { isForFiltering: e.target.checked })}
                          />
                          <span className="ml-2 text-sm text-gray-700">Для фильтрации</span>
                        </label>
                        <label className="flex items-center">
                          <Checkbox
                            checked={field.isForCard}
                            onChange={(e) => updateField(field.fieldName, { isForCard: e.target.checked })}
                          />
                          <span className="ml-2 text-sm text-gray-700">Показывать в карточке</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Кнопки действий */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Назад
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={selectedCount === 0 || isCreatingTemplate}
        >
          {isCreatingTemplate ? 'Создание шаблона...' : 'Продолжить →'}
        </Button>
      </div>
    </div>
  );
}
