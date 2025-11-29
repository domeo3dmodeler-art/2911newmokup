'use client';

import React, { useState } from 'react';
import { 
  Layout, Layers, FileText, ChevronDown, ChevronRight, 
  Calculator, Package, Database, Search, Star, Settings,
  Type, Image, Square, Navigation, Filter, Zap, Grid, 
  MousePointer, Eye, EyeOff
} from 'lucide-react';

interface ImprovedSidebarProps {
  onAddElement: (element: any) => void;
  elements: any[];
  selectedElementId: string | null;
  onSelectElement: (elementId: string) => void;
  children?: React.ReactNode;
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  sections: {
    id: string;
    label: string;
    icon: React.ElementType;
    items: {
      type: string;
      name: string;
      icon: React.ElementType;
      description: string;
      category?: string;
    }[];
  }[];
}

const tabsConfig: TabConfig[] = [
  {
    id: 'elements',
    label: 'Элементы',
    icon: Layout,
    color: 'bg-blue-50 text-blue-600',
    sections: [
      {
        id: 'content',
        label: 'Контент',
        icon: Type,
        items: [
          { type: 'text', name: 'Текст', icon: Type, description: 'Добавить текстовый блок' },
          { type: 'heading', name: 'Заголовок', icon: Type, description: 'Заголовок H1-H6' },
          { type: 'image', name: 'Изображение', icon: Image, description: 'Добавить изображение' },
          { type: 'video', name: 'Видео', icon: Square, description: 'Встроить видео' },
        ]
      },
      {
        id: 'layout',
        label: 'Макет',
        icon: Grid,
        items: [
          { type: 'container', name: 'Контейнер', icon: Square, description: 'Группировка элементов' },
          { type: 'columns', name: 'Колонки', icon: Grid, description: 'Многоколоночная сетка' },
          { type: 'spacer', name: 'Отступ', icon: Square, description: 'Пустое пространство' },
        ]
      },
      {
        id: 'navigation',
        label: 'Навигация',
        icon: Navigation,
        items: [
          { type: 'button', name: 'Кнопка', icon: Square, description: 'Интерактивная кнопка' },
          { type: 'menu', name: 'Меню', icon: Navigation, description: 'Навигационное меню' },
          { type: 'breadcrumbs', name: 'Хлебные крошки', icon: ChevronRight, description: 'Путь навигации' },
        ]
      },
      {
        id: 'forms',
        label: 'Формы',
        icon: Settings,
        items: [
          { type: 'input', name: 'Поле ввода', icon: Square, description: 'Текстовое поле' },
          { type: 'select', name: 'Выпадающий список', icon: ChevronDown, description: 'Селект опций' },
          { type: 'checkbox', name: 'Чекбокс', icon: Square, description: 'Множественный выбор' },
          { type: 'radio', name: 'Радиокнопка', icon: Square, description: 'Одиночный выбор' },
        ]
      }
    ]
  },
  {
    id: 'products',
    label: 'Товары',
    icon: Package,
    color: 'bg-green-50 text-green-600',
    sections: [
      {
        id: 'catalog',
        label: 'Каталог',
        icon: Database,
        items: [
          { type: 'category-selector', name: 'Выбор категории', icon: Package, description: 'Селектор категорий товаров' },
          { type: 'category-tree', name: 'Дерево категорий', icon: Database, description: 'Иерархия категорий' },
        ]
      },
      {
        id: 'display',
        label: 'Отображение',
        icon: Grid,
        items: [
          { type: 'product-grid', name: 'Сетка товаров', icon: Grid, description: 'Карточки товаров в сетке' },
          { type: 'product-list', name: 'Список товаров', icon: FileText, description: 'Компактный список' },
          { type: 'product-carousel', name: 'Карусель товаров', icon: Square, description: 'Слайдер товаров' },
          { type: 'featured-products', name: 'Рекомендуемые', icon: Star, description: 'Популярные товары' },
        ]
      },
      {
        id: 'filters',
        label: 'Фильтры',
        icon: Filter,
        items: [
          { type: 'property-filter', name: 'Фильтр свойств', icon: Filter, description: 'Фильтрация по характеристикам' },
          { type: 'price-filter', name: 'Фильтр цены', icon: Calculator, description: 'Диапазон цен' },
          { type: 'brand-filter', name: 'Фильтр бренда', icon: Package, description: 'Фильтр по производителям' },
          { type: 'search-bar', name: 'Поиск', icon: Search, description: 'Поисковая строка' },
        ]
      },
      {
        id: 'product-details',
        label: 'Детали товара',
        icon: Eye,
        items: [
          { type: 'product-card', name: 'Карточка товара', icon: Package, description: 'Детальная карточка' },
          { type: 'product-gallery', name: 'Галерея товара', icon: Image, description: 'Изображения товара' },
          { type: 'product-comparison', name: 'Сравнение', icon: Square, description: 'Сравнительная таблица' },
        ]
      }
    ]
  },
  {
    id: 'interactive',
    label: 'Интерактив',
    icon: Zap,
    color: 'bg-purple-50 text-purple-600',
    sections: [
      {
        id: 'calculators',
        label: 'Калькуляторы',
        icon: Calculator,
        items: [
          { type: 'price-calculator', name: 'Калькулятор цены', icon: Calculator, description: 'Расчет стоимости' },
          { type: 'discount-calculator', name: 'Калькулятор скидок', icon: Calculator, description: 'Расчет скидок' },
          { type: 'delivery-calculator', name: 'Калькулятор доставки', icon: Calculator, description: 'Стоимость доставки' },
        ]
      },
      {
        id: 'configurators',
        label: 'Конфигураторы',
        icon: Settings,
        items: [
          { type: 'door-configurator', name: 'Конфигуратор дверей', icon: Package, description: 'Настройка дверей' },
          { type: 'handle-configurator', name: 'Конфигуратор ручек', icon: Settings, description: 'Выбор ручек' },
          { type: 'kit-configurator', name: 'Конфигуратор комплектов', icon: Package, description: 'Комплекты фурнитуры' },
        ]
      },
      {
        id: 'forms',
        label: 'Формы',
        icon: FileText,
        items: [
          { type: 'order-form', name: 'Форма заказа', icon: FileText, description: 'Оформление заказа' },
          { type: 'contact-form', name: 'Обратная связь', icon: FileText, description: 'Связаться с нами' },
          { type: 'subscription-form', name: 'Подписка', icon: FileText, description: 'Email подписка' },
        ]
      },
      {
        id: 'interactive-elements',
        label: 'Интерактивные элементы',
        icon: Zap,
        items: [
          { type: 'modal', name: 'Модальное окно', icon: Square, description: 'Всплывающее окно' },
          { type: 'accordion', name: 'Аккордеон', icon: ChevronDown, description: 'Складываемые секции' },
          { type: 'tabs', name: 'Вкладки', icon: FileText, description: 'Переключаемые панели' },
        ]
      }
    ]
  },
  {
    id: 'structure',
    label: 'Структура',
    icon: Layers,
    color: 'bg-gray-50 text-gray-600',
    sections: [
      {
        id: 'layers',
        label: 'Слои',
        icon: Layers,
        items: [
          { type: 'layer-manager', name: 'Управление слоями', icon: Layers, description: 'Иерархия элементов' },
          { type: 'group', name: 'Группа', icon: Square, description: 'Группировка элементов' },
        ]
      },
      {
        id: 'pages',
        label: 'Страницы',
        icon: FileText,
        items: [
          { type: 'page-manager', name: 'Управление страницами', icon: FileText, description: 'Многостраничный сайт' },
          { type: 'navigation', name: 'Навигация', icon: Navigation, description: 'Межстраничная навигация' },
        ]
      },
      {
        id: 'settings',
        label: 'Настройки',
        icon: Settings,
        items: [
          { type: 'page-settings', name: 'Настройки страницы', icon: Settings, description: 'SEO, мета-данные' },
          { type: 'responsive', name: 'Адаптивность', icon: Square, description: 'Мобильная версия' },
        ]
      }
    ]
  }
];

export default function ImprovedSidebar({
  onAddElement,
  elements,
  selectedElementId,
  onSelectElement
}: ImprovedSidebarProps) {
  const [activeTab, setActiveTab] = useState('elements');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['content', 'catalog', 'calculators', 'layers']));
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleAddElement = (element: any) => {
    onAddElement(element);
  };

  const filteredTabs = tabsConfig.map(tab => ({
    ...tab,
    sections: tab.sections.map(section => ({
      ...section,
      items: section.items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(section => section.items.length > 0)
  })).filter(tab => tab.sections.length > 0);

  const activeTabConfig = filteredTabs.find(tab => tab.id === activeTab);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Заголовок с поиском */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <Package className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Конструктор</h2>
        </div>
        
        {/* Поиск */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск элементов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Вкладки */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {filteredTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center py-3 px-2 text-sm font-medium transition-all duration-200 relative ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 border-b-2 border-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <div className="flex flex-col items-center space-y-1">
              <tab.icon className="w-4 h-4" />
              <span className="text-xs leading-tight">{tab.label}</span>
            </div>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        ))}
      </div>

      {/* Контент вкладки */}
      <div className="flex-1 overflow-y-auto">
        {activeTabConfig ? (
          <div className="p-4 space-y-4">
            {activeTabConfig.sections.map(section => (
              <div key={section.id} className="space-y-2">
                {/* Заголовок секции */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <div className="flex items-center space-x-2">
                    <section.icon className="w-4 h-4" />
                    <span>{section.label}</span>
                  </div>
                  {expandedSections.has(section.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {/* Элементы секции */}
                {expandedSections.has(section.id) && (
                  <div className="grid grid-cols-1 gap-2 ml-6">
                    {section.items.map(item => (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => {
                          const elementData = {
                            type: item.type,
                            name: item.name,
                            props: {
                              content: item.type === 'text' ? 'Текстовый блок' : '',
                              text: item.type === 'button' ? 'Кнопка' : '',
                              src: item.type === 'image' ? '' : '',
                              alt: item.type === 'image' ? 'Изображение' : ''
                            },
                            style: {}
                          }
                          e.dataTransfer.setData('application/json', JSON.stringify(elementData))
                          e.dataTransfer.effectAllowed = 'copy'
                        }}
                        onClick={() => handleAddElement({
                          id: `element-${Date.now()}`,
                          type: item.type,
                          name: item.name,
                          props: {
                            content: item.type === 'text' ? 'Текстовый блок' : '',
                            text: item.type === 'button' ? 'Кнопка' : '',
                            src: item.type === 'image' ? '' : '',
                            alt: item.type === 'image' ? 'Изображение' : ''
                          },
                          style: {}
                        })}
                        className="flex items-center p-2 rounded-md hover:bg-blue-50 cursor-pointer transition-colors group border border-transparent hover:border-blue-200"
                        title={item.description}
                      >
                        <item.icon className="w-4 h-4 text-gray-500 mr-3 group-hover:text-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Элементы не найдены</p>
          </div>
        )}
      </div>

      {/* Быстрые действия */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Элементов: {elements.length}</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSelectElement('')}
              className="p-1 hover:bg-gray-100 rounded"
              title="Сбросить выбор"
            >
              <MousePointer className="w-3 h-3" />
            </button>
            <button
              className="p-1 hover:bg-gray-100 rounded"
              title="Скрыть/показать элементы"
            >
              <EyeOff className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
