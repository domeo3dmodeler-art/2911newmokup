'use client';

import React, { useState, useEffect } from 'react';
import { PropertiesPanelProps, BaseElement, Page, Spacing, Style } from '../types';
import { CategoryTreeSelector } from './CategoryTreeSelector';
import { ProductPropertiesSelector } from './ProductPropertiesSelector';
import { PropertyDisplaySettings } from './PropertyDisplaySettings';
import { CatalogSelector } from '../elements/CatalogSelector';
import { SimplifiedPropertyFilterPanel } from './SimplifiedPropertyFilterPanel';
import { extractUniquePropertyValues } from '@/lib/string-utils';
import { clientLogger } from '@/lib/logging/client-logger';

export function PropertiesPanel({ element, page, onUpdateElement, onUpdatePage }: PropertiesPanelProps) {
  clientLogger.debug('🚨 PropertiesPanel: Рендер!', {
    elementType: element?.type,
    elementId: element?.id,
    elementProps: element?.props
  });
  
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'layout' | 'page'>('content');
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });

  // Загрузка категорий каталога
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch('/api/catalog/categories/tree');
        if (response.ok) {
          const responseData = await response.json();
          // API возвращает {success: true, data: {categories: [...]}}
          const data = responseData.data || responseData;
          setCategories(data.categories || []);
        }
      } catch (error) {
        clientLogger.error('Error loading categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Загрузка свойств для выбранных категорий
  useEffect(() => {
    const loadProperties = async () => {
      clientLogger.debug('PropertiesPanel: Загрузка свойств для категорий:', element?.props?.categoryIds);
      
      if (!element?.props?.categoryIds?.length) {
        clientLogger.debug('PropertiesPanel: Нет категорий, очищаем свойства');
        setAvailableProperties([]);
        return;
      }

      try {
        clientLogger.debug('PropertiesPanel: Запрос к API /api/catalog/properties');
        const response = await fetch('/api/catalog/properties', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryIds: element.props.categoryIds })
        });
        
        if (response.ok) {
          const propertiesData = await response.json();
          const properties = propertiesData.properties || [];
          clientLogger.debug('PropertiesPanel: Загружены свойства:', properties.map(p => ({ id: p.id, name: p.name })));
          
          // Используем оптимизированный API для получения уникальных значений
          setLoadingProducts(true);
          setLoadingProgress({ current: 0, total: 100 });
          
          try {
            // ИСПРАВЛЕНИЕ: Не загружаем данные для всех свойств сразу
            // PropertyFilter будет загружать данные для конкретного выбранного свойства
            clientLogger.debug('PropertiesPanel: Пропускаем загрузку данных для всех свойств - PropertyFilter загрузит данные для выбранного свойства');
            
            // Преобразуем результат в формат, ожидаемый компонентом (без данных)
            const propertiesWithOptions = properties.map((property: any) => {
              clientLogger.debug(`Property "${property.name}": без загруженных значений (PropertyFilter загрузит)`);
              
              return {
                ...property,
                options: [] // Пустые опции, PropertyFilter загрузит данные
              };
            });
            
            setAvailableProperties(propertiesWithOptions);
            clientLogger.debug('PropertiesPanel: Установлены доступные свойства:', propertiesWithOptions.map(p => ({ id: p.id, name: p.name })));
            setLoadingProgress({ current: 100, total: 100 });
          } catch (error: any) {
            clientLogger.error('PropertiesPanel: Ошибка загрузки уникальных значений:', error);
            setAvailableProperties(properties);
            clientLogger.debug('PropertiesPanel: Установлены свойства без уникальных значений:', properties.map(p => ({ id: p.id, name: p.name })));
          } finally {
            setLoadingProducts(false);
          }
        }
      } catch (error) {
        clientLogger.error('Error loading properties:', error);
        setAvailableProperties([]);
      }
    };

    loadProperties();
  }, [element?.props?.categoryIds]);

  // Обработчики для элемента
  const handleElementPropChange = (key: string, value: any) => {
    if (!element) return;

    clientLogger.debug('🚨 PropertiesPanel: handleElementPropChange вызван!', {
      elementId: element.id,
      key,
      value,
      currentProps: element.props
    });

    const newProps = {
      ...element.props,
      [key]: value
    };

    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Если обновляем selectedPropertyIds, также устанавливаем propertyName
    if (key === 'selectedPropertyIds' && value?.length > 0 && availableProperties.length > 0) {
      const selectedProperty = availableProperties.find(p => p.id === value[0]);
      if (selectedProperty) {
        newProps.propertyName = selectedProperty.name;
        clientLogger.debug('🚨 PropertiesPanel: Устанавливаем propertyName:', selectedProperty.name);
      }
    }

    clientLogger.debug('🚨 PropertiesPanel: Создаем обновление!', {
      elementId: element.id,
      key,
      value,
      newProps,
      newPropsPropertyName: newProps.propertyName
    });

    onUpdateElement(element.id, {
      props: newProps
    });

    clientLogger.debug('🚨 PropertiesPanel: onUpdateElement вызван!', {
      elementId: element.id,
      updates: { props: newProps }
    });
  };

  const handleElementStyleChange = (key: keyof Style, value: any) => {
    if (!element) return;
    
    onUpdateElement(element.id, {
      style: {
        ...element.style,
        [key]: value
      }
    });
  };

  const handleElementPositionChange = (key: 'x' | 'y', value: number) => {
    if (!element) return;
    
    onUpdateElement(element.id, {
      position: {
        ...element.position,
        [key]: value
      }
    });
  };

  const handleElementSizeChange = (key: 'width' | 'height', value: number) => {
    if (!element) return;
    
    onUpdateElement(element.id, {
      size: {
        ...element.size,
        [key]: value
      }
    });
  };

  const handleSpacingChange = (spacingType: 'padding' | 'margin', key: keyof Spacing, value: number) => {
    if (!element) return;
    
    onUpdateElement(element.id, {
      style: {
        ...element.style,
        [spacingType]: {
          ...element.style[spacingType],
          [key]: value
        }
      }
    });
  };

  // Обработчики для страницы
  const handlePageSettingChange = (key: string, value: any) => {
    if (!page) return;
    
    onUpdatePage({
      settings: {
        ...page.settings,
        [key]: value
      }
    });
  };

  // Рендеринг вкладки содержимого
  const renderContentTab = () => {
    if (!element) return null;

    switch (element.type) {
      case 'propertyFilter':
        clientLogger.debug('🚨 PropertiesPanel: Рендерим propertyFilter с упрощенной панелью!', {
          elementType: element.type,
          elementId: element.id,
          elementProps: element.props,
          categoryIds: element.props.categoryIds,
          selectedPropertyIds: element.props.selectedPropertyIds
        });
        
        return (
          <SimplifiedPropertyFilterPanel
            element={element}
            onUpdateElement={onUpdateElement}
          />
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Содержимое
              </label>
              <textarea
                value={element.props.content || ''}
                onChange={(e) => handleElementPropChange('content', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Размер шрифта
              </label>
              <input
                type="number"
                value={element.props.fontSize || 16}
                onChange={(e) => handleElementPropChange('fontSize', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Цвет текста
              </label>
              <input
                type="color"
                value={element.props.color || '#1f2937'}
                onChange={(e) => handleElementPropChange('color', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 'heading':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Содержимое
              </label>
              <input
                type="text"
                value={element.props.content || ''}
                onChange={(e) => handleElementPropChange('content', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Уровень заголовка
              </label>
              <select
                value={element.props.level || 1}
                onChange={(e) => handleElementPropChange('level', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>H1</option>
                <option value={2}>H2</option>
                <option value={3}>H3</option>
                <option value={4}>H4</option>
                <option value={5}>H5</option>
                <option value={6}>H6</option>
              </select>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL изображения
              </label>
              <input
                type="url"
                value={element.props.src || ''}
                onChange={(e) => handleElementPropChange('src', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt текст
              </label>
              <input
                type="text"
                value={element.props.alt || ''}
                onChange={(e) => handleElementPropChange('alt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case 'button':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Текст кнопки
              </label>
              <input
                type="text"
                value={element.props.text || ''}
                onChange={(e) => handleElementPropChange('text', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Вариант
              </label>
              <select
                value={element.props.variant || 'primary'}
                onChange={(e) => handleElementPropChange('variant', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="primary">Основная</option>
                <option value="secondary">Вторичная</option>
                <option value="outline">Контурная</option>
              </select>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-4">⚙️</div>
            <p>Настройки для этого элемента недоступны</p>
          </div>
        );
    }
  };

  // Рендеринг вкладки стилей
  const renderStyleTab = () => {
    if (!element) return null;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Фоновый цвет
          </label>
          <input
            type="color"
            value={element.style.backgroundColor || '#ffffff'}
            onChange={(e) => handleElementStyleChange('backgroundColor', e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Цвет текста
          </label>
          <input
            type="color"
            value={element.style.color || '#000000'}
            onChange={(e) => handleElementStyleChange('color', e.target.value)}
            className="w-full h-10 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Размер шрифта
          </label>
          <input
            type="number"
            value={element.style.fontSize || 16}
            onChange={(e) => handleElementStyleChange('fontSize', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    );
  };

  // Рендеринг вкладки макета
  const renderLayoutTab = () => {
    if (!element) return null;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Позиция X
          </label>
          <input
            type="number"
            value={element.position.x || 0}
            onChange={(e) => handleElementPositionChange('x', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Позиция Y
          </label>
          <input
            type="number"
            value={element.position.y || 0}
            onChange={(e) => handleElementPositionChange('y', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ширина
          </label>
          <input
            type="number"
            value={element.size.width || 200}
            onChange={(e) => handleElementSizeChange('width', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Высота
          </label>
          <input
            type="number"
            value={element.size.height || 100}
            onChange={(e) => handleElementSizeChange('height', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    );
  };

  // Рендеринг вкладки страницы
  const renderPageTab = () => {
    if (!page) return null;

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название страницы
          </label>
          <input
            type="text"
            value={page.title || ''}
            onChange={(e) => handlePageSettingChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Описание страницы
          </label>
          <textarea
            value={page.description || ''}
            onChange={(e) => handlePageSettingChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>
      </div>
    );
  };

  if (!element && !page) {
    return (
      <div className="text-center text-gray-500 py-8">
        <div className="text-4xl mb-4">📝</div>
        <p>Выберите элемент для редактирования</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Вкладки */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('content')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'content'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Контент
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'style'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Стили
        </button>
        <button
          onClick={() => setActiveTab('layout')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'layout'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Макет
        </button>
        <button
          onClick={() => setActiveTab('page')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'page'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Страница
        </button>
      </div>

      {/* Содержимое вкладок */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'content' && renderContentTab()}
        {activeTab === 'style' && renderStyleTab()}
        {activeTab === 'layout' && renderLayoutTab()}
        {activeTab === 'page' && renderPageTab()}
      </div>
    </div>
  );
}