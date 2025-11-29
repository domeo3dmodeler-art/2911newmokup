'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Checkbox, Select } from '../ui';

interface PropertyMapping {
  fieldName: string;
  displayName: string;
  dataType: 'text' | 'number' | 'select' | 'boolean' | 'image';
  isRequired: boolean;
  isFilterable: boolean;
  isVisible: boolean;
  options?: string[];
  unit?: string;
}

interface PropertyMapperProps {
  priceListHeaders: string[];
  priceListData: any[];
  onMappingComplete: (mapping: PropertyMapping[]) => void;
  onBack: () => void;
}

export default function PropertyMapper({ 
  priceListHeaders, 
  priceListData, 
  onMappingComplete, 
  onBack 
}: PropertyMapperProps) {
  const [mappings, setMappings] = useState<PropertyMapping[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  useEffect(() => {
    // Инициализация маппинга для всех заголовков
    const initialMappings: PropertyMapping[] = priceListHeaders.map(header => ({
      fieldName: header,
      displayName: header,
      dataType: detectDataType(header, priceListData),
      isRequired: false,
      isFilterable: false,
      isVisible: false,
      options: detectOptions(header, priceListData),
      unit: detectUnit(header)
    }));
    setMappings(initialMappings);
  }, [priceListHeaders, priceListData]);

  const detectDataType = (fieldName: string, data: any[]): PropertyMapping['dataType'] => {
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
    const sampleValues = data.slice(0, 10).map(row => row[fieldName]).filter(val => val !== null && val !== undefined);
    
    if (sampleValues.length === 0) return 'text';
    
    const isNumeric = sampleValues.every(val => !isNaN(Number(val)) && val !== '');
    if (isNumeric) return 'number';
    
    const uniqueValues = [...new Set(sampleValues)].length;
    if (uniqueValues <= 5 && sampleValues.length > 0) return 'select';
    
    return 'text';
  };

  const detectOptions = (fieldName: string, data: any[]): string[] => {
    const values = data.slice(0, 50).map(row => row[fieldName]).filter(val => val !== null && val !== undefined);
    return [...new Set(values)].slice(0, 10); // Максимум 10 опций
  };

  const detectUnit = (fieldName: string): string => {
    const fieldNameLower = fieldName.toLowerCase();
    
    if (fieldNameLower.includes('цена') || fieldNameLower.includes('стоимость')) return '₽';
    if (fieldNameLower.includes('размер') || fieldNameLower.includes('ширина') || fieldNameLower.includes('высота')) return 'мм';
    if (fieldNameLower.includes('вес')) return 'кг';
    if (fieldNameLower.includes('количество')) return 'шт';
    
    return '';
  };

  const updateMapping = (fieldName: string, updates: Partial<PropertyMapping>) => {
    setMappings(prev => prev.map(mapping => 
      mapping.fieldName === fieldName ? { ...mapping, ...updates } : mapping
    ));
  };

  const toggleFieldSelection = (fieldName: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldName) 
        ? prev.filter(f => f !== fieldName)
        : [...prev, fieldName]
    );
  };

  const handleComplete = () => {
    const activeMappings = mappings.filter(mapping => selectedFields.includes(mapping.fieldName));
    onMappingComplete(activeMappings);
  };

  const getDataTypeIcon = (type: PropertyMapping['dataType']) => {
    switch (type) {
      case 'text': return '📝';
      case 'number': return '🔢';
      case 'select': return '📋';
      case 'boolean': return '✅';
      case 'image': return '🖼️';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-black">Настройка свойств</h3>
          <p className="text-gray-600">Выберите поля из прайс-листа для конфигуратора</p>
        </div>
        <Button variant="secondary" onClick={onBack}>
          ← Назад
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-black">{priceListHeaders.length}</div>
          <div className="text-sm text-gray-600">Всего полей</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-black">{priceListData.length}</div>
          <div className="text-sm text-gray-600">Товаров</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-black">{selectedFields.length}</div>
          <div className="text-sm text-gray-600">Выбрано</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded">
          <div className="text-2xl font-bold text-black">
            {mappings.filter(m => m.isFilterable).length}
          </div>
          <div className="text-sm text-gray-600">Фильтры</div>
        </div>
      </div>

      {/* Список полей */}
      <Card variant="base">
        <div className="p-6">
          <h4 className="font-medium text-black mb-4">Поля из прайс-листа</h4>
          <div className="space-y-3">
            {mappings.map((mapping) => (
              <div key={mapping.fieldName} className="flex items-center space-x-4 p-3 border border-gray-200 rounded">
                <Checkbox
                  checked={selectedFields.includes(mapping.fieldName)}
                  onChange={() => toggleFieldSelection(mapping.fieldName)}
                />
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getDataTypeIcon(mapping.dataType)}</span>
                    <span className="font-medium text-black">{mapping.fieldName}</span>
                    {mapping.unit && (
                      <span className="text-sm text-gray-500">({mapping.unit})</span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Отображаемое название</label>
                      <input
                        type="text"
                        value={mapping.displayName}
                        onChange={(e) => updateMapping(mapping.fieldName, { displayName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="Название для пользователей"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Тип данных</label>
                      <Select
                        value={mapping.dataType}
                        onChange={(e) => updateMapping(mapping.fieldName, { dataType: e.target.value as PropertyMapping['dataType'] })}
                        options={[
                          { value: 'text', label: '📝 Текст' },
                          { value: 'number', label: '🔢 Число' },
                          { value: 'select', label: '📋 Список' },
                          { value: 'boolean', label: '✅ Да/Нет' },
                          { value: 'image', label: '🖼️ Изображение' }
                        ]}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  
                  {mapping.dataType === 'select' && mapping.options && (
                    <div className="mt-2">
                      <label className="block text-sm text-gray-600 mb-1">Варианты выбора</label>
                      <div className="flex flex-wrap gap-1">
                        {mapping.options.map((option, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex space-x-4 mt-3">
                    <label className="flex items-center">
                      <Checkbox
                        checked={mapping.isRequired}
                        onChange={(e) => updateMapping(mapping.fieldName, { isRequired: e.target.checked })}
                      />
                      <span className="ml-2 text-sm text-gray-600">Обязательное</span>
                    </label>
                    
                    <label className="flex items-center">
                      <Checkbox
                        checked={mapping.isFilterable}
                        onChange={(e) => updateMapping(mapping.fieldName, { isFilterable: e.target.checked })}
                      />
                      <span className="ml-2 text-sm text-gray-600">Для фильтрации</span>
                    </label>
                    
                    <label className="flex items-center">
                      <Checkbox
                        checked={mapping.isVisible}
                        onChange={(e) => updateMapping(mapping.fieldName, { isVisible: e.target.checked })}
                      />
                      <span className="ml-2 text-sm text-gray-600">Показывать в карточке</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Кнопки действий */}
      <div className="flex justify-between">
        <Button variant="secondary" onClick={onBack}>
          Отмена
        </Button>
        <Button 
          variant="primary" 
          onClick={handleComplete}
          disabled={selectedFields.length === 0}
        >
          Продолжить ({selectedFields.length} полей)
        </Button>
      </div>
    </div>
  );
}
