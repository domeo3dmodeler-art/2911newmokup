'use client';

import React from 'react';
import { DoorCard } from './DoorCard';
import type { BasicState } from './types';
import { resetDependentParams, formatModelNameForCard } from './utils';

interface ModelItem {
  model: string;
  modelKey?: string;
  style: string;
  photo?: string | null;
  photos?: { cover: string | null; gallery: string[] };
  hasGallery?: boolean;
}

interface DoorListProps {
  sel: Partial<BasicState>;
  setSel: React.Dispatch<React.SetStateAction<Partial<BasicState>>>;
  models: ModelItem[];
  isLoadingModels: boolean;
  isModelCollapsed: boolean;
  setIsModelCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  selectedModelCard: ModelItem | null;
  MAX_VISIBLE_MODELS: number;
}

export function DoorList({
  sel,
  setSel,
  models,
  isLoadingModels,
  isModelCollapsed,
  setIsModelCollapsed,
  selectedModelCard,
  MAX_VISIBLE_MODELS,
}: DoorListProps) {
  // Оптимизация: мемоизируем отфильтрованные модели для рендеринга
  const visibleModels = React.useMemo(() => {
    if (!Array.isArray(models)) return [];
    // Ограничиваем количество для оптимизации рендеринга
    return models.slice(0, MAX_VISIBLE_MODELS);
  }, [models, MAX_VISIBLE_MODELS]);

  if (!sel.style) {
    return null;
  }

  return (
    <section>
      <div className="mb-2">
        {sel.model ? (
          <button
            onClick={() => setIsModelCollapsed(!isModelCollapsed)}
            className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200"
            aria-label={isModelCollapsed ? "Развернуть модели" : "Свернуть модели"}
          >
            <h2 className="text-xl font-semibold text-black flex items-center">
              Модель
              <span className="text-black text-lg font-bold mx-3">•</span>
              <span className="text-lg font-medium text-gray-900">
                {selectedModelCard ? formatModelNameForCard(selectedModelCard.model) : sel.model}
              </span>
            </h2>
            
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                isModelCollapsed ? '' : 'rotate-180'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <h2 className="text-xl font-semibold text-black">Модели</h2>
        )}
      </div>
      
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isModelCollapsed ? 'max-h-0 opacity-0' : 'opacity-100'
      }`}>
        {isLoadingModels ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-gray-600">Загрузка моделей...</span>
          </div>
        ) : Array.isArray(models) && models.length ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
              {visibleModels.map((m) => (
                <DoorCard
                  key={m.model}
                  item={m}
                  selected={sel.model === m.model}
                  onSelect={() => setSel((v) => {
                    const newSel = resetDependentParams(v, 'model');
                    newSel.model = m.model; // Используем полное название модели
                    newSel.style = m.style;
                    return newSel;
                  })}
                />
              ))}
            </div>
            {models.length > MAX_VISIBLE_MODELS && (
              <div className="text-center text-sm text-gray-500 mt-4">
                Показано {MAX_VISIBLE_MODELS} из {models.length} моделей. Используйте фильтры для уточнения поиска.
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-600 text-center py-8">Нет моделей для выбранного стиля</div>
        )}
      </div>
    </section>
  );
}

