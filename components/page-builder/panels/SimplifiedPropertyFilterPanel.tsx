'use client';

import React, { useState, useEffect } from 'react';
import { clientLogger } from '@/lib/logging/client-logger';

interface Category {
  id: string;
  name: string;
  products_count: number;
  children?: Category[];
  subcategories?: Category[];
  parent_id?: string;
}

interface Property {
  id: string;
  name: string;
  type: string;
}

interface SimplifiedPropertyFilterPanelProps {
  element: any;
  onUpdateElement: (elementId: string, updates: any) => void;
}

interface DisplaySettings {
  showImages: boolean;
  showCounts: boolean;
  cardLayout: 'horizontal' | 'vertical';
  columns: number;
  showProductCards: boolean;
  maxProducts: number;
  customColumns: boolean;
  customProducts: boolean;
  customColumnsValue: number;
  customProductsValue: number;
  propertyCardImage: string;
  maxElements: number; // Максимальное количество элементов для отображения
  showAllElements: boolean; // Показывать все элементы
  individualImages: { [key: string]: string }; // Индивидуальные изображения для каждой опции
  // Настройки размера карточек
  autoSize: boolean; // Автоматический расчет размеров
  cardHeight: number; // Высота карточки в пикселях
  customCardHeight: boolean; // Использовать произвольную высоту
  individualCardHeights: { [key: string]: number }; // Индивидуальная высота для каждой карточки
  cardWidth: number; // Ширина карточки в пикселях
  customCardWidth: boolean; // Использовать произвольную ширину
  individualCardWidths: { [key: string]: number }; // Индивидуальная ширина для каждой карточки
  // Настройки заголовка и подписей
  componentTitle: string; // Заголовок компонента
  labelPosition: 'inside' | 'outside'; // Позиция подписи: внутри карточки или под карточкой
}

export function SimplifiedPropertyFilterPanel({ element, onUpdateElement }: SimplifiedPropertyFilterPanelProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyOptions, setPropertyOptions] = useState<any[]>([]); // Опции выбранного свойства
  const [loading, setLoading] = useState(false);
  // Определяем начальную вкладку: новый компонент - первая вкладка, существующий - отображение
  const getInitialStep = () => {
    // Если у компонента уже есть настройки, значит он существующий
    if (element.props.categoryIds && element.props.categoryIds.length > 0) {
      return 'display'; // Существующий компонент - начинаем с отображения
    }
    return 'categories'; // Новый компонент - начинаем с первой вкладки
  };

  const [step, setStep] = useState<'categories' | 'property' | 'display' | 'preview'>(getInitialStep());
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    showImages: true,
    showCounts: true,
    cardLayout: 'vertical',
    columns: 3,
    showProductCards: false, // По умолчанию выключено
    maxProducts: 12,
    customColumns: true, // КАРДИНАЛЬНОЕ ИСПРАВЛЕНИЕ: По умолчанию включено
    customProducts: false,
    customColumnsValue: 3,
    customProductsValue: 12,
    propertyCardImage: '',
    maxElements: 6, // По умолчанию показываем 6 элементов
    showAllElements: false, // По умолчанию ограничиваем количество
    individualImages: {}, // Индивидуальные изображения для каждой опции
    // Настройки размера карточек
    autoSize: true, // Автоматический расчет размеров по умолчанию
    cardHeight: 150, // Высота карточки по умолчанию
    customCardHeight: true, // Использовать произвольную высоту по умолчанию
    individualCardHeights: {}, // Индивидуальная высота для каждой карточки
    cardWidth: 200, // Ширина карточки по умолчанию
    customCardWidth: true, // Использовать произвольную ширину по умолчанию
    individualCardWidths: {}, // Индивидуальная ширина для каждой карточки
    // Настройки заголовка и подписей
    componentTitle: 'Фильтр свойств', // Заголовок компонента по умолчанию
    labelPosition: 'inside', // Подпись внутри карточки по умолчанию
    ...element.props.displaySettings
  });

  // Загрузка опций свойства
  useEffect(() => {
    const loadPropertyOptions = async () => {
      clientLogger.debug('🔧 SimplifiedPropertyFilterPanel: Проверяем условия для загрузки опций:', {
        propertyName: element.props.propertyName,
        categoryIds: element.props.categoryIds,
        categoryIdsLength: element.props.categoryIds?.length
      });

      if (!element.props.propertyName || !element.props.categoryIds || element.props.categoryIds.length === 0) {
        clientLogger.debug('🔧 SimplifiedPropertyFilterPanel: Условия не выполнены, очищаем опции');
        setPropertyOptions([]);
        return;
      }

      setLoading(true);
      try {
        clientLogger.debug('🔧 SimplifiedPropertyFilterPanel: Загружаем опции свойства:', {
          propertyName: element.props.propertyName,
          categoryIds: element.props.categoryIds
        });

        const response = await fetch('/api/catalog/properties/values-with-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propertyNames: [element.props.propertyName],
            categoryIds: element.props.categoryIds
          }),
        });

        if (response.ok) {
          const data = await response.json();
          clientLogger.debug('🔧 SimplifiedPropertyFilterPanel: Опции свойства загружены:', data);
          setPropertyOptions(data.values || []);
        } else {
          clientLogger.error('🔧 SimplifiedPropertyFilterPanel: Ошибка загрузки опций свойства:', response.status);
          setPropertyOptions([]);
        }
      } catch (error) {
        clientLogger.error('🔧 SimplifiedPropertyFilterPanel: Ошибка загрузки опций свойства:', error);
        setPropertyOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPropertyOptions();
  }, [element.props.propertyName, element.props.categoryIds]);

  // Загрузка категорий
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        clientLogger.debug('🌳 SimplifiedPropertyFilterPanel: Загружаем дерево категорий...');
        const response = await fetch('/api/catalog/categories');
        clientLogger.debug('🌳 SimplifiedPropertyFilterPanel: Ответ API:', response.status, response.ok);
        
        if (response.ok) {
          const data = await response.json();
          clientLogger.debug('🌳 SimplifiedPropertyFilterPanel: Данные API:', data);
          clientLogger.debug('🌳 SimplifiedPropertyFilterPanel: Категории:', data.categories);
          clientLogger.debug('🌳 SimplifiedPropertyFilterPanel: Количество категорий:', data.categories?.length || 0);
          
          setCategories(data.categories || []);
        } else {
          clientLogger.error('🌳 SimplifiedPropertyFilterPanel: Ошибка API:', response.status, response.statusText);
        }
      } catch (error) {
        clientLogger.error('🌳 SimplifiedPropertyFilterPanel: Ошибка загрузки категорий:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Функция для получения всех ID категорий (включая дочерние)
  const getAllCategoryIds = (categories: Category[], selectedIds: string[]): string[] => {
    const allIds = new Set<string>();
    
    const traverse = (cats: Category[]) => {
      cats.forEach(cat => {
        if (selectedIds.includes(cat.id)) {
          allIds.add(cat.id);
          // Добавляем все дочерние категории (может быть children или subcategories)
          const childCategories = cat.children || cat.subcategories || [];
          childCategories.forEach(child => {
            allIds.add(child.id);
            // Рекурсивно добавляем вложенные категории
            const nestedChildren = child.children || child.subcategories || [];
            if (nestedChildren.length > 0) {
              traverse(nestedChildren);
            }
          });
        }
        // Рекурсивно обходим все категории
        const childCategories = cat.children || cat.subcategories || [];
        if (childCategories.length > 0) {
          traverse(childCategories);
        }
      });
    };
    
    traverse(categories);
    return Array.from(allIds);
  };

  // Загрузка свойств для выбранных категорий
  useEffect(() => {
    const loadProperties = async () => {
      if (!element.props.categoryIds?.length) return;

      setLoading(true);
      try {
        // Получаем все ID категорий включая дочерние
        const allCategoryIds = getAllCategoryIds(categories, element.props.categoryIds);
        
        const query = new URLSearchParams();
        allCategoryIds.forEach((id: string) => {
          query.append('categoryIds', id);
        });

        const response = await fetch(`/api/catalog/properties?${query.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties || []);
        }
      } catch (error) {
        clientLogger.error('Ошибка загрузки свойств:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, [element.props.categoryIds, categories]);

  const handleCategorySelect = (categoryId: string) => {
    const currentIds = element.props.categoryIds || [];
    const newIds = currentIds.includes(categoryId)
      ? currentIds.filter((id: string) => id !== categoryId)
      : [...currentIds, categoryId];
    
    onUpdateElement(element.id, {
      props: { ...element.props, categoryIds: newIds }
    });
  };

  const handlePropertySelect = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      onUpdateElement(element.id, {
        props: { 
          ...element.props, 
          selectedPropertyIds: [propertyId],
          propertyName: property.name
        }
      });
      setStep('display'); // Переходим к настройке отображения
    }
  };

  const handleTitleChange = (title: string) => {
    onUpdateElement(element.id, {
      props: { ...element.props, title }
    });
  };

  const handleDisplaySettingsChange = (settings: Partial<DisplaySettings>) => {
    const newSettings = { ...displaySettings, ...settings };
    clientLogger.debug('🔧 SimplifiedPropertyFilterPanel: Обновляем настройки отображения:', {
      oldSettings: displaySettings,
      newSettings: newSettings,
      changedSettings: settings
    });
    setDisplaySettings(newSettings);
    onUpdateElement(element.id, {
      props: { 
        ...element.props, 
        displaySettings: newSettings
      }
    });
  };

  // Функции для управления состоянием развернутых узлов
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const isNodeExpanded = (nodeId: string) => {
    return expandedNodes.has(nodeId);
  };

  // Функция для рекурсивного рендеринга дерева категорий
  const renderCategoryTree = (categories: Category[], level: number = 0) => {
    clientLogger.debug('🌳 SimplifiedPropertyFilterPanel: renderCategoryTree вызван', {
      categoriesCount: categories.length,
      level,
      categories: categories.map(c => ({ 
        id: c.id, 
        name: c.name, 
        childrenCount: c.children?.length || 0,
        subcategoriesCount: c.subcategories?.length || 0
      }))
    });
    
    return categories.map((category) => {
      // Определяем дочерние категории (может быть children или subcategories)
      const childCategories = category.children || category.subcategories || [];
      const hasChildren = childCategories.length > 0;
      const isExpanded = isNodeExpanded(category.id);
      
      return (
        <div key={category.id} className="mb-1">
          <div 
            className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors ${
              element.props.categoryIds?.includes(category.id) ? 'bg-blue-50' : ''
            }`}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
          >
            {/* Иконка сворачивания/разворачивания */}
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(category.id);
                }}
                className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                {isExpanded ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            ) : (
              <div className="w-4 h-4 flex-shrink-0"></div>
            )}
            
            {/* Чекбокс */}
            <div 
              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer ${
                element.props.categoryIds?.includes(category.id)
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => handleCategorySelect(category.id)}
            >
              {element.props.categoryIds?.includes(category.id) && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            
            {/* Название категории */}
            <div 
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => handleCategorySelect(category.id)}
            >
              <div className="text-sm font-medium text-gray-900 truncate">
                {category.name}
              </div>
              <div className="text-xs text-gray-500">
                {category.products_count} товаров
              </div>
            </div>
            
            {/* Индикатор наличия подкатегорий */}
            {hasChildren && (
              <div className="text-xs text-gray-400 flex-shrink-0">
                {childCategories.length} подкатегорий
              </div>
            )}
          </div>
          
          {/* Рекурсивно рендерим дочерние категории (только если узел развернут) */}
          {hasChildren && isExpanded && (
            <div className="ml-4">
              {renderCategoryTree(childCategories, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const resetConfiguration = () => {
    onUpdateElement(element.id, {
      props: {
        ...element.props,
        categoryIds: [],
        selectedPropertyIds: [],
        propertyName: '',
        title: 'Фильтр'
      }
    });
    setStep('categories');
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Настройка фильтра</h3>
        <p className="text-sm text-gray-600 mt-1">
          Создайте фильтр для выбора товаров по свойствам
        </p>
      </div>

      {/* Шаги */}
      <div className="flex space-x-4">
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
          step === 'categories' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            step === 'categories' ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'
          }`}>
            1
          </div>
          <span className="text-sm font-medium">Категории</span>
        </div>
        
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
          step === 'property' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            step === 'property' ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'
          }`}>
            2
          </div>
          <span className="text-sm font-medium">Свойство</span>
        </div>
        
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
          step === 'display' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            step === 'display' ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'
          }`}>
            3
          </div>
          <span className="text-sm font-medium">Отображение</span>
        </div>
        
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
          step === 'preview' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
        }`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
            step === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'
          }`}>
            4
          </div>
          <span className="text-sm font-medium">Готово</span>
        </div>
      </div>

      {/* Шаг 1: Выбор категорий */}
      {step === 'categories' && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-gray-900">
                Выберите категории товаров
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    // Разворачиваем все узлы
                    const allNodeIds = new Set<string>();
                    const collectAllIds = (cats: Category[]) => {
                      cats.forEach(cat => {
                        const childCategories = cat.children || cat.subcategories || [];
                        if (childCategories.length > 0) {
                          allNodeIds.add(cat.id);
                          collectAllIds(childCategories);
                        }
                      });
                    };
                    collectAllIds(categories);
                    setExpandedNodes(allNodeIds);
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                >
                  Развернуть все
                </button>
                <button
                  onClick={() => setExpandedNodes(new Set())}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                >
                  Свернуть все
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Выберите одну или несколько категорий для фильтрации
            </p>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Загрузка дерева категорий...</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                {categories.length > 0 ? (
                  renderCategoryTree(categories)
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">📁</div>
                    <p className="text-sm text-gray-500">Категории не найдены</p>
                  </div>
                )}
              </div>
            )}
            
            {element.props.categoryIds?.length > 0 && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setStep('property')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Продолжить ({element.props.categoryIds.length} категорий)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Шаг 2: Выбор свойства */}
      {step === 'property' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Выберите свойство для фильтрации
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Выберите свойство, по которому будут фильтроваться товары
            </p>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Загрузка свойств...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      element.props.selectedPropertyIds?.includes(property.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handlePropertySelect(property.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">{property.name}</h5>
                        <p className="text-sm text-gray-500 capitalize">
                          {property.type}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        element.props.selectedPropertyIds?.includes(property.id)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {element.props.selectedPropertyIds?.includes(property.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setStep('categories')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Назад
              </button>
              {element.props.selectedPropertyIds?.length > 0 && (
                <button
                  onClick={() => setStep('display')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Далее
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Шаг 3: Настройка отображения */}
      {step === 'display' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Настройка отображения
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Настройте, как будут отображаться карточки товаров и фильтры
            </p>

            {/* Настройки отображения */}
            <div className="space-y-4">
              {/* Показывать изображения */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="text-sm font-medium text-gray-900">Показывать изображения</h5>
                  <p className="text-xs text-gray-500">Отображать картинки товаров в карточках</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={displaySettings.showImages}
                    onChange={(e) => handleDisplaySettingsChange({ showImages: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Назначение фото на карточку свойства */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 mb-3">Фото для карточки свойства</h5>
                <p className="text-xs text-gray-500 mb-3">
                  Выберите изображение, которое будет отображаться на карточке выбранного свойства
                </p>
                
                <div className="space-y-3">
                  {/* Загрузка изображения */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            handleDisplaySettingsChange({ 
                              propertyCardImage: event.target?.result as string 
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="property-image-upload"
                    />
                    <label
                      htmlFor="property-image-upload"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors text-sm"
                    >
                      Загрузить фото
                    </label>
                    <span className="text-sm text-gray-600">или</span>
                    <input
                      type="url"
                      placeholder="URL изображения"
                      onChange={(e) => handleDisplaySettingsChange({ 
                        propertyCardImage: e.target.value 
                      })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Предварительный просмотр */}
                  {displaySettings.propertyCardImage && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-2">Предварительный просмотр:</p>
                      <div className="w-24 h-24 border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={displaySettings.propertyCardImage}
                          alt="Предварительный просмотр"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => handleDisplaySettingsChange({ propertyCardImage: '' })}
                        className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
                      >
                        Удалить изображение
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Индивидуальные изображения для каждой опции */}
              {element.props.propertyName && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Индивидуальные изображения</h5>
                  <p className="text-xs text-gray-500 mb-3">
                    Настройте изображение для каждой опции свойства "{element.props.propertyName}"
                  </p>
                  
                  <div className="space-y-3">
                    {/* Здесь будут динамически загружаться опции свойства */}
                    {loading ? (
                      <div className="text-center text-gray-500 py-4">
                        <div className="text-sm">Загрузка опций свойства...</div>
                      </div>
                    ) : propertyOptions.length > 0 ? (
                      <div className="space-y-3">
                        {propertyOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{option.label}</div>
                              {option.count !== undefined && (
                                <div className="text-xs text-gray-500">{option.count} товаров</div>
                              )}
                            </div>
                            
                            {/* Поле для URL изображения */}
                            <div className="flex-1">
                              <input
                                type="text"
                                placeholder="URL изображения"
                                value={displaySettings.individualImages[option.value] || ''}
                                onChange={(e) => {
                                  const newIndividualImages = { ...displaySettings.individualImages };
                                  if (e.target.value) {
                                    newIndividualImages[option.value] = e.target.value;
                                  } else {
                                    delete newIndividualImages[option.value];
                                  }
                                  handleDisplaySettingsChange({ individualImages: newIndividualImages });
                                }}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            
                            {/* Предварительный просмотр */}
                            <div className="w-12 h-12 border border-gray-200 rounded overflow-hidden flex-shrink-0">
                              {displaySettings.individualImages[option.value] ? (
                                <img
                                  src={displaySettings.individualImages[option.value]}
                                  alt={option.label}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-600">
                          Опции свойства будут загружены после выбора свойства на шаге 2
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Индивидуальные размеры карточек */}
              {element.props.propertyName && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Индивидуальные размеры карточек</h5>
                  <p className="text-xs text-gray-500 mb-3">
                    Настройте высоту и ширину для каждой опции свойства "{element.props.propertyName}"
                  </p>
                  
                  <div className="space-y-3">
                    {loading ? (
                      <div className="text-center text-gray-500 py-4">
                        <div className="text-sm">Загрузка опций свойства...</div>
                      </div>
                    ) : propertyOptions.length > 0 ? (
                      <div className="space-y-3">
                        {propertyOptions.map((option) => (
                          <div key={option.value} className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{option.label}</div>
                              {option.count !== undefined && (
                                <div className="text-xs text-gray-500">{option.count} товаров</div>
                              )}
                            </div>
                            
                            {/* Поля для размеров карточки */}
                            <div className="flex items-center space-x-2">
                              {/* Высота */}
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">В:</span>
                                <input
                                  type="number"
                                  min="80"
                                  max="300"
                                  placeholder="Высота"
                                  value={displaySettings.individualCardHeights[option.value] || ''}
                                  onChange={(e) => {
                                    const newIndividualHeights = { ...displaySettings.individualCardHeights };
                                    if (e.target.value) {
                                      newIndividualHeights[option.value] = parseInt(e.target.value) || 150;
                                    } else {
                                      delete newIndividualHeights[option.value];
                                    }
                                    handleDisplaySettingsChange({ individualCardHeights: newIndividualHeights });
                                  }}
                                  className="w-16 px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              
                              {/* Ширина */}
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500">Ш:</span>
                                <input
                                  type="number"
                                  min="100"
                                  max="400"
                                  placeholder="Ширина"
                                  value={displaySettings.individualCardWidths[option.value] || ''}
                                  onChange={(e) => {
                                    const newIndividualWidths = { ...displaySettings.individualCardWidths };
                                    if (e.target.value) {
                                      newIndividualWidths[option.value] = parseInt(e.target.value) || 200;
                                    } else {
                                      delete newIndividualWidths[option.value];
                                    }
                                    handleDisplaySettingsChange({ individualCardWidths: newIndividualWidths });
                                  }}
                                  className="w-16 px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-600">
                          Опции свойства будут загружены после выбора свойства на шаге 2
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Заголовок и подписи */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 mb-3">Заголовок и подписи</h5>
                
                {/* Заголовок компонента */}
                <div className="mb-4">
                  <label className="text-xs text-gray-600 mb-1 block">Заголовок компонента</label>
                  <input
                    type="text"
                    value={displaySettings.componentTitle}
                    onChange={(e) => handleDisplaySettingsChange({ componentTitle: e.target.value })}
                    placeholder="Введите заголовок"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                {/* Позиция подписи */}
                <div>
                  <label className="text-xs text-gray-600 mb-2 block">Позиция подписи</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDisplaySettingsChange({ labelPosition: 'inside' })}
                      className={`flex-1 p-2 rounded-lg border-2 transition-colors ${
                        displaySettings.labelPosition === 'inside'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">📋</div>
                        <div className="text-xs font-medium">Внутри карточки</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleDisplaySettingsChange({ labelPosition: 'outside' })}
                      className={`flex-1 p-2 rounded-lg border-2 transition-colors ${
                        displaySettings.labelPosition === 'outside'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-lg mb-1">📄</div>
                        <div className="text-xs font-medium">Под карточкой</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Показывать количество товаров */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="text-sm font-medium text-gray-900">Показывать количество</h5>
                  <p className="text-xs text-gray-500">Отображать количество товаров в каждой категории</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={displaySettings.showCounts}
                    onChange={(e) => handleDisplaySettingsChange({ showCounts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Макет карточек */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 mb-3">Макет карточек</h5>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDisplaySettingsChange({ cardLayout: 'vertical' })}
                    className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                      displaySettings.cardLayout === 'vertical'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">📱</div>
                      <div className="text-xs font-medium">Вертикальные</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDisplaySettingsChange({ cardLayout: 'horizontal' })}
                    className={`flex-1 p-3 rounded-lg border-2 transition-colors ${
                      displaySettings.cardLayout === 'horizontal'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">📄</div>
                      <div className="text-xs font-medium">Горизонтальные</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Размер карточек */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-gray-900">Размер карточек</h5>
                  
                  {/* Кнопка Авто */}
                  <button
                    onClick={() => handleDisplaySettingsChange({ autoSize: !displaySettings.autoSize })}
                    className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                      displaySettings.autoSize
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {displaySettings.autoSize ? 'Авто' : 'Ручной'}
                  </button>
                </div>
                
                {!displaySettings.autoSize && (
                  <div className="space-y-3">
                    {/* Высота и ширина в одной строке */}
                    <div className="flex items-center space-x-3">
                      {/* Высота */}
                      <div className="flex-1">
                        <label className="text-xs text-gray-600 mb-1 block">Высота</label>
                        {displaySettings.customCardHeight ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min="80"
                              max="300"
                              value={displaySettings.cardHeight}
                              onChange={(e) => handleDisplaySettingsChange({ 
                                cardHeight: parseInt(e.target.value) || 150
                              })}
                              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-500">px</span>
                          </div>
                        ) : (
                          <div className="flex space-x-1">
                            {[100, 120, 150, 180, 200].map((height) => (
                              <button
                                key={height}
                                onClick={() => handleDisplaySettingsChange({ cardHeight: height })}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                  displaySettings.cardHeight === height
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                }`}
                              >
                                {height}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Ширина */}
                      <div className="flex-1">
                        <label className="text-xs text-gray-600 mb-1 block">Ширина</label>
                        {displaySettings.customCardWidth ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min="100"
                              max="400"
                              value={displaySettings.cardWidth}
                              onChange={(e) => handleDisplaySettingsChange({ 
                                cardWidth: parseInt(e.target.value) || 200
                              })}
                              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-500">px</span>
                          </div>
                        ) : (
                          <div className="flex space-x-1">
                            {[150, 180, 200, 250, 300].map((width) => (
                              <button
                                key={width}
                                onClick={() => handleDisplaySettingsChange({ cardWidth: width })}
                                className={`px-2 py-1 text-xs rounded border transition-colors ${
                                  displaySettings.cardWidth === width
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                }`}
                              >
                                {width}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Переключатели произвольных размеров */}
                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={displaySettings.customCardHeight}
                          onChange={(e) => handleDisplaySettingsChange({ customCardHeight: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-gray-600">Произвольная высота</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={displaySettings.customCardWidth}
                          onChange={(e) => handleDisplaySettingsChange({ customCardWidth: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-gray-600">Произвольная ширина</span>
                      </label>
                    </div>
                  </div>
                )}
                
                {displaySettings.autoSize && (
                  <div className="text-xs text-gray-500 text-center py-2">
                    Размеры карточек рассчитываются автоматически на основе размера компонента
                  </div>
                )}
              </div>

              {/* Количество колонок */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 mb-3">Количество колонок</h5>
                
                {/* Переключатель произвольного количества */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Произвольное количество</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={displaySettings.customColumns}
                      onChange={(e) => handleDisplaySettingsChange({ customColumns: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {displaySettings.customColumns ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={displaySettings.customColumnsValue}
                      onChange={(e) => handleDisplaySettingsChange({ 
                        customColumnsValue: parseInt(e.target.value) || 1,
                        columns: parseInt(e.target.value) || 1
                      })}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">колонок</span>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 6].map((cols) => (
                      <button
                        key={cols}
                        onClick={() => handleDisplaySettingsChange({ columns: cols })}
                        className={`w-12 h-8 rounded border-2 transition-colors ${
                          displaySettings.columns === cols
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {cols}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Показывать карточки товаров */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="text-sm font-medium text-gray-900">Показывать карточки товаров</h5>
                  <p className="text-xs text-gray-500">Отображать карточки товаров под фильтром</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={displaySettings.showProductCards}
                    onChange={(e) => handleDisplaySettingsChange({ showProductCards: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Количество элементов */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 mb-3">Количество элементов</h5>
                <p className="text-xs text-gray-500 mb-3">Сколько элементов отображать в компоненте</p>
                
                {/* Переключатель Все/Ограничено */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">Показывать все элементы</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={displaySettings.showAllElements}
                      onChange={(e) => handleDisplaySettingsChange({ showAllElements: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Поле ввода количества элементов */}
                {!displaySettings.showAllElements && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={displaySettings.maxElements}
                      onChange={(e) => handleDisplaySettingsChange({ 
                        maxElements: parseInt(e.target.value) || 1
                      })}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">элементов</span>
                  </div>
                )}
              </div>

              {/* Максимальное количество товаров */}
              {displaySettings.showProductCards && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Максимальное количество товаров</h5>
                  
                  {/* Переключатель произвольного количества */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">Произвольное количество</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={displaySettings.customProducts}
                        onChange={(e) => handleDisplaySettingsChange({ customProducts: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {displaySettings.customProducts ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={displaySettings.customProductsValue}
                        onChange={(e) => handleDisplaySettingsChange({ 
                          customProductsValue: parseInt(e.target.value) || 1,
                          maxProducts: parseInt(e.target.value) || 1
                        })}
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">товаров</span>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      {[6, 12, 24, 48, 96].map((count) => (
                        <button
                          key={count}
                          onClick={() => handleDisplaySettingsChange({ maxProducts: count })}
                          className={`px-3 py-1 rounded border-2 transition-colors ${
                            displaySettings.maxProducts === count
                              ? 'border-blue-500 bg-blue-500 text-white'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Кнопки навигации */}
            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep('property')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Назад
              </button>
              <button
                onClick={() => setStep('preview')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Далее
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Шаг 4: Предварительный просмотр */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              Настройка завершена
            </h4>
            
            {/* Настройка заголовка */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Заголовок фильтра
              </label>
              <input
                type="text"
                value={element.props.title || 'Фильтр'}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Фильтр"
              />
            </div>
            
            {/* Сводка настроек */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h5 className="font-medium text-gray-900">Настройки фильтра:</h5>
              
              <div>
                <span className="text-sm text-gray-600">Категории:</span>
                <div className="mt-1">
                  {element.props.categoryIds?.map((id: string) => {
                    const category = categories.find(c => c.id === id);
                    return (
                      <span key={id} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-1">
                        {category?.name || id}
                      </span>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <span className="text-sm text-gray-600">Свойство:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {element.props.propertyName || 'Не выбрано'}
                </span>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between">
              <button
                onClick={resetConfiguration}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Настроить заново
              </button>
              <button
                onClick={() => setStep('categories')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Изменить настройки
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
