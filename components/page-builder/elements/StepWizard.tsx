'use client';

import React, { useState, useEffect } from 'react';
import { BaseElement } from '../types';

interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  required?: boolean;
  completed?: boolean;
}

interface StepWizardProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

export function StepWizard({ element, onUpdate }: StepWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepData, setStepData] = useState<Record<string, any>>({});
  
  const steps: WizardStep[] = element.props.steps || [
    { id: 'category', title: 'Выберите категорию', description: 'Основной тип товара', required: true },
    { id: 'style', title: 'Стиль и дизайн', description: 'Внешний вид и материалы', required: true },
    { id: 'size', title: 'Размеры', description: 'Габариты и пропорции', required: true },
    { id: 'options', title: 'Дополнительные опции', description: 'Фурнитура и аксессуары', required: false },
    { id: 'review', title: 'Проверка заказа', description: 'Итоговая конфигурация', required: true }
  ];

  const handleStepComplete = (stepIndex: number, data: any) => {
    setStepData(prev => ({ ...prev, [steps[stepIndex].id]: data }));
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
    
    // Автоматически переходим к следующему шагу
    if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Можно переходить только к завершенным шагам или следующему
    if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
      setCurrentStep(stepIndex);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = (step: WizardStep, stepIndex: number) => {
    switch (step.id) {
      case 'category':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Выберите категорию</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {['Межкомнатные двери', 'Входные двери', 'Раздвижные двери', 'Стеклянные двери', 'Бронированные двери'].map(category => (
                <button
                  key={category}
                  onClick={() => handleStepComplete(stepIndex, { category })}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="font-medium text-sm">{category}</div>
                  <div className="text-xs text-gray-600">от 15 000 ₽</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'style':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Стиль и материалы</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Стиль</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg">
                  <option>Современный</option>
                  <option>Классический</option>
                  <option>Минимализм</option>
                  <option>Прованс</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Материал</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg">
                  <option>МДФ</option>
                  <option>Массив дерева</option>
                  <option>Шпон</option>
                  <option>ПВХ</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => handleStepComplete(stepIndex, { style: 'modern', material: 'mdf' })}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Продолжить
              </button>
            </div>
          </div>
        );

      case 'size':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Размеры</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Ширина (мм)</label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="600"
                  min="400"
                  max="1200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Высота (мм)</label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="2000"
                  min="1800"
                  max="2400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Толщина (мм)</label>
                <select className="w-full p-3 border border-gray-300 rounded-lg">
                  <option>35</option>
                  <option>40</option>
                  <option>45</option>
                  <option>50</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => handleStepComplete(stepIndex, { width: 600, height: 2000, thickness: 35 })}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Продолжить
              </button>
            </div>
          </div>
        );

      case 'options':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Дополнительные опции</h3>
            <div className="space-y-4">
              {[
                { name: 'Ручки', price: '2 500 ₽', description: 'Современные ручки' },
                { name: 'Замок', price: '3 500 ₽', description: 'Цилиндровый замок' },
                { name: 'Петли', price: '1 500 ₽', description: 'Скрытые петли' },
                { name: 'Доводчик', price: '4 000 ₽', description: 'Автоматический доводчик' }
              ].map((option, index) => (
                <label key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <div>
                      <div className="font-medium">{option.name}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-blue-600">{option.price}</div>
                </label>
              ))}
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => handleStepComplete(stepIndex, { options: ['handles', 'lock'] })}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Продолжить
              </button>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Итоговая конфигурация</h3>
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Конфигурация</h4>
                  <div className="space-y-2 text-sm">
                    <div>Категория: {stepData.category?.category || 'Не выбрано'}</div>
                    <div>Стиль: {stepData.style?.style || 'Не выбрано'}</div>
                    <div>Материал: {stepData.style?.material || 'Не выбрано'}</div>
                    <div>Размеры: {stepData.size ? `${stepData.size.width}×${stepData.size.height}×${stepData.size.thickness}` : 'Не выбрано'}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Цена</h4>
                  <div className="text-2xl font-bold text-blue-600">45 000 ₽</div>
                  <div className="text-sm text-gray-600 mt-2">Включая все выбранные опции</div>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => handleStepComplete(stepIndex, { confirmed: true })}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Добавить в корзину
              </button>
              <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                Сохранить конфигурацию
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-600">Контент для шага "{step.title}"</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full p-4">
      <div className="max-w-5xl mx-auto h-full flex flex-col">
        {/* Компактный заголовок */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {element.props.title || 'Конфигуратор товара'}
          </h2>
        </div>

        {/* Компактный индикатор прогресса */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={`flex items-center p-2 rounded-lg transition-all ${
                  index === currentStep
                    ? 'bg-blue-100 text-blue-600'
                    : completedSteps.has(index)
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                } ${
                  index <= currentStep || completedSteps.has(index)
                    ? 'cursor-pointer hover:bg-opacity-80'
                    : 'cursor-not-allowed'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                  completedSteps.has(index)
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {completedSteps.has(index) ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="text-sm font-medium">{step.title}</div>
              </button>
            ))}
          </div>
          
          {/* Прогресс-бар */}
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Контент текущего шага */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 overflow-y-auto">
          {renderStepContent(steps[currentStep], currentStep)}
        </div>

        {/* Компактная навигация */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className={`px-4 py-2 rounded-lg text-sm ${
              currentStep === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ← Назад
          </button>
          
          <div className="text-sm text-gray-600">
            {currentStep + 1} из {steps.length}
          </div>
          
          <button
            onClick={handleNext}
            disabled={currentStep === steps.length - 1}
            className={`px-4 py-2 rounded-lg text-sm ${
              currentStep === steps.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Далее →
          </button>
        </div>
      </div>
    </div>
  );
}
