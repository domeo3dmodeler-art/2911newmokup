'use client';

import React, { useState, useEffect } from 'react';

interface PropertyDisplayOption {
  id: string;
  name: string;
  type: 'input' | 'chips' | 'dropdown' | 'radio' | 'checkbox' | 'range' | 'color';
  description: string;
  icon: string;
}

interface PropertyDisplaySettings {
  propertyId: string;
  displayType: string;
  options?: any;
}

interface Property {
  id: string;
  name: string;
  type: string;
  options?: any[];
}

interface PropertyDisplaySettingsProps {
  selectedPropertyIds: string[];
  propertyDisplaySettings: Record<string, PropertyDisplaySettings>;
  onSettingsChange: (settings: Record<string, PropertyDisplaySettings>) => void;
  availableProperties?: Property[];
}

const displayTypes: PropertyDisplayOption[] = [
  {
    id: 'input',
    name: 'Поле ввода',
    type: 'input',
    description: 'Текстовое поле для поиска',
    icon: '📝'
  },
  {
    id: 'chips',
    name: 'Плашки',
    type: 'chips',
    description: 'Круглые кнопки с вариантами',
    icon: '🏷️'
  },
  {
    id: 'dropdown',
    name: 'Выпадающий список',
    type: 'dropdown',
    description: 'Список с выбором одного варианта',
    icon: '📋'
  },
  {
    id: 'radio',
    name: 'Радиокнопки',
    type: 'radio',
    description: 'Круглые переключатели',
    icon: '🔘'
  },
  {
    id: 'checkbox',
    name: 'Чекбоксы',
    type: 'checkbox',
    description: 'Квадратные переключатели',
    icon: '☑️'
  },
  {
    id: 'range',
    name: 'Диапазон',
    type: 'range',
    description: 'Слайдер для числовых значений',
    icon: '🎚️'
  },
  {
    id: 'color',
    name: 'Цветовые палитры',
    type: 'color',
    description: 'Квадраты с цветами',
    icon: '🎨'
  }
];

export function PropertyDisplaySettings({ 
  selectedPropertyIds, 
  propertyDisplaySettings, 
  onSettingsChange,
  availableProperties = []
}: PropertyDisplaySettingsProps) {
  const [localSettings, setLocalSettings] = useState<Record<string, PropertyDisplaySettings>>(propertyDisplaySettings || {});

  // Получение названия свойства
  const getPropertyName = (propertyId: string) => {
    const property = availableProperties.find(p => p.id === propertyId);
    return property?.name || propertyId;
  };

  // Рендер предварительного просмотра
  const renderPreview = (property: any, setting: PropertyDisplaySettings) => {
    const displayType = displayTypes.find(t => t.id === setting.displayType);
    
    switch (setting.displayType) {
      case 'input':
        return (
          <input
            type="text"
            placeholder={`Поиск по ${property.name.toLowerCase()}...`}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            disabled
          />
        );
      
      case 'chips':
        return (
          <div className="flex flex-wrap gap-1">
            {property.options?.length > 0 ? (
              <>
                {property.options.slice(0, 3).map((option: any, index: number) => (
                  <div
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {option.label || option.value}
                  </div>
                ))}
                {property.options.length > 3 && (
                  <div className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    +{property.options.length - 3}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-gray-500 italic">
                Нет доступных значений
              </div>
            )}
          </div>
        );
      
      case 'dropdown':
        return (
          <select className="w-full px-2 py-1 text-xs border border-gray-300 rounded" disabled>
            <option>Все варианты</option>
            {property.options?.slice(0, 2).map((option: any) => (
              <option key={option.value}>{option.label}</option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div className="space-y-1">
            {property.options?.slice(0, 2).map((option: any) => (
              <label key={option.value} className="flex items-center text-xs">
                <input type="radio" className="mr-1" disabled />
                {option.label}
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-1">
            {property.options?.slice(0, 2).map((option: any) => (
              <label key={option.value} className="flex items-center text-xs">
                <input type="checkbox" className="mr-1" disabled />
                {option.label}
              </label>
            ))}
          </div>
        );
      
      case 'range':
        return (
          <div className="space-y-1">
            <input
              type="number"
              placeholder="От"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              disabled
            />
            <input
              type="number"
              placeholder="До"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              disabled
            />
          </div>
        );
      
      case 'color':
        return (
          <div className="flex gap-1">
            {['#ff0000', '#00ff00', '#0000ff'].map((color, index) => (
              <div
                key={index}
                className="w-4 h-4 border border-gray-300 rounded"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        );
      
      default:
        return <div className="text-xs text-gray-500">Неизвестный тип</div>;
    }
  };

  // Инициализация настроек для новых свойств
  useEffect(() => {
    const newSettings = { ...localSettings };
    let hasChanges = false;

    selectedPropertyIds.forEach(propertyId => {
      if (!newSettings[propertyId]) {
        newSettings[propertyId] = {
          propertyId,
          displayType: 'input', // по умолчанию
          options: {}
        };
        hasChanges = true;
      }
    });

    // Удаляем настройки для невыбранных свойств
    Object.keys(newSettings).forEach(propertyId => {
      if (!selectedPropertyIds.includes(propertyId)) {
        delete newSettings[propertyId];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setLocalSettings(newSettings);
      onSettingsChange(newSettings);
    }
  }, [selectedPropertyIds]);

  const updatePropertySetting = (propertyId: string, field: string, value: any) => {
    const newSettings = {
      ...localSettings,
      [propertyId]: {
        ...localSettings[propertyId],
        [field]: value
      }
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  if (selectedPropertyIds.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">⚙️</div>
          <div className="text-sm">Выберите свойства для настройки отображения</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Настройка отображения свойств
        </h3>
        <div className="text-xs text-gray-500">
          {selectedPropertyIds.length} свойств выбрано
        </div>
      </div>

      {selectedPropertyIds.map(propertyId => (
        <div key={propertyId} className="border border-gray-200 rounded-lg p-3 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-900">
                {getPropertyName(propertyId)}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {displayTypes.find(t => t.id === localSettings[propertyId]?.displayType)?.name || 'Не настроено'}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {displayTypes.slice(0, 4).map(type => (
              <button
                key={type.id}
                onClick={() => updatePropertySetting(propertyId, 'displayType', type.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  localSettings[propertyId]?.displayType === type.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <span className="text-lg mr-2">{type.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{type.name}</div>
                    <div className="text-xs text-gray-600">{type.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Дополнительные настройки в зависимости от типа */}
          {localSettings[propertyId]?.displayType === 'chips' && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Максимум выбранных плашек
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={localSettings[propertyId]?.options?.maxSelected || 1}
                onChange={(e) => updatePropertySetting(propertyId, 'options', {
                  ...localSettings[propertyId]?.options,
                  maxSelected: parseInt(e.target.value) || 1
                })}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {localSettings[propertyId]?.displayType === 'range' && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Мин. значение
                  </label>
                  <input
                    type="number"
                    value={localSettings[propertyId]?.options?.min || 0}
                    onChange={(e) => updatePropertySetting(propertyId, 'options', {
                      ...localSettings[propertyId]?.options,
                      min: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Макс. значение
                  </label>
                  <input
                    type="number"
                    value={localSettings[propertyId]?.options?.max || 100}
                    onChange={(e) => updatePropertySetting(propertyId, 'options', {
                      ...localSettings[propertyId]?.options,
                      max: parseInt(e.target.value) || 100
                    })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Предварительный просмотр */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-xs font-medium text-gray-700 mb-3">Предварительный просмотр:</div>
        <div className="space-y-3">
          {selectedPropertyIds.slice(0, 2).map(propertyId => {
            const setting = localSettings[propertyId];
            const property = availableProperties.find(p => p.id === propertyId);
            if (!setting || !property) return null;

            return (
              <div key={propertyId} className="bg-white border border-gray-200 rounded p-2">
                <div className="text-xs font-medium text-gray-900 mb-2">{property.name}</div>
                {renderPreview(property, setting)}
              </div>
            );
          })}
          {selectedPropertyIds.length > 2 && (
            <div className="text-xs text-gray-500 text-center py-2">
              и еще {selectedPropertyIds.length - 2} свойств...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

