'use client';

import React, { useState } from 'react';
import { 
  ModernDesignWrapper, 
  ModernHeading, 
  ModernButton, 
  ModernCard, 
  ModernText, 
  ModernSection,
  ModernOptionSelector,
  ModernGrid,
  ModernInput,
  ModernSelect
} from './ModernDesignWrapper';

interface ProductOption {
  value: string;
  label: string;
  image?: string;
}

export function ModernProductConfigurator() {
  const [selectedStyle, setSelectedStyle] = useState('hidden');
  const [selectedModel, setSelectedModel] = useState('model1');
  const [selectedFinish, setSelectedFinish] = useState('matte');
  const [selectedColor, setSelectedColor] = useState('white');
  const [selectedType, setSelectedType] = useState('single');
  const [width, setWidth] = useState('800');
  const [height, setHeight] = useState('2000');

  const styles: ProductOption[] = [
    { value: 'hidden', label: 'Скрытая' },
    { value: 'modern', label: 'Современная' },
    { value: 'neoclassic', label: 'Неоклассика' },
    { value: 'classic', label: 'Классика' }
  ];

  const models: ProductOption[] = [
    { value: 'model1', label: 'Модель 1' },
    { value: 'model2', label: 'Модель 2' },
    { value: 'model3', label: 'Модель 3' },
    { value: 'model4', label: 'Модель 4' }
  ];

  const finishes = [
    { value: 'matte', label: 'Матовое' },
    { value: 'glossy', label: 'Глянцевое' },
    { value: 'wood', label: 'Дерево' },
    { value: 'veneer', label: 'Шпон' }
  ];

  const colors = [
    { value: 'white', label: 'Белый' },
    { value: 'black', label: 'Черный' },
    { value: 'gray', label: 'Серый' },
    { value: 'brown', label: 'Коричневый' }
  ];

  const types = [
    { value: 'single', label: 'Одинарная' },
    { value: 'double', label: 'Двойная' },
    { value: 'sliding', label: 'Раздвижная' }
  ];

  return (
    <ModernDesignWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ModernGrid columns={3} gap="lg">
          {/* Левая колонка - Конфигурация */}
          <div className="col-span-2">
            <ModernSection title="Конфигуратор дверей">
              {/* Стиль */}
              <div className="modern-mb-6">
                <ModernHeading level={4} className="modern-mb-3">Стиль</ModernHeading>
                <ModernOptionSelector
                  options={styles}
                  selectedValue={selectedStyle}
                  onSelect={setSelectedStyle}
                />
              </div>

              {/* Модели */}
              <div className="modern-mb-6">
                <ModernHeading level={4} className="modern-mb-3">Модели (1)</ModernHeading>
                <ModernOptionSelector
                  options={models}
                  selectedValue={selectedModel}
                  onSelect={setSelectedModel}
                />
              </div>

              {/* Параметры */}
              <ModernGrid columns={2} gap="md">
                <div>
                  <ModernHeading level={4} className="modern-mb-3">Покрытие</ModernHeading>
                  <ModernSelect value={selectedFinish} onChange={(e) => setSelectedFinish(e.target.value)}>
                    {finishes.map(finish => (
                      <option key={finish.value} value={finish.value}>{finish.label}</option>
                    ))}
                  </ModernSelect>
                </div>

                <div>
                  <ModernHeading level={4} className="modern-mb-3">Цвет</ModernHeading>
                  <ModernSelect value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}>
                    {colors.map(color => (
                      <option key={color.value} value={color.value}>{color.label}</option>
                    ))}
                  </ModernSelect>
                </div>

                <div>
                  <ModernHeading level={4} className="modern-mb-3">Тип</ModernHeading>
                  <ModernSelect value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                    {types.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </ModernSelect>
                </div>

                <div>
                  <ModernHeading level={4} className="modern-mb-3">Ширина</ModernHeading>
                  <ModernInput
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="мм"
                  />
                </div>

                <div>
                  <ModernHeading level={4} className="modern-mb-3">Высота</ModernHeading>
                  <ModernInput
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="мм"
                  />
                </div>
              </ModernGrid>

              {/* Кнопка расчета */}
              <div className="modern-mt-6">
                <ModernButton variant="secondary" className="w-full">
                  В расчёт
                </ModernButton>
              </div>
            </ModernSection>
          </div>

          {/* Правая колонка - Предпросмотр и корзина */}
          <div>
            {/* Предпросмотр */}
            <ModernCard className="modern-mb-6">
              <ModernHeading level={4} className="modern-mb-4 text-center">
                {styles.find(s => s.value === selectedStyle)?.label}
              </ModernHeading>
              <div className="w-full h-64 bg-gray-100 border border-gray-300 rounded-md flex items-center justify-center">
                <ModernText variant="caption" className="text-gray-500">
                  Предпросмотр модели
                </ModernText>
              </div>
            </ModernCard>

            {/* Параметры */}
            <ModernCard className="modern-mb-6">
              <ModernHeading level={4} className="modern-mb-4">Параметры</ModernHeading>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <ModernText variant="body">Стиль:</ModernText>
                  <ModernText variant="body">{styles.find(s => s.value === selectedStyle)?.label}</ModernText>
                </div>
                <div className="flex justify-between">
                  <ModernText variant="body">Модель:</ModernText>
                  <ModernText variant="body">{models.find(m => m.value === selectedModel)?.label}</ModernText>
                </div>
                <div className="flex justify-between">
                  <ModernText variant="body">Покрытие:</ModernText>
                  <ModernText variant="body">{finishes.find(f => f.value === selectedFinish)?.label}</ModernText>
                </div>
                <div className="flex justify-between">
                  <ModernText variant="body">Цвет:</ModernText>
                  <ModernText variant="body">{colors.find(c => c.value === selectedColor)?.label}</ModernText>
                </div>
                <div className="flex justify-between">
                  <ModernText variant="body">Размер:</ModernText>
                  <ModernText variant="body">{width}×{height} мм</ModernText>
                </div>
              </div>
            </ModernCard>

            {/* Корзина */}
            <ModernCard>
              <ModernHeading level={4} className="modern-mb-4">Корзина (0)</ModernHeading>
              <ModernText variant="body" className="modern-mb-4 text-center text-gray-500">
                Корзина пуста
              </ModernText>
              <div className="space-y-2">
                <ModernButton variant="light" className="w-full text-xs">
                  КП
                </ModernButton>
                <ModernButton variant="light" className="w-full text-xs">
                  Счет
                </ModernButton>
                <ModernButton variant="light" className="w-full text-xs">
                  CSV
                </ModernButton>
                <ModernButton variant="light" className="w-full text-xs">
                  XLSX
                </ModernButton>
              </div>
            </ModernCard>
          </div>
        </ModernGrid>
      </div>
    </ModernDesignWrapper>
  );
}

