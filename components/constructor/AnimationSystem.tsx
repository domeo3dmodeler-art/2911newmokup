'use client';

import React, { useState } from 'react';
import { Button, Card } from '@/components/ui';
import { Play, Square, RotateCcw, Settings } from 'lucide-react';

interface AnimationConfig {
  id: string;
  name: string;
  type: 'enter' | 'exit' | 'hover' | 'scroll' | 'focus';
  duration: number;
  delay: number;
  easing: string;
  properties: string[];
  description: string;
}

interface AnimationSystemProps {
  elementId: string;
  onApplyAnimation: (elementId: string, animation: AnimationConfig) => void;
}

const ANIMATION_PRESETS: AnimationConfig[] = [
  // Enter animations
  {
    id: 'fade-in',
    name: 'Появление',
    type: 'enter',
    duration: 300,
    delay: 0,
    easing: 'ease-out',
    properties: ['opacity', 'transform'],
    description: 'Плавное появление элемента'
  },
  {
    id: 'slide-up',
    name: 'Снизу вверх',
    type: 'enter',
    duration: 400,
    delay: 0,
    easing: 'ease-out',
    properties: ['transform', 'opacity'],
    description: 'Элемент появляется снизу'
  },
  {
    id: 'slide-down',
    name: 'Сверху вниз',
    type: 'enter',
    duration: 400,
    delay: 0,
    easing: 'ease-out',
    properties: ['transform', 'opacity'],
    description: 'Элемент появляется сверху'
  },
  {
    id: 'zoom-in',
    name: 'Увеличение',
    type: 'enter',
    duration: 300,
    delay: 0,
    easing: 'ease-out',
    properties: ['transform', 'opacity'],
    description: 'Элемент увеличивается при появлении'
  },
  {
    id: 'bounce-in',
    name: 'Отскок',
    type: 'enter',
    duration: 600,
    delay: 0,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    properties: ['transform', 'opacity'],
    description: 'Элемент появляется с эффектом отскока'
  },

  // Hover animations
  {
    id: 'hover-scale',
    name: 'Увеличение при наведении',
    type: 'hover',
    duration: 200,
    delay: 0,
    easing: 'ease-out',
    properties: ['transform'],
    description: 'Элемент увеличивается при наведении мыши'
  },
  {
    id: 'hover-lift',
    name: 'Поднятие',
    type: 'hover',
    duration: 250,
    delay: 0,
    easing: 'ease-out',
    properties: ['transform', 'box-shadow'],
    description: 'Элемент поднимается с тенью'
  },
  {
    id: 'hover-glow',
    name: 'Свечение',
    type: 'hover',
    duration: 300,
    delay: 0,
    easing: 'ease-out',
    properties: ['box-shadow', 'border-color'],
    description: 'Элемент светится при наведении'
  },

  // Exit animations
  {
    id: 'fade-out',
    name: 'Исчезновение',
    type: 'exit',
    duration: 300,
    delay: 0,
    easing: 'ease-in',
    properties: ['opacity'],
    description: 'Плавное исчезновение элемента'
  },
  {
    id: 'slide-out-left',
    name: 'Уход влево',
    type: 'exit',
    duration: 400,
    delay: 0,
    easing: 'ease-in',
    properties: ['transform', 'opacity'],
    description: 'Элемент уходит влево'
  },
  {
    id: 'zoom-out',
    name: 'Уменьшение',
    type: 'exit',
    duration: 300,
    delay: 0,
    easing: 'ease-in',
    properties: ['transform', 'opacity'],
    description: 'Элемент уменьшается при исчезновении'
  },

  // Scroll animations
  {
    id: 'scroll-fade',
    name: 'Появление при скролле',
    type: 'scroll',
    duration: 500,
    delay: 0,
    easing: 'ease-out',
    properties: ['opacity', 'transform'],
    description: 'Элемент появляется при прокрутке'
  },
  {
    id: 'scroll-slide',
    name: 'Слайд при скролле',
    type: 'scroll',
    duration: 600,
    delay: 0,
    easing: 'ease-out',
    properties: ['transform', 'opacity'],
    description: 'Элемент выезжает при прокрутке'
  }
];

export default function AnimationSystem({ elementId, onApplyAnimation }: AnimationSystemProps) {
  const [selectedType, setSelectedType] = useState<'enter' | 'exit' | 'hover' | 'scroll' | 'focus'>('enter');
  const [customConfig, setCustomConfig] = useState<Partial<AnimationConfig>>({
    duration: 300,
    delay: 0,
    easing: 'ease-out'
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const filteredAnimations = ANIMATION_PRESETS.filter(anim => anim.type === selectedType);

  const handleApplyAnimation = (animation: AnimationConfig) => {
    const finalConfig = {
      ...animation,
      ...customConfig
    };
    onApplyAnimation(elementId, finalConfig);
  };

  const generateCSSAnimation = (animation: AnimationConfig) => {
    const { type, duration, delay, easing, properties } = animation;
    
    let keyframes = '';
    let animationName = '';
    
    switch (animation.id) {
      case 'fade-in':
        keyframes = `
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
        `;
        animationName = 'fadeIn';
        break;
        
      case 'slide-up':
        keyframes = `
          @keyframes slideUp {
            0% { 
              transform: translateY(30px); 
              opacity: 0; 
            }
            100% { 
              transform: translateY(0); 
              opacity: 1; 
            }
          }
        `;
        animationName = 'slideUp';
        break;
        
      case 'slide-down':
        keyframes = `
          @keyframes slideDown {
            0% { 
              transform: translateY(-30px); 
              opacity: 0; 
            }
            100% { 
              transform: translateY(0); 
              opacity: 1; 
            }
          }
        `;
        animationName = 'slideDown';
        break;
        
      case 'zoom-in':
        keyframes = `
          @keyframes zoomIn {
            0% { 
              transform: scale(0.8); 
              opacity: 0; 
            }
            100% { 
              transform: scale(1); 
              opacity: 1; 
            }
          }
        `;
        animationName = 'zoomIn';
        break;
        
      case 'bounce-in':
        keyframes = `
          @keyframes bounceIn {
            0% { 
              transform: scale(0.3); 
              opacity: 0; 
            }
            50% { 
              transform: scale(1.05); 
              opacity: 1; 
            }
            70% { 
              transform: scale(0.9); 
            }
            100% { 
              transform: scale(1); 
            }
          }
        `;
        animationName = 'bounceIn';
        break;
        
      case 'hover-scale':
        keyframes = `
          @keyframes hoverScale {
            0% { transform: scale(1); }
            100% { transform: scale(1.05); }
          }
        `;
        animationName = 'hoverScale';
        break;
        
      case 'hover-lift':
        keyframes = `
          @keyframes hoverLift {
            0% { 
              transform: translateY(0); 
              box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            }
            100% { 
              transform: translateY(-4px); 
              box-shadow: 0 8px 16px rgba(0,0,0,0.15); 
            }
          }
        `;
        animationName = 'hoverLift';
        break;
        
      case 'fade-out':
        keyframes = `
          @keyframes fadeOut {
            0% { opacity: 1; }
            100% { opacity: 0; }
          }
        `;
        animationName = 'fadeOut';
        break;
        
      case 'scroll-fade':
        keyframes = `
          @keyframes scrollFade {
            0% { 
              opacity: 0; 
              transform: translateY(20px); 
            }
            100% { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
        `;
        animationName = 'scrollFade';
        break;
    }
    
    return {
      keyframes,
      cssClass: `animation-${animation.id}`,
      animation: `${animationName} ${duration}ms ${easing} ${delay}ms both`
    };
  };

  const previewAnimation = (animation: AnimationConfig) => {
    const css = generateCSSAnimation(animation);
    
    // Создаем временный стиль
    const style = document.createElement('style');
    style.textContent = css.keyframes;
    document.head.appendChild(style);
    
    // Находим элемент и применяем анимацию
    const element = document.getElementById(elementId);
    if (element) {
      element.style.animation = css.animation;
      
      // Убираем анимацию после завершения
      setTimeout(() => {
        element.style.animation = '';
        document.head.removeChild(style);
      }, animation.duration + animation.delay + 100);
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Анимации</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <Play className="h-4 w-4" />
          </Button>
        </div>

        {/* Типы анимаций */}
        <div className="mb-4">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {(['enter', 'hover', 'exit', 'scroll'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  selectedType === type 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {type === 'enter' ? 'Вход' : 
                 type === 'hover' ? 'Наведение' :
                 type === 'exit' ? 'Выход' : 'Скролл'}
              </button>
            ))}
          </div>
        </div>

        {/* Настройки анимации */}
        <Card className="p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Настройки</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Длительность (мс)</label>
              <input
                type="number"
                value={customConfig.duration}
                onChange={(e) => setCustomConfig({ ...customConfig, duration: parseInt(e.target.value) || 300 })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                min="100"
                max="2000"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Задержка (мс)</label>
              <input
                type="number"
                value={customConfig.delay}
                onChange={(e) => setCustomConfig({ ...customConfig, delay: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                min="0"
                max="1000"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Функция сглаживания</label>
              <select
                value={customConfig.easing}
                onChange={(e) => setCustomConfig({ ...customConfig, easing: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="ease">ease</option>
                <option value="ease-in">ease-in</option>
                <option value="ease-out">ease-out</option>
                <option value="ease-in-out">ease-in-out</option>
                <option value="linear">linear</option>
                <option value="cubic-bezier(0.68, -0.55, 0.265, 1.55)">bounce</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Список анимаций */}
        <div className="space-y-2">
          {filteredAnimations.map(animation => (
            <Card key={animation.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 text-sm">{animation.name}</h5>
                  <p className="text-xs text-gray-600 mt-1">{animation.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs text-gray-500">
                      {animation.duration}мс
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">
                      {animation.easing}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 ml-2">
                  {isPreviewMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => previewAnimation(animation)}
                      className="p-1"
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleApplyAnimation(animation)}
                  >
                    Применить
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredAnimations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Settings className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Анимации не найдены</p>
          </div>
        )}
      </div>
    </div>
  );
}

