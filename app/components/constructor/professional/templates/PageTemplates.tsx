'use client';

import React, { useState } from 'react';
import { 
  Search, Filter, Grid, List, Eye, Star, 
  ShoppingCart, Package, Calculator, Settings,
  DoorOpen, Home, Bath, Wrench, ChevronRight,
  X, Check, Heart, TrendingUp, Users
} from 'lucide-react';
import { ElementType, Page } from '../ProfessionalPageBuilder';

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  category: 'landing' | 'catalog' | 'configurator' | 'product' | 'checkout' | 'about' | 'contact';
  preview: string;
  elements: ElementType[];
  tags: string[];
  featured: boolean;
  popular: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  industry: string[];
}

interface PageTemplatesProps {
  onSelectTemplate: (template: PageTemplate) => void;
  onClose: () => void;
}

const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'door-landing',
    name: 'Лендинг дверей',
    description: 'Современный лендинг для продажи межкомнатных дверей с конфигуратором и калькулятором',
    category: 'landing',
    preview: '/templates/door-landing.jpg',
    tags: ['двери', 'конфигуратор', 'калькулятор', 'e-commerce'],
    featured: true,
    popular: true,
    difficulty: 'beginner',
    estimatedTime: '15 минут',
    industry: ['строительство', 'интерьер'],
    elements: [
      {
        id: 'hero-section',
        type: 'container',
        name: 'Hero секция',
        props: {
          backgroundColor: '#f8fafc',
          padding: '80px 20px',
          textAlign: 'center'
        },
        style: {
          width: '100%',
          height: 'auto',
          position: 'relative'
        },
        children: [
          {
            id: 'hero-heading',
            type: 'heading',
            name: 'Заголовок',
            props: {
              text: 'Межкомнатные двери премиум класса',
              level: 1,
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#1f2937'
            },
            style: {
              width: '100%',
              height: 'auto'
            }
          },
          {
            id: 'hero-subtitle',
            type: 'text',
            name: 'Подзаголовок',
            props: {
              text: 'Выберите идеальную дверь с помощью нашего конфигуратора и получите точный расчет стоимости',
              fontSize: '20px',
              color: '#6b7280',
              maxWidth: '600px'
            },
            style: {
              width: '100%',
              height: 'auto',
              margin: '20px auto'
            }
          },
          {
            id: 'hero-cta',
            type: 'button',
            name: 'CTA кнопка',
            props: {
              text: 'Создать дверь',
              variant: 'primary',
              size: 'large',
              backgroundColor: '#3b82f6',
              color: '#ffffff'
            },
            style: {
              width: 'auto',
              height: 'auto',
              margin: '30px auto'
            }
          }
        ]
      },
      {
        id: 'door-configurator-section',
        type: 'container',
        name: 'Секция конфигуратора',
        props: {
          backgroundColor: '#ffffff',
          padding: '60px 20px'
        },
        style: {
          width: '100%',
          height: 'auto'
        },
        children: [
          {
            id: 'configurator-heading',
            type: 'heading',
            name: 'Заголовок конфигуратора',
            props: {
              text: 'Конфигуратор дверей',
              level: 2,
              fontSize: '36px',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#1f2937'
            },
            style: {
              width: '100%',
              height: 'auto',
              marginBottom: '40px'
            }
          },
          {
            id: 'door-configurator',
            type: 'door-configurator',
            name: 'Конфигуратор дверей',
            props: {
              categoryId: 'doors',
              showStyleSelector: true,
              showColorSelector: true,
              showMaterialSelector: true,
              showSizeSelector: true,
              showPriceDisplay: true,
              showProgress: true,
              configuratorType: 'step-by-step'
            },
            style: {
              width: '100%',
              height: 'auto',
              maxWidth: '800px',
              margin: '0 auto'
            }
          }
        ]
      },
      {
        id: 'price-calculator-section',
        type: 'container',
        name: 'Секция калькулятора',
        props: {
          backgroundColor: '#f8fafc',
          padding: '60px 20px'
        },
        style: {
          width: '100%',
          height: 'auto'
        },
        children: [
          {
            id: 'calculator-heading',
            type: 'heading',
            name: 'Заголовок калькулятора',
            props: {
              text: 'Калькулятор стоимости',
              level: 2,
              fontSize: '36px',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#1f2937'
            },
            style: {
              width: '100%',
              height: 'auto',
              marginBottom: '40px'
            }
          },
          {
            id: 'price-calculator',
            type: 'price-calculator',
            name: 'Калькулятор цены',
            props: {
              categoryId: 'doors',
              showBreakdown: true,
              showDelivery: true,
              showInstallation: true,
              showDiscounts: true,
              currency: 'RUB'
            },
            style: {
              width: '100%',
              height: 'auto',
              maxWidth: '600px',
              margin: '0 auto'
            }
          }
        ]
      },
      {
        id: 'product-showcase-section',
        type: 'container',
        name: 'Секция товаров',
        props: {
          backgroundColor: '#ffffff',
          padding: '60px 20px'
        },
        style: {
          width: '100%',
          height: 'auto'
        },
        children: [
          {
            id: 'showcase-heading',
            type: 'heading',
            name: 'Заголовок товаров',
            props: {
              text: 'Популярные модели',
              level: 2,
              fontSize: '36px',
              fontWeight: 'bold',
              textAlign: 'center',
              color: '#1f2937'
            },
            style: {
              width: '100%',
              height: 'auto',
              marginBottom: '40px'
            }
          },
          {
            id: 'product-grid',
            type: 'product-grid',
            name: 'Сетка товаров',
            props: {
              categoryId: 'doors',
              displayMode: 'grid',
              showPrice: true,
              showImage: true,
              showDescription: true,
              limit: 8,
              sortBy: 'popularity',
              sortOrder: 'desc'
            },
            style: {
              width: '100%',
              height: 'auto'
            }
          }
        ]
      },
      {
        id: 'cta-section',
        type: 'container',
        name: 'Финальная CTA секция',
        props: {
          backgroundColor: '#3b82f6',
          padding: '60px 20px',
          textAlign: 'center'
        },
        style: {
          width: '100%',
          height: 'auto'
        },
        children: [
          {
            id: 'cta-heading',
            type: 'heading',
            name: 'CTA заголовок',
            props: {
              text: 'Готовы создать свою идеальную дверь?',
              level: 2,
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#ffffff'
            },
            style: {
              width: '100%',
              height: 'auto',
              marginBottom: '20px'
            }
          },
          {
            id: 'cta-subtitle',
            type: 'text',
            name: 'CTA подзаголовок',
            props: {
              text: 'Начните прямо сейчас с нашего конфигуратора',
              fontSize: '18px',
              color: '#e5e7eb'
            },
            style: {
              width: '100%',
              height: 'auto',
              marginBottom: '30px'
            }
          },
          {
            id: 'cta-button',
            type: 'button',
            name: 'CTA кнопка',
            props: {
              text: 'Начать конфигурацию',
              variant: 'secondary',
              size: 'large',
              backgroundColor: '#ffffff',
              color: '#3b82f6'
            },
            style: {
              width: 'auto',
              height: 'auto'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'door-catalog',
    name: 'Каталог дверей',
    description: 'Полнофункциональный каталог с фильтрами, поиском и сортировкой',
    category: 'catalog',
    preview: '/templates/door-catalog.jpg',
    tags: ['каталог', 'фильтры', 'поиск', 'сортировка'],
    featured: false,
    popular: true,
    difficulty: 'beginner',
    estimatedTime: '10 минут',
    industry: ['строительство', 'интерьер'],
    elements: [
      {
        id: 'catalog-header',
        type: 'container',
        name: 'Заголовок каталога',
        props: {
          backgroundColor: '#ffffff',
          padding: '40px 20px',
          borderBottom: '1px solid #e5e7eb'
        },
        style: {
          width: '100%',
          height: 'auto'
        },
        children: [
          {
            id: 'catalog-title',
            type: 'heading',
            name: 'Заголовок',
            props: {
              text: 'Каталог межкомнатных дверей',
              level: 1,
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#1f2937'
            },
            style: {
              width: '100%',
              height: 'auto',
              textAlign: 'center'
            }
          }
        ]
      },
      {
        id: 'catalog-filters',
        type: 'container',
        name: 'Фильтры каталога',
        props: {
          backgroundColor: '#f8fafc',
          padding: '20px'
        },
        style: {
          width: '100%',
          height: 'auto'
        },
        children: [
          {
            id: 'product-filters',
            type: 'product-filters',
            name: 'Фильтры товаров',
            props: {
              categoryId: 'doors',
              showSearch: true,
              showPriceRange: true,
              showPropertyFilters: true,
              showSorting: true,
              showViewToggle: true,
              collapsed: false
            },
            style: {
              width: '300px',
              height: 'auto'
            }
          }
        ]
      },
      {
        id: 'catalog-content',
        type: 'container',
        name: 'Контент каталога',
        props: {
          backgroundColor: '#ffffff',
          padding: '20px'
        },
        style: {
          width: '100%',
          height: 'auto'
        },
        children: [
          {
            id: 'product-grid',
            type: 'product-grid',
            name: 'Сетка товаров',
            props: {
              categoryId: 'doors',
              displayMode: 'grid',
              showPrice: true,
              showImage: true,
              showDescription: true,
              limit: 24,
              sortBy: 'name',
              sortOrder: 'asc'
            },
            style: {
              width: '100%',
              height: 'auto'
            }
          },
          {
            id: 'pagination',
            type: 'product-pagination',
            name: 'Пагинация',
            props: {
              itemsPerPage: 24,
              showPageNumbers: true,
              showPrevNext: true
            },
            style: {
              width: '100%',
              height: 'auto',
              marginTop: '40px'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'door-configurator-page',
    name: 'Страница конфигуратора',
    description: 'Специализированная страница для конфигурации дверей с пошаговым процессом',
    category: 'configurator',
    preview: '/templates/door-configurator.jpg',
    tags: ['конфигуратор', 'пошаговый', 'калькулятор'],
    featured: true,
    popular: false,
    difficulty: 'intermediate',
    estimatedTime: '20 минут',
    industry: ['строительство', 'интерьер'],
    elements: [
      {
        id: 'configurator-header',
        type: 'container',
        name: 'Заголовок конфигуратора',
        props: {
          backgroundColor: '#3b82f6',
          padding: '60px 20px',
          textAlign: 'center'
        },
        style: {
          width: '100%',
          height: 'auto'
        },
        children: [
          {
            id: 'configurator-title',
            type: 'heading',
            name: 'Заголовок',
            props: {
              text: 'Конфигуратор межкомнатных дверей',
              level: 1,
              fontSize: '42px',
              fontWeight: 'bold',
              color: '#ffffff'
            },
            style: {
              width: '100%',
              height: 'auto',
              marginBottom: '20px'
            }
          },
          {
            id: 'configurator-subtitle',
            type: 'text',
            name: 'Подзаголовок',
            props: {
              text: 'Создайте идеальную дверь за 4 простых шага',
              fontSize: '18px',
              color: '#e5e7eb'
            },
            style: {
              width: '100%',
              height: 'auto'
            }
          }
        ]
      },
      {
        id: 'configurator-main',
        type: 'container',
        name: 'Основной конфигуратор',
        props: {
          backgroundColor: '#ffffff',
          padding: '60px 20px'
        },
        style: {
          width: '100%',
          height: 'auto'
        },
        children: [
          {
            id: 'door-configurator',
            type: 'door-configurator',
            name: 'Конфигуратор дверей',
            props: {
              categoryId: 'doors',
              showStyleSelector: true,
              showColorSelector: true,
              showMaterialSelector: true,
              showSizeSelector: true,
              showPriceDisplay: true,
              showProgress: true,
              configuratorType: 'step-by-step',
              currentStep: 1,
              totalSteps: 4
            },
            style: {
              width: '100%',
              height: 'auto',
              maxWidth: '900px',
              margin: '0 auto'
            }
          }
        ]
      },
      {
        id: 'configurator-sidebar',
        type: 'container',
        name: 'Боковая панель',
        props: {
          backgroundColor: '#f8fafc',
          padding: '40px 20px',
          position: 'fixed',
          right: '0',
          top: '0',
          width: '350px',
          height: '100vh',
          overflowY: 'auto'
        },
        style: {
          width: '350px',
          height: '100vh',
          position: 'fixed',
          right: '0',
          top: '0'
        },
        children: [
          {
            id: 'price-calculator',
            type: 'price-calculator',
            name: 'Калькулятор цены',
            props: {
              categoryId: 'doors',
              showBreakdown: true,
              showDelivery: true,
              showInstallation: true,
              showDiscounts: true,
              currency: 'RUB'
            },
            style: {
              width: '100%',
              height: 'auto'
            }
          }
        ]
      }
    ]
  },
  {
    id: 'kitchen-landing',
    name: 'Лендинг кухонь',
    description: 'Лендинг для кухонной мебели с планировщиком и калькулятором',
    category: 'landing',
    preview: '/templates/kitchen-landing.jpg',
    tags: ['кухни', 'планировщик', 'мебель'],
    featured: false,
    popular: false,
    difficulty: 'intermediate',
    estimatedTime: '25 минут',
    industry: ['мебель', 'интерьер'],
    elements: [
      {
        id: 'hero-section',
        type: 'container',
        name: 'Hero секция',
        props: {
          backgroundColor: '#f8fafc',
          padding: '80px 20px',
          textAlign: 'center'
        },
        style: {
          width: '100%',
          height: 'auto'
        },
        children: [
          {
            id: 'hero-heading',
            type: 'heading',
            name: 'Заголовок',
            props: {
              text: 'Кухни мечты от производителя',
              level: 1,
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#1f2937'
            },
            style: {
              width: '100%',
              height: 'auto'
            }
          }
        ]
      },
      {
        id: 'kitchen-configurator',
        type: 'kitchen-configurator',
        name: 'Конфигуратор кухонь',
        props: {
          categoryId: 'kitchens',
          showModules: true,
          showCountertop: true,
          showAppliances: true,
          showPriceDisplay: true
        },
        style: {
          width: '100%',
          height: 'auto'
        }
      }
    ]
  }
];

export const PageTemplates: React.FC<PageTemplatesProps> = ({
  onSelectTemplate,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'Все категории', icon: Grid },
    { id: 'landing', name: 'Лендинги', icon: Star },
    { id: 'catalog', name: 'Каталоги', icon: Package },
    { id: 'configurator', name: 'Конфигураторы', icon: Settings },
    { id: 'product', name: 'Товары', icon: ShoppingCart },
    { id: 'checkout', name: 'Оформление заказа', icon: Check },
    { id: 'about', name: 'О компании', icon: Users },
    { id: 'contact', name: 'Контакты', icon: Heart }
  ];

  const difficulties = [
    { id: 'all', name: 'Любая сложность' },
    { id: 'beginner', name: 'Начинающий' },
    { id: 'intermediate', name: 'Средний' },
    { id: 'advanced', name: 'Продвинутый' }
  ];

  const industries = [
    { id: 'all', name: 'Все отрасли' },
    { id: 'строительство', name: 'Строительство' },
    { id: 'интерьер', name: 'Интерьер' },
    { id: 'мебель', name: 'Мебель' },
    { id: 'сантехника', name: 'Сантехника' }
  ];

  const filteredTemplates = PAGE_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
    const matchesIndustry = selectedIndustry === 'all' || template.industry.includes(selectedIndustry);

    return matchesSearch && matchesCategory && matchesDifficulty && matchesIndustry;
  });

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.icon || Grid;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Начинающий';
      case 'intermediate': return 'Средний';
      case 'advanced': return 'Продвинутый';
      default: return 'Неизвестно';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Выберите шаблон</h2>
            <p className="text-gray-600 mt-1">Начните с готового дизайна и адаптируйте под свои нужды</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск шаблонов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty.id} value={difficulty.id}>
                  {difficulty.name}
                </option>
              ))}
            </select>

            {/* Industry Filter */}
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {industries.map(industry => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => {
              const CategoryIcon = getCategoryIcon(template.category);
              
              return (
                <div
                  key={template.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => onSelectTemplate(template)}
                >
                  {/* Preview Image */}
                  <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center relative">
                    <div className="text-gray-400 text-center">
                      <CategoryIcon className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Предварительный просмотр</p>
                    </div>
                    
                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      {template.featured && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                          <Star className="w-3 h-3 mr-1" />
                          Рекомендуемый
                        </span>
                      )}
                      {template.popular && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Популярный
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {template.name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(template.difficulty)}`}>
                        {getDifficultyText(template.difficulty)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {template.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{template.tags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>⏱️ {template.estimatedTime}</span>
                      <span>{template.industry.join(', ')}</span>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white rounded-md px-4 py-2 shadow-lg flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">Выбрать шаблон</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Шаблоны не найдены</h3>
              <p className="text-gray-600">Попробуйте изменить параметры поиска</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Найдено шаблонов: {filteredTemplates.length}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

