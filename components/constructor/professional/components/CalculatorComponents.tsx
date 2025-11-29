'use client';

import React, { useState } from 'react';
import { 
  Calculator, Package, Filter, CreditCard, ShoppingCart, 
  Settings, Star, Search, SlidersHorizontal, TrendingUp,
  Target, Zap, DollarSign, Percent, Grid, List,
  Eye, Heart, ShoppingBag, BarChart3, PieChart
} from 'lucide-react';

// ===================== КАЛЬКУЛЯТОРНЫЕ КОМПОНЕНТЫ =====================

export interface CalculatorComponentGroup {
  id: string
  name: string
  icon: React.ElementType
  components: CalculatorComponent[]
}

export interface CalculatorComponent {
  type: string
  name: string
  icon: React.ElementType
  description: string
  category: 'doors' | 'handles' | 'kits' | 'products' | 'calculators' | 'filters' | 'layout'
}

export const calculatorComponentGroups: CalculatorComponentGroup[] = [
  {
    id: 'doors',
    name: 'Двери',
    icon: Package,
    components: [
      { 
        type: 'door-configurator', 
        name: 'Конфигуратор дверей', 
        icon: Package, 
        description: 'Полный конфигуратор межкомнатных дверей с выбором стиля, модели, покрытия, цвета и размера',
        category: 'doors',
        component: 'door-configurator'
      },
      { 
        type: 'door-gallery', 
        name: 'Галерея дверей', 
        icon: Eye, 
        description: 'Визуальная галерея с фильтрацией по стилям и цветам',
        category: 'doors' 
      },
      { 
        type: 'door-details', 
        name: 'Детали двери', 
        icon: Settings, 
        description: 'Подробная карточка с характеристиками и ценами',
        category: 'doors' 
      },
      { 
        type: 'door-quick-select', 
        name: 'Быстрый выбор', 
        icon: Target, 
        description: 'Упрощенный выбор по популярным вариантам',
        category: 'doors' 
      }
    ]
  },
  {
    id: 'handles',
    name: 'Ручки',
    icon: Zap,
    components: [
      { 
        type: 'handle-selector', 
        name: 'Селектор ручек', 
        icon: Zap, 
        description: 'Выбор ручек по стилю и материалу',
        category: 'handles' 
      },
      { 
        type: 'handle-gallery', 
        name: 'Каталог ручек', 
        icon: List, 
        description: 'Полный каталог с сортировкой и фильтрами',
        category: 'handles' 
      }
    ]
  },
  {
    id: 'kits',
    name: 'Комплекты фурнитуры',
    icon: Settings,
    components: [
      { 
        type: 'hardware-kit', 
        name: 'Комплект фурнитуры', 
        icon: Settings, 
        description: 'Полный комплект: петли, замки, ручки',
        category: 'kits' 
      },
      { 
        type: 'kit-calculator', 
        name: 'Калькулятор комплекта', 
        icon: Calculator, 
        description: 'Расчет стоимости полного комплекта',
        category: 'kits' 
      }
    ]
  },
  {
    id: 'calculators',
    name: 'Калькуляторы',
    icon: Calculator,
    components: [
      { 
        type: 'price-calculator', 
        name: 'Калькулятор цены', 
        icon: DollarSign, 
        description: 'Динамический расчет итоговой стоимости',
        category: 'calculators' 
      },
      { 
        type: 'discount-calculator', 
        name: 'Калькулятор скидок', 
        icon: Percent, 
        description: 'Расчет скидок и акций',
        category: 'calculators' 
      },
      { 
        type: 'proposal-generator', 
        name: 'Генератор КП', 
        icon: BarChart3, 
        description: 'Автоматическое создание коммерческих предложений',
        category: 'calculators' 
      }
    ]
  },
  {
    id: 'filters',
    name: 'Фильтры и поиск',
    icon: Filter,
    components: [
      { 
        type: 'property-filter', 
        name: 'Фильтр свойств', 
        icon: SlidersHorizontal, 
        description: 'Фильтрация товаров по характеристикам',
        category: 'filters' 
      },
      { 
        type: 'search-bar', 
        name: 'Поисковая строка', 
        icon: Search, 
        description: 'Поиск по названию, артикулу, описанию',
        category: 'filters' 
      },
      { 
        type: 'category-tree', 
        name: 'Дерево категорий', 
        icon: Grid, 
        description: 'Навигация по категориям товаров',
        category: 'filters' 
      },
      { 
        type: 'sort-controls', 
        name: 'Сортировка', 
        icon: TrendingUp, 
        description: 'Сортировка по цене, названию, популярности',
        category: 'filters' 
      }
    ]
  },
  {
    id: 'layout',
    name: 'Расположение',
    icon: Grid,
    components: [
      { 
        type: 'product-grid', 
        name: 'Сетка товаров', 
        icon: Grid, 
        description: 'Карточки товаров в сетке',
        category: 'layout' 
      },
      { 
        type: 'product-list', 
        name: 'Список товаров', 
        icon: List, 
        description: 'Компактный список с деталями',
        category: 'layout' 
      },
      { 
        type: 'featured-products', 
        name: 'Рекомендуемые', 
        icon: Star, 
        description: 'Блок популярных товаров',
        category: 'layout' 
      },
      { 
        type: 'comparison-table', 
        name: 'Сравнительная таблица', 
        icon: PieChart, 
        description: 'Сравнение характеристик товаров',
        category: 'layout' 
      }
    ]
  }
];

export interface CalculatorComponentLibraryProps {
  onAddComponent: (component: CalculatorComponent) => void
}

export const CalculatorComponentLibrary: React.FC<CalculatorComponentLibraryProps> = ({ onAddComponent }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['doors', 'calculators', 'filters']) // По умолчанию открыты основные группы
  );

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

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full bg-gray-50">
      <div className="border-b border-gray-200 pb-3 mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Конструктор калькуляторов</h3>
        <p className="text-sm text-gray-600 mt-1">Специализированные блоки для калькуляторов товаров</p>
      </div>

      {calculatorComponentGroups.map(group => (
        <div key={group.id} className="border-b border-gray-200 pb-4 last:border-b-0">
          <div 
            className="flex items-center justify-between cursor-pointer py-2 hover:bg-gray-100 rounded-md px-2 transition-colors"
            onClick={() => toggleGroup(group.id)}
          >
            <div className="flex items-center space-x-2">
              <group.icon className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-sm text-gray-800">{group.name}</span>
            </div>
            <svg 
              className={`w-4 h-4 text-gray-500 transition-transform ${expandedGroups.has(group.id) ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {expandedGroups.has(group.id) && (
            <div className="grid grid-cols-1 gap-2 mt-3">
              {group.components.map(component => (
                <div
                  key={component.type}
                  className="flex flex-col p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                  onClick={() => onAddComponent(component)}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <component.icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-sm text-gray-800">{component.name}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{component.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
