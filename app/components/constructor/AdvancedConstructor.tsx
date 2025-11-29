'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Card } from '@/components/ui';
import { 
  Layout, 
  Settings, 
  ShoppingCart, 
  Package, 
  Link2, 
  Plus,
  Trash2,
  Edit,
  Save,
  Eye
} from 'lucide-react';
import { 
  AdvancedConstructorElement, 
  // CategoryLink removed - categories are now simply part of one configurator category
  ProductDisplaySettings,
  CartDisplaySettings,
  LayoutSettings 
} from './advancedTypes';

// Компонент для настройки связей между категориями - УДАЛЕН
// Весь функционал связей категорий убран, так как категории теперь просто часть одной категории конфигуратора
/*
function CategoryLinksPanel({ categoryLinks, onUpdateLinks }: {
  categoryLinks: CategoryLink[];
  onUpdateLinks: (links: CategoryLink[]) => void;
}) {
  // ... весь код закомментирован
}
*/

// Компонент для настройки отображения корзины
function CartDisplayPanel({ cartSettings, onUpdateSettings }: {
  cartSettings: CartDisplaySettings;
  onUpdateSettings: (settings: CartDisplaySettings) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Настройки корзины</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showItemDetails"
            checked={cartSettings.showItemDetails}
            onChange={(e) => onUpdateSettings({ ...cartSettings, showItemDetails: e.target.checked })}
          />
          <label htmlFor="showItemDetails" className="text-sm">Показывать детали товаров</label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showSubtotals"
            checked={cartSettings.showSubtotals}
            onChange={(e) => onUpdateSettings({ ...cartSettings, showSubtotals: e.target.checked })}
          />
          <label htmlFor="showSubtotals" className="text-sm">Показывать промежуточные итоги</label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showTotal"
            checked={cartSettings.showTotal}
            onChange={(e) => onUpdateSettings({ ...cartSettings, showTotal: e.target.checked })}
          />
          <label htmlFor="showTotal" className="text-sm">Показывать общий итог</label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="groupByCategory"
            checked={cartSettings.groupByCategory}
            onChange={(e) => onUpdateSettings({ ...cartSettings, groupByCategory: e.target.checked })}
          />
          <label htmlFor="groupByCategory" className="text-sm">Группировать по категориям</label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showQuantityControls"
            checked={cartSettings.showQuantityControls}
            onChange={(e) => onUpdateSettings({ ...cartSettings, showQuantityControls: e.target.checked })}
          />
          <label htmlFor="showQuantityControls" className="text-sm">Показывать контролы количества</label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="allowItemRemoval"
            checked={cartSettings.allowItemRemoval}
            onChange={(e) => onUpdateSettings({ ...cartSettings, allowItemRemoval: e.target.checked })}
          />
          <label htmlFor="allowItemRemoval" className="text-sm">Разрешить удаление товаров</label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showPricingBreakdown"
            checked={cartSettings.showPricingBreakdown}
            onChange={(e) => onUpdateSettings({ ...cartSettings, showPricingBreakdown: e.target.checked })}
          />
          <label htmlFor="showPricingBreakdown" className="text-sm">Показывать разбивку цен</label>
        </div>
      </div>
    </div>
  );
}

// Компонент для настройки макета элемента
function LayoutSettingsPanel({ layout, onUpdateLayout }: {
  layout: LayoutSettings;
  onUpdateLayout: (layout: LayoutSettings) => void;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Настройки макета</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Ширина блока</label>
          <Select
            value={layout.width}
            onValueChange={(value: any) => onUpdateLayout({ ...layout, width: value })}
          >
            <option value="full">Полная ширина</option>
            <option value="half">Половина</option>
            <option value="third">Треть</option>
            <option value="quarter">Четверть</option>
            <option value="custom">Пользовательская</option>
          </Select>
        </div>

        {layout.width === 'custom' && (
          <div>
            <label className="block text-sm font-medium mb-1">Пользовательская ширина</label>
            <Input
              value={layout.customWidth || ''}
              onChange={(e) => onUpdateLayout({ ...layout, customWidth: e.target.value })}
              placeholder="400px, 50%, auto"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Выравнивание</label>
          <Select
            value={layout.alignment}
            onValueChange={(value: any) => onUpdateLayout({ ...layout, alignment: value })}
          >
            <option value="left">По левому краю</option>
            <option value="center">По центру</option>
            <option value="right">По правому краю</option>
            <option value="justify">По ширине</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Цвет фона</label>
          <Input
            type="color"
            value={layout.backgroundColor || '#ffffff'}
            onChange={(e) => onUpdateLayout({ ...layout, backgroundColor: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Отступ сверху</label>
          <Input
            value={layout.margin.top}
            onChange={(e) => onUpdateLayout({ 
              ...layout, 
              margin: { ...layout.margin, top: e.target.value }
            })}
            placeholder="10px, 1rem"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Отступ снизу</label>
          <Input
            value={layout.margin.bottom}
            onChange={(e) => onUpdateLayout({ 
              ...layout, 
              margin: { ...layout.margin, bottom: e.target.value }
            })}
            placeholder="10px, 1rem"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Отступ слева</label>
          <Input
            value={layout.margin.left}
            onChange={(e) => onUpdateLayout({ 
              ...layout, 
              margin: { ...layout.margin, left: e.target.value }
            })}
            placeholder="10px, 1rem"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Отступ справа</label>
          <Input
            value={layout.margin.right}
            onChange={(e) => onUpdateLayout({ 
              ...layout, 
              margin: { ...layout.margin, right: e.target.value }
            })}
            placeholder="10px, 1rem"
          />
        </div>
      </div>
    </div>
  );
}

// Главный компонент продвинутого конструктора
export default function AdvancedConstructor() {
  const [elements, setElements] = useState<AdvancedConstructorElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  // const [categoryLinks, setCategoryLinks] = useState<CategoryLink[]>([]); // Удалено - связи категорий больше не используются
  const [activeTab, setActiveTab] = useState<'elements' | 'layout' | 'categories' | 'cart'>('elements');

  const selectedElement = elements.find(el => el.id === selectedElementId);

  const addElement = (elementData: Partial<AdvancedConstructorElement>) => {
    const newElement: AdvancedConstructorElement = {
      id: Date.now().toString(),
      type: 'content',
      component: 'TextBlock',
      props: {},
      position: { x: 0, y: 0 },
      size: { width: '100%', height: 'auto' },
      responsive: {},
      layout: {
        width: 'full',
        alignment: 'left',
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        padding: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
      },
      ...elementData
    };
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<AdvancedConstructorElement>) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const removeElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  };

  const availableElements = [
    {
      id: 'product-configurator',
      name: 'Конфигуратор товаров',
      icon: '⚙️',
      component: 'ProductConfigurator',
      props: {
        mainCategory: '',
        showPriceCalculator: true,
        showCategoryLinks: true
      }
    },
    {
      id: 'product-grid',
      name: 'Сетка товаров',
      icon: '🏪',
      component: 'ProductGrid',
      props: {
        categoryId: '',
        columns: 3,
        showPrices: true,
        showImages: true
      }
    },
    {
      id: 'cart-display',
      name: 'Отображение корзины',
      icon: '🛒',
      component: 'CartDisplay',
      props: {
        showItemDetails: true,
        showSubtotals: true,
        showTotal: true
      }
    },
    {
      id: 'text-block',
      name: 'Текстовый блок',
      icon: '📝',
      component: 'TextBlock',
      props: {
        content: 'Описание товара или инструкция'
      }
    },
    {
      id: 'image-block',
      name: 'Изображение',
      icon: '🖼️',
      component: 'ImageBlock',
      props: {
        src: '/placeholder.jpg',
        alt: 'Изображение товара'
      }
    }
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Заголовок */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            Продвинутый конструктор конфигуратора
          </h1>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-1" />
              Сохранить
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              Предпросмотр
            </Button>
            <Button size="sm">
              🚀 Опубликовать
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Левая панель */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
              <button
                onClick={() => setActiveTab('elements')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === 'elements' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Элементы
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === 'categories' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Связи
              </button>
              <button
                onClick={() => setActiveTab('cart')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === 'cart' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Корзина
              </button>
            </div>

            {activeTab === 'elements' && (
              <div className="space-y-2">
                <h3 className="font-semibold mb-3">Элементы страницы</h3>
                {availableElements.map((element) => (
                  <button
                    key={element.id}
                    onClick={() => addElement({
                      type: 'content',
                      component: element.component,
                      props: element.props
                    })}
                    className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{element.icon}</span>
                      <div>
                        <div className="font-medium text-gray-800">{element.name}</div>
                        <div className="text-xs text-gray-500">{element.component}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="text-center py-8 text-gray-500">
                <p>Функционал связей категорий удален</p>
                <p className="text-sm">Категории теперь просто часть одной категории конфигуратора</p>
              </div>
            )}

            {activeTab === 'cart' && (
              <CartDisplayPanel 
                cartSettings={{
                  showItemDetails: true,
                  showSubtotals: true,
                  showTotal: true,
                  groupByCategory: true,
                  showQuantityControls: true,
                  allowItemRemoval: true,
                  showPricingBreakdown: true
                }}
                onUpdateSettings={() => {}}
              />
            )}
          </div>
        </div>

        {/* Центральная область */}
        <div className="flex-1 bg-gray-50 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px] p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">
                Предварительный просмотр страницы
              </h2>
              
              {elements.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Пустая страница</h3>
                  <p className="text-gray-500">Выберите элементы из левой панели для создания страницы</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {elements.map((element) => (
                    <div
                      key={element.id}
                      onClick={() => setSelectedElementId(element.id)}
                      className={`
                        relative p-4 border-2 rounded-lg cursor-pointer transition-all
                        ${selectedElementId === element.id 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}
                      style={{
                        width: element.layout.width === 'custom' 
                          ? element.layout.customWidth 
                          : element.layout.width === 'half' 
                            ? '50%' 
                            : element.layout.width === 'third'
                              ? '33.333%'
                              : element.layout.width === 'quarter'
                                ? '25%'
                                : '100%',
                        textAlign: element.layout.alignment,
                        backgroundColor: element.layout.backgroundColor,
                        margin: `${element.layout.margin.top} ${element.layout.margin.right} ${element.layout.margin.bottom} ${element.layout.margin.left}`,
                        padding: `${element.layout.padding.top} ${element.layout.padding.right} ${element.layout.padding.bottom} ${element.layout.padding.left}`
                      }}
                    >
                      <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        {element.component}
                      </div>
                      
                      {element.component === 'ProductConfigurator' && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Конфигуратор товаров</h3>
                          <div className="bg-gray-50 p-4 rounded">
                            <p className="text-sm text-gray-600">Основная категория: {element.props.mainCategory || 'Не выбрана'}</p>
                            {/* Связанные категории удалены - теперь категории просто часть одной категории конфигуратора */}
                          </div>
                        </div>
                      )}

                      {element.component === 'ProductGrid' && (
                        <div className="bg-gray-50 p-4 rounded">
                          <h3 className="font-medium">Сетка товаров</h3>
                          <p className="text-sm text-gray-600">{element.props.columns || 3} колонки</p>
                        </div>
                      )}

                      {element.component === 'CartDisplay' && (
                        <div className="bg-green-50 p-4 rounded border border-green-200">
                          <h3 className="font-medium text-green-800">Корзина покупок</h3>
                          <div className="text-sm text-green-700">
                            <p>• Детали товаров: {element.props.showItemDetails ? 'Да' : 'Нет'}</p>
                            <p>• Промежуточные итоги: {element.props.showSubtotals ? 'Да' : 'Нет'}</p>
                            <p>• Общий итог: {element.props.showTotal ? 'Да' : 'Нет'}</p>
                          </div>
                        </div>
                      )}

                      {element.component === 'TextBlock' && (
                        <div>{element.props.content || 'Текстовый блок'}</div>
                      )}

                      {element.component === 'ImageBlock' && (
                        <div className="bg-gray-100 rounded p-8 text-center">
                          <div className="text-4xl mb-2">🖼️</div>
                          <div className="text-gray-600">Изображение</div>
                        </div>
                      )}

                      {selectedElementId === element.id && (
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Функция редактирования элемента будет реализована позже
                              clientLogger.debug('Edit element clicked', { elementId: element.id });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeElement(element.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Правая панель свойств */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            {selectedElement ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Свойства элемента</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Компонент</label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {selectedElement.component}
                  </div>
                </div>

                <LayoutSettingsPanel 
                  layout={selectedElement.layout}
                  onUpdateLayout={(layout) => updateElement(selectedElement.id, { layout })}
                />
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <div className="text-4xl mb-4">⚙️</div>
                <h3 className="text-lg font-medium mb-2">Свойства элемента</h3>
                <p className="text-sm">Выберите элемент для редактирования</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
