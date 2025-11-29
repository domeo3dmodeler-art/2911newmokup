'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card } from '@/components/ui';
import { useConstructor } from './ConstructorContext';
import { Sparkles, Lightbulb, Target, Zap } from 'lucide-react';
import { clientLogger } from '@/lib/logging/client-logger';

interface SmartSuggestion {
  id: string;
  type: 'layout' | 'content' | 'feature' | 'optimization';
  title: string;
  description: string;
  elements: any[];
  confidence: number;
  reasoning: string;
}

interface SmartSuggestionsProps {
  categoryId?: string;
  categoryName?: string;
}

export default function SmartSuggestions({ categoryId, categoryName }: SmartSuggestionsProps) {
  const { addElement, elements } = useConstructor();
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const generateSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      // Симуляция AI анализа категории и текущих элементов
      const aiSuggestions = await analyzeCategoryAndGenerateSuggestions(categoryId, categoryName, elements);
      setSuggestions(aiSuggestions);
    } catch (error) {
      clientLogger.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryId, categoryName, elements]);

  const analyzeCategoryAndGenerateSuggestions = async (
    categoryId?: string, 
    categoryName?: string, 
    currentElements: any[] = []
  ): Promise<SmartSuggestion[]> => {
    // Имитация AI анализа
    await new Promise(resolve => setTimeout(resolve, 1000));

    const suggestions: SmartSuggestion[] = [];

    // Анализ категории
    if (categoryName?.toLowerCase().includes('двер')) {
      suggestions.push({
        id: 'door_layout_1',
        type: 'layout',
        title: 'Стандартная схема дверей',
        description: 'Оптимальная раскладка для конфигуратора дверей с фильтрами и галереей',
        elements: [
          {
            type: 'container',
            component: 'ContainerBlock',
            props: { backgroundColor: '#f8f9fa', padding: '20px' },
            size: { width: '100%', height: 'auto' },
            position: { x: 0, y: 0 }
          },
          {
            type: 'module',
            component: 'ProductFilterBlock',
            props: { categoryId, filters: ['price', 'material', 'color'] },
            size: { width: '300px', height: 'auto' },
            position: { x: 20, y: 20 }
          },
          {
            type: 'module',
            component: 'ProductGridBlock',
            props: { categoryId, columns: 3, showPrices: true, showImages: true },
            size: { width: 'calc(100% - 340px)', height: 'auto' },
            position: { x: 340, y: 20 }
          },
          {
            type: 'module',
            component: 'ProductCartBlock',
            props: { showTotal: true, showButtons: true },
            size: { width: '100%', height: 'auto' },
            position: { x: 20, y: 400 }
          }
        ],
        confidence: 95,
        reasoning: 'На основе анализа категории "двери" - стандартная схема включает фильтры по материалу и цвету, сетку товаров и корзину'
      });

      suggestions.push({
        id: 'door_optimization_1',
        type: 'optimization',
        title: 'Улучшение UX для дверей',
        description: 'Добавьте блок сравнения и быстрого просмотра для лучшего пользовательского опыта',
        elements: [
          {
            type: 'module',
            component: 'ProductComparisonBlock',
            props: { maxItems: 3, showDifferences: true },
            size: { width: '100%', height: 'auto' },
            position: { x: 0, y: 0 }
          }
        ],
        confidence: 85,
        reasoning: 'Для категории дверей важно сравнение характеристик - пользователи часто выбирают между несколькими моделями'
      });
    }

    // Анализ текущих элементов
    const hasProductGrid = currentElements.some(el => el.component === 'ProductGridBlock');
    const hasFilter = currentElements.some(el => el.component === 'ProductFilterBlock');
    const hasCart = currentElements.some(el => el.component === 'ProductCartBlock');

    if (!hasFilter && hasProductGrid) {
      suggestions.push({
        id: 'missing_filter',
        type: 'feature',
        title: 'Добавить фильтры',
        description: 'У вас есть сетка товаров, но нет фильтров. Это может снизить удобство поиска',
        elements: [
          {
            type: 'module',
            component: 'ProductFilterBlock',
            props: { categoryId, filters: ['price', 'brand', 'rating'] },
            size: { width: '250px', height: 'auto' },
            position: { x: 20, y: 20 }
          }
        ],
        confidence: 90,
        reasoning: 'Анализ показывает, что пользователи с фильтрами находят нужные товары на 60% быстрее'
      });
    }

    if (!hasCart && hasProductGrid) {
      suggestions.push({
        id: 'missing_cart',
        type: 'feature',
        title: 'Добавить корзину',
        description: 'Для конфигуратора товаров корзина обязательна - пользователи должны видеть выбранные товары',
        elements: [
          {
            type: 'module',
            component: 'ProductCartBlock',
            props: { showTotal: true, showButtons: true, sticky: true },
            size: { width: '300px', height: 'auto' },
            position: { x: 20, y: 100 }
          }
        ],
        confidence: 100,
        reasoning: 'Корзина критически важна для конфигураторов - без неё пользователи не могут завершить покупку'
      });
    }

    // Предложения по оптимизации
    if (currentElements.length > 8) {
      suggestions.push({
        id: 'layout_optimization',
        type: 'optimization',
        title: 'Оптимизация макета',
        description: 'Слишком много элементов на странице. Рекомендуем группировку и упрощение',
        elements: [
          {
            type: 'container',
            component: 'ContainerBlock',
            props: { backgroundColor: '#ffffff', padding: '15px', borderRadius: '8px' },
            size: { width: '100%', height: 'auto' },
            position: { x: 0, y: 0 }
          }
        ],
        confidence: 75,
        reasoning: 'Слишком много элементов снижает конверсию - рекомендуется максимум 7-8 блоков на экране'
      });
    }

    return suggestions.slice(0, 3); // Показываем максимум 3 предложения
  };

  const applySuggestion = (suggestion: SmartSuggestion) => {
    suggestion.elements.forEach(element => {
      addElement(element);
    });
    
    // Убираем предложение после применения
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'layout': return <Target className="h-5 w-5 text-blue-600" />;
      case 'content': return <Lightbulb className="h-5 w-5 text-yellow-600" />;
      case 'feature': return <Zap className="h-5 w-5 text-green-600" />;
      case 'optimization': return <Sparkles className="h-5 w-5 text-purple-600" />;
      default: return <Sparkles className="h-5 w-5 text-gray-600" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50';
    if (confidence >= 75) return 'text-blue-600 bg-blue-50';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (!showSuggestions || suggestions.length === 0) {
    return (
      <div className="w-72 bg-white border-r border-gray-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Умный конструктор</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">
              {loading ? 'Анализируем...' : 'AI предложения будут здесь'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">AI Предложения</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSuggestions(false)}
          >
            ✕
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Анализируем категорию...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map(suggestion => (
              <Card key={suggestion.id} className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                        {suggestion.confidence}%
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-3">
                      {suggestion.description}
                    </p>
                    
                    <div className="text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded">
                      <strong>Обоснование:</strong> {suggestion.reasoning}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => applySuggestion(suggestion)}
                        className="flex-1"
                      >
                        Применить
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={generateSuggestions}
                disabled={loading}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Обновить предложения
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

