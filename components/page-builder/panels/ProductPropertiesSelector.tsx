'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { clientLogger } from '@/lib/logging/client-logger';

interface ProductProperty {
  id: string;
  name: string;
  type: string;
  description?: string;
  options?: any;
  is_required: boolean;
  categories: Array<{
    id: string;
    name: string;
    is_required: boolean;
    is_for_calculator: boolean;
    is_for_export: boolean;
  }>;
}

interface ProductPropertiesSelectorProps {
  categoryIds: string[];
  selectedPropertyIds: string[];
  onPropertiesChange: (propertyIds: string[]) => void;
}

export function ProductPropertiesSelector({ 
  categoryIds, 
  selectedPropertyIds, 
  onPropertiesChange 
}: ProductPropertiesSelectorProps) {
  const [properties, setProperties] = useState<ProductProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Загрузка свойств товаров
  const loadProperties = useCallback(async () => {
      if (!categoryIds?.length) {
        clientLogger.debug('🚨 ProductPropertiesSelector: Нет categoryIds, очищаем свойства');
        setProperties([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch('/api/catalog/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryIds })
        });
        
        if (response.ok) {
          const data = await response.json();
          const newProperties = data.properties || [];
          
          clientLogger.debug('🚨 ProductPropertiesSelector: Загружены свойства', {
            newPropertiesCount: newProperties.length,
            selectedPropertyIdsCount: selectedPropertyIds.length,
            selectedPropertyIds,
            firstProperty: newProperties[0]?.name
          });
          
          setProperties(newProperties);
          
          // Автоматически выбираем первое свойство, если ничего не выбрано
          if (newProperties.length > 0 && selectedPropertyIds.length === 0) {
            const firstProperty = newProperties[0];
            clientLogger.debug('🚨 ProductPropertiesSelector: Автоматически выбираем первое свойство:', firstProperty.name);
            onPropertiesChange([firstProperty.id]);
          } else {
            clientLogger.debug('🚨 ProductPropertiesSelector: Автоматический выбор НЕ выполнен', {
              hasProperties: newProperties.length > 0,
              hasSelected: selectedPropertyIds.length > 0
            });
          }
        }
      } catch (error) {
        clientLogger.error('Error loading properties:', error);
      } finally {
        setLoading(false);
      }
  }, [categoryIds, selectedPropertyIds, onPropertiesChange]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Фильтрация свойств по поисковому запросу
  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleProperty = (propertyId: string) => {
    const newSelected = selectedPropertyIds.includes(propertyId)
      ? selectedPropertyIds.filter(id => id !== propertyId)
      : [...selectedPropertyIds, propertyId];
    
    clientLogger.debug('🚨 ProductPropertiesSelector: toggleProperty вызван!', {
      propertyId,
      newSelected,
      categoryIds
    });
    
    onPropertiesChange(newSelected);
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'number': return '🔢';
      case 'decimal': return '💰';
      case 'boolean': return '✅';
      case 'select': return '📋';
      case 'multiselect': return '📑';
      case 'color': return '🎨';
      case 'date': return '📅';
      case 'file': return '📎';
      default: return '⚙️';
    }
  };

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'Текст';
      case 'number': return 'Число';
      case 'decimal': return 'Десятичное';
      case 'boolean': return 'Да/Нет';
      case 'select': return 'Список';
      case 'multiselect': return 'Множественный';
      case 'color': return 'Цвет';
      case 'date': return 'Дата';
      case 'file': return 'Файл';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
        <div className="text-sm text-gray-500">Загрузка свойств...</div>
      </div>
    );
  }

  if (!categoryIds?.length) {
    return (
      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
        <div className="text-sm text-gray-500">Сначала выберите категории товаров</div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
      {/* Заголовок и поиск */}
      <div className="p-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Свойства товаров</h3>
          {selectedPropertyIds.length > 0 && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              {selectedPropertyIds.length} выбрано
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск свойств..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pl-9 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Список свойств */}
      <div className="p-1 overflow-y-auto max-h-48">
        {filteredProperties.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-gray-500">
              {searchTerm ? 'Свойства не найдены' : 'Нет доступных свойств'}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredProperties.map(property => (
              <div
                key={property.id}
                className={`group flex items-start py-3 px-3 hover:bg-gray-50 cursor-pointer rounded-md text-sm transition-colors ${
                  selectedPropertyIds.includes(property.id) 
                    ? 'bg-green-50 border border-green-200' 
                    : 'hover:text-gray-900'
                }`}
                onClick={() => toggleProperty(property.id)}
              >
                {/* Чекбокс */}
                <div className="flex-shrink-0 mr-3 mt-0.5">
                  <input
                    type="checkbox"
                    checked={selectedPropertyIds.includes(property.id)}
                    onChange={() => toggleProperty(property.id)}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Иконка типа */}
                <div className="flex-shrink-0 mr-3">
                  <span className="text-lg" title={getPropertyTypeLabel(property.type)}>
                    {getPropertyTypeIcon(property.type)}
                  </span>
                </div>

                {/* Информация о свойстве */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 truncate">
                      {property.name}
                    </span>
                    <span className="flex-shrink-0 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full ml-2">
                      {getPropertyTypeLabel(property.type)}
                    </span>
                  </div>
                  
                  {property.description && (
                    <div className="text-xs text-gray-600 mt-1 truncate">
                      {property.description}
                    </div>
                  )}

                  {/* Индикаторы использования */}
                  <div className="flex items-center mt-2 space-x-1 flex-wrap">
                    {property.categories.some(cat => cat.is_for_calculator) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                        Калькулятор
                      </span>
                    )}
                    {property.categories.some(cat => cat.is_for_export) && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                        Экспорт
                      </span>
                    )}
                    {property.is_required && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">
                        Обязательное
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Статистика и действия */}
      {selectedPropertyIds.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">
                Выбрано свойств: <span className="font-medium text-green-600">{selectedPropertyIds.length}</span>
              </span>
            </div>
            <button
              onClick={() => onPropertiesChange([])}
              className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
            >
              Очистить все
            </button>
          </div>
          
          {/* Предварительный просмотр выбранных свойств */}
          <div className="space-y-2">
            <div className="text-sm text-gray-600 font-medium">Выбранные свойства:</div>
            <div className="max-h-20 overflow-y-auto space-y-1">
              {selectedPropertyIds.slice(0, 5).map((propertyId, index) => {
                const property = properties.find(p => p.id === propertyId);
                return property ? (
                  <div key={propertyId} className="flex items-center text-sm text-gray-700">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                      {index + 1}
                    </span>
                    <span className="truncate">{property.name}</span>
                  </div>
                ) : null;
              })}
              {selectedPropertyIds.length > 5 && (
                <div className="text-sm text-gray-500 italic">
                  ... и еще {selectedPropertyIds.length - 5} свойств
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Сообщение если ничего не выбрано */}
      {selectedPropertyIds.length === 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <div className="text-center">
            <svg className="w-6 h-6 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-gray-500">
              Выберите свойства для отображения в товарах
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
