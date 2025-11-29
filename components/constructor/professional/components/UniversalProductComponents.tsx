'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Package, Search, Filter, Grid, List, 
  Calculator, Star, Heart, Eye, ChevronDown, ChevronRight,
  LayoutGrid, SlidersHorizontal, Settings, Component, 
  TrendingUp, BarChart3, Users, CheckSquare, CircleDot
} from 'lucide-react';
import { ElementType } from '../ProfessionalPageBuilder';
import { clientLogger } from '@/lib/logging/client-logger';

interface UniversalProductComponentsProps {
  onAddElement: (element: ElementType) => void;
}

interface ComponentGroup {
  id: string;
  name: string;
  icon: React.ElementType;
  components: { type: string; name: string; icon: React.ElementType; description: string }[];
}

const universalProductGroups: ComponentGroup[] = [
  {
    id: 'product-catalog',
    name: 'Каталог товаров',
    icon: Package,
    components: [
      { type: 'product-grid', name: 'Сетка товаров', icon: Grid, description: 'Отображение товаров в виде сетки с фильтрами' },
      { type: 'product-list', name: 'Список товаров', icon: List, description: 'Отображение товаров в виде списка' },
      { type: 'product-carousel', name: 'Карусель товаров', icon: LayoutGrid, description: 'Карусель популярных товаров' },
      { type: 'product-featured', name: 'Рекомендуемые', icon: Star, description: 'Блок рекомендуемых товаров' },
      { type: 'product-search', name: 'Поиск товаров', icon: Search, description: 'Поиск по каталогу товаров' },
      { type: 'product-category', name: 'Категория товаров', icon: Package, description: 'Товары конкретной категории' }
    ]
  },
  {
    id: 'product-configurator',
    name: 'Конфигураторы товаров',
    icon: Settings,
    components: [
      { type: 'door-configurator', name: 'Конфигуратор дверей', icon: Component, description: 'Пошаговый конфигуратор дверей' },
      { type: 'kitchen-configurator', name: 'Конфигуратор кухонь', icon: LayoutGrid, description: 'Планировщик кухонь' },
      { type: 'tile-configurator', name: 'Конфигуратор плитки', icon: Grid, description: 'Калькулятор плитки' },
      { type: 'bathroom-configurator', name: 'Конфигуратор сантехники', icon: Settings, description: 'Конфигуратор ванных комнат' },
      { type: 'hardware-configurator', name: 'Конфигуратор фурнитуры', icon: SlidersHorizontal, description: 'Подбор фурнитуры' }
    ]
  },
  {
    id: 'product-calculator',
    name: 'Калькуляторы цен',
    icon: Calculator,
    components: [
      { type: 'price-calculator', name: 'Калькулятор цены', icon: Calculator, description: 'Расчет стоимости товара' },
      { type: 'delivery-calculator', name: 'Калькулятор доставки', icon: Package, description: 'Расчет стоимости доставки' },
      { type: 'installation-calculator', name: 'Калькулятор установки', icon: Settings, description: 'Расчет стоимости монтажа' },
      { type: 'discount-calculator', name: 'Калькулятор скидок', icon: TrendingUp, description: 'Система скидок и акций' }
    ]
  },
  {
    id: 'product-comparison',
    name: 'Сравнение товаров',
    icon: BarChart3,
    components: [
      { type: 'product-comparison', name: 'Сравнение товаров', icon: BarChart3, description: 'Таблица сравнения характеристик' },
      { type: 'product-recommendations', name: 'Рекомендации', icon: Users, description: 'Персональные рекомендации' },
      { type: 'product-reviews', name: 'Отзывы товаров', icon: Star, description: 'Отзывы и рейтинги' }
    ]
  },
  {
    id: 'product-interaction',
    name: 'Взаимодействие с товарами',
    icon: Heart,
    components: [
      { type: 'product-favorites', name: 'Избранное', icon: Heart, description: 'Список избранных товаров' },
      { type: 'product-recent', name: 'Недавно просмотренные', icon: Eye, description: 'История просмотров' },
      { type: 'product-cart', name: 'Корзина', icon: ShoppingCart, description: 'Корзина покупок' },
      { type: 'product-wishlist', name: 'Список желаний', icon: Heart, description: 'Список желаемых товаров' }
    ]
  },
  {
    id: 'product-filters',
    name: 'Фильтры и поиск',
    icon: Filter,
    components: [
      { type: 'product-filters', name: 'Фильтры товаров', icon: Filter, description: 'Панель фильтров по свойствам' },
      { type: 'product-sort', name: 'Сортировка', icon: SlidersHorizontal, description: 'Сортировка товаров' },
      { type: 'product-pagination', name: 'Пагинация', icon: Grid, description: 'Постраничная навигация' },
      { type: 'product-breadcrumbs', name: 'Хлебные крошки', icon: ChevronRight, description: 'Навигация по категориям' }
    ]
  }
];

export const UniversalProductComponents: React.FC<UniversalProductComponentsProps> = ({ onAddElement }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['product-catalog', 'product-configurator']));
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/catalog/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      clientLogger.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleAddElement = (component: any) => {
    const element: ElementType = {
      id: `element-${Date.now()}`,
      type: component.type,
      name: component.name,
      props: {
        categoryId: categories.length > 0 ? categories[0].id : 'doors',
        showFilters: true,
        showSearch: true,
        itemsPerPage: 12,
        sortBy: 'name',
        sortOrder: 'asc'
      },
      style: {
        width: '100%',
        height: 'auto',
        padding: '20px'
      }
    };
    onAddElement(element);
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="text-gray-500">Загрузка категорий...</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Товары и каталог</h3>
        <p className="text-sm text-gray-600">
          Компоненты для работы с товарами из каталога
        </p>
      </div>

      {universalProductGroups.map(group => (
        <div key={group.id} className="border-b border-gray-200 pb-4 last:border-b-0">
          <div
            className="flex items-center justify-between cursor-pointer py-2 hover:bg-gray-50 rounded-md px-2"
            onClick={() => toggleGroup(group.id)}
          >
            <div className="flex items-center space-x-2">
              <group.icon className="w-4 h-4 text-gray-600" />
              <span className="font-semibold text-sm text-gray-800">{group.name}</span>
            </div>
            {expandedGroups.has(group.id) ?
              <ChevronDown className="w-4 h-4 text-gray-500" /> :
              <ChevronRight className="w-4 h-4 text-gray-500" />
            }
          </div>
          
          {expandedGroups.has(group.id) && (
            <div className="grid grid-cols-1 gap-2 mt-2">
              {group.components.map(comp => (
                <div
                  key={comp.type}
                  className="flex flex-col p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  onClick={() => handleAddElement(comp)}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <comp.icon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">{comp.name}</span>
                  </div>
                  <p className="text-xs text-gray-500">{comp.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Информация о доступных категориях */}
      {categories.length > 0 && (
        <div className="mt-6 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Доступные категории:</h4>
          <div className="flex flex-wrap gap-1">
            {categories.slice(0, 6).map(category => (
              <span key={category.id} className="text-xs bg-white px-2 py-1 rounded border">
                {category.name}
              </span>
            ))}
            {categories.length > 6 && (
              <span className="text-xs text-gray-500">+{categories.length - 6} еще</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

