'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Checkbox, Input, Select } from '../ui';
import { Plus, Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';
import { clientLogger } from '@/lib/logging/client-logger';

interface PropertyField {
  id: string;
  name: string;
  displayName: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'date';
  isRequired: boolean;
  isVisible: boolean;
  isForCalculator: boolean;
  isForExport: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface PropertyMapperProps {
  showFields: string[];
  requiredFields: string[];
  layout: 'grid' | 'list';
  onFieldsChange: (fields: PropertyField[]) => void;
  onRequiredFieldsChange: (requiredFields: string[]) => void;
}

export default function PropertyMapper({
  showFields,
  requiredFields,
  layout,
  onFieldsChange,
  onRequiredFieldsChange
}: PropertyMapperProps) {
  const [properties, setProperties] = useState<PropertyField[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const loadProperties = useCallback(async () => {
    try {
      // Загружаем свойства из базы данных
      const response = await fetch('/api/admin/properties');
      const data = await response.json();
      
      if (data.success && data.properties) {
        const formattedProperties = data.properties.map((prop: any) => ({
          id: prop.id,
          name: prop.name,
          displayName: prop.name,
          type: prop.type || 'text',
          isRequired: requiredFields.includes(prop.name),
          isVisible: showFields.includes(prop.name),
          isForCalculator: false,
          isForExport: false,
          options: prop.options ? JSON.parse(prop.options) : undefined,
          defaultValue: prop.defaultValue
        }));
        setProperties(formattedProperties);
      } else {
        // Если API недоступен, создаем базовые свойства
        setProperties([
          {
            id: 'name',
            name: 'name',
            displayName: 'Название',
            type: 'text',
            isRequired: true,
            isVisible: true,
            isForCalculator: false,
            isForExport: true
          },
          {
            id: 'price',
            name: 'price',
            displayName: 'Цена',
            type: 'number',
            isRequired: true,
            isVisible: true,
            isForCalculator: true,
            isForExport: true,
            validation: { min: 0 }
          },
          {
            id: 'brand',
            name: 'brand',
            displayName: 'Бренд',
            type: 'text',
            isRequired: false,
            isVisible: true,
            isForCalculator: false,
            isForExport: true
          },
          {
            id: 'model',
            name: 'model',
            displayName: 'Модель',
            type: 'text',
            isRequired: false,
            isVisible: true,
            isForCalculator: false,
            isForExport: true
          },
          {
            id: 'description',
            name: 'description',
            displayName: 'Описание',
            type: 'text',
            isRequired: false,
            isVisible: false,
            isForCalculator: false,
            isForExport: false
          }
        ]);
      }
    } catch (error) {
      clientLogger.error('Ошибка при загрузке свойств:', error);
      // Используем базовые свойства при ошибке
      setProperties([
        {
          id: 'name',
          name: 'name',
          displayName: 'Название',
          type: 'text',
          isRequired: true,
          isVisible: true,
          isForCalculator: false,
          isForExport: true
        },
        {
          id: 'price',
          name: 'price',
          displayName: 'Цена',
          type: 'number',
          isRequired: true,
          isVisible: true,
          isForCalculator: true,
          isForExport: true,
          validation: { min: 0 }
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [requiredFields, showFields]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Обновление свойства
  const updateProperty = (id: string, updates: Partial<PropertyField>) => {
    setProperties(prev => prev.map(prop => 
      prop.id === id ? { ...prop, ...updates } : prop
    ));
  };

  // Добавление нового свойства
  const addProperty = () => {
    const newProperty: PropertyField = {
      id: `custom_${Date.now()}`,
      name: `field_${properties.length + 1}`,
      displayName: `Поле ${properties.length + 1}`,
      type: 'text',
      isRequired: false,
      isVisible: true,
      isForCalculator: false,
      isForExport: false
    };
    setProperties(prev => [...prev, newProperty]);
  };

  // Удаление свойства
  const removeProperty = (id: string) => {
    setProperties(prev => prev.filter(prop => prop.id !== id));
  };

  // Переключение видимости
  const toggleVisibility = (id: string) => {
    updateProperty(id, { isVisible: !properties.find(p => p.id === id)?.isVisible });
  };

  // Переключение обязательности
  const toggleRequired = (id: string) => {
    const property = properties.find(p => p.id === id);
    if (property) {
      updateProperty(id, { isRequired: !property.isRequired });
    }
  };

  // Переключение использования в калькуляторе
  const toggleCalculator = (id: string) => {
    const property = properties.find(p => p.id === id);
    if (property) {
      updateProperty(id, { isForCalculator: !property.isForCalculator });
    }
  };

  // Переключение использования в экспорте
  const toggleExport = (id: string) => {
    const property = properties.find(p => p.id === id);
    if (property) {
      updateProperty(id, { isForExport: !property.isForExport });
    }
  };

  // Сохранение изменений
  useEffect(() => {
    const visibleFields = properties.filter(p => p.isVisible).map(p => p.name);
    const requiredFieldsList = properties.filter(p => p.isRequired).map(p => p.name);
    
    onFieldsChange(properties);
    onRequiredFieldsChange(requiredFieldsList);
  }, [properties, onFieldsChange, onRequiredFieldsChange]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка свойств...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Настройка свойств товаров
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={addProperty}
          >
            <Plus className="w-4 h-4 mr-1" />
            Добавить поле
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Настройте отображение и использование свойств товаров в конфигураторе
        </p>
      </div>

      {/* Настройки макета */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Макет отображения</label>
            <Select
              value={layout}
              onChange={(value) => {
                // Здесь будет обновление layout через props
              }}
            >
              <option value="grid">Сетка</option>
              <option value="list">Список</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Список свойств */}
      <div className="p-4 overflow-y-auto" style={{ maxHeight: '400px' }}>
        <div className="space-y-3">
          {properties.map((property, index) => (
            <div
              key={property.id}
              className={`border border-gray-200 rounded-lg p-4 transition-all ${
                draggedItem === property.id ? 'opacity-50' : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* Ручка перетаскивания */}
                <div className="cursor-move text-gray-400">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Основная информация */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Input
                      value={property.displayName}
                      onChange={(e) => updateProperty(property.id, { displayName: e.target.value })}
                      className="font-medium"
                    />
                    <span className="text-sm text-gray-500">
                      ({property.name})
                    </span>
                  </div>

                  {/* Настройки типа */}
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Тип</label>
                      <Select
                        value={property.type}
                        onChange={(value) => updateProperty(property.id, { type: value as any })}
                      >
                        <option value="text">Текст</option>
                        <option value="number">Число</option>
                        <option value="select">Список</option>
                        <option value="boolean">Да/Нет</option>
                        <option value="date">Дата</option>
                      </Select>
                    </div>

                    {property.type === 'select' && (
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Варианты</label>
                        <Input
                          placeholder="Вариант1, Вариант2, Вариант3"
                          value={property.options?.join(', ') || ''}
                          onChange={(e) => updateProperty(property.id, { 
                            options: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                          })}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Кнопки действий */}
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-1">
                    <Button
                      variant={property.isVisible ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleVisibility(property.id)}
                      title={property.isVisible ? "Скрыть" : "Показать"}
                    >
                      {property.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeProperty(property.id)}
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Чекбоксы настроек */}
              <div className="flex items-center space-x-6 mt-3 pt-3 border-t border-gray-100">
                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={property.isRequired}
                    onChange={() => toggleRequired(property.id)}
                  />
                  <span className="text-sm text-gray-700">Обязательное</span>
                </label>

                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={property.isForCalculator}
                    onChange={() => toggleCalculator(property.id)}
                  />
                  <span className="text-sm text-gray-700">Для калькулятора</span>
                </label>

                <label className="flex items-center space-x-2">
                  <Checkbox
                    checked={property.isForExport}
                    onChange={() => toggleExport(property.id)}
                  />
                  <span className="text-sm text-gray-700">Для экспорта</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {properties.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">🏷️</div>
            <p className="text-gray-500 mb-4">Нет настроенных свойств</p>
            <Button onClick={addProperty}>
              <Plus className="w-4 h-4 mr-1" />
              Добавить первое свойство
            </Button>
          </div>
        )}
      </div>

      {/* Итоговая информация */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-gray-900">
              {properties.filter(p => p.isVisible).length}
            </div>
            <div className="text-gray-600">Видимых полей</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">
              {properties.filter(p => p.isRequired).length}
            </div>
            <div className="text-gray-600">Обязательных</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">
              {properties.filter(p => p.isForCalculator).length}
            </div>
            <div className="text-gray-600">Для калькулятора</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
