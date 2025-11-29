'use client';

import React from 'react';
import type { BasicState } from './types';
import { resetDependentParams } from './utils';

// Константа стилей (вынесена из page.tsx)
const styleTiles = [
  { key: "Скрытая", bg: "linear-gradient(135deg,#f3f4f6 0%,#e5e7eb 100%)" },
  { key: "Современная", bg: "linear-gradient(135deg,#e5f0ff 0%,#e0e7ff 100%)" },
  { key: "Неоклассика", bg: "linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%)" },
  { key: "Классика", bg: "linear-gradient(135deg,#fef9c3 0%,#fde68a 100%)" },
];

interface DoorFiltersProps {
  sel: Partial<BasicState>;
  setSel: React.Dispatch<React.SetStateAction<Partial<BasicState>>>;
  isStyleCollapsed: boolean;
  setIsStyleCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isLoadingModels: boolean;
  setIsModelSelected: React.Dispatch<React.SetStateAction<boolean>>;
  setIsModelCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingModels: React.Dispatch<React.SetStateAction<boolean>>;
}

export function DoorFilters({
  sel,
  setSel,
  isStyleCollapsed,
  setIsStyleCollapsed,
  isLoadingModels,
  setIsModelSelected,
  setIsModelCollapsed,
  setIsLoadingModels,
}: DoorFiltersProps) {
  return (
    <section>
      <div className="mb-2">
        {sel.style ? (
          <button
            onClick={() => setIsStyleCollapsed(!isStyleCollapsed)}
            className="w-full flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200"
            aria-label={isStyleCollapsed ? "Развернуть стили" : "Свернуть стили"}
          >
            <h2 className="text-xl font-semibold text-black flex items-center">
              Стиль
              <span className="text-black text-lg font-bold mx-3">•</span>
              <span className="text-lg font-medium text-gray-900">{sel.style}</span>
            </h2>
            
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                isStyleCollapsed ? '' : 'rotate-180'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <h2 className="text-xl font-semibold text-black">Стиль</h2>
        )}
      </div>
      
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        isStyleCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'
      }`}>
        {isLoadingModels ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-gray-600">Загрузка стилей...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {styleTiles.map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  setSel((v) => {
                    const newSel = resetDependentParams(v, 'style');
                    newSel.style = s.key;
                    return newSel;
                  });
                  setIsModelSelected(false);
                  setIsModelCollapsed(false);
                  setIsLoadingModels(false);
                }}
                className={`group overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 ring-offset-2 ${
                  sel.style === s.key 
                    ? "bg-gray-50" 
                    : "hover:bg-gray-50"
                }`}
                aria-label={`Выбрать стиль ${s.key}`}
              >
                <div className="aspect-[16/33] flex items-center justify-center bg-white p-2">
                  {s.key === 'Скрытая' && (
                    <svg className="w-[80px] h-[160px] text-gray-400" viewBox="0 0 18 36" fill="none" stroke="currentColor" strokeWidth="0.3">
                      <rect x="2" y="2" width="14" height="32" rx="0.5"/>
                      <line x1="13" y1="18" x2="15" y2="18"/>
                    </svg>
                  )}
                  {s.key === 'Современная' && (
                    <svg className="w-[80px] h-[160px] text-gray-400" viewBox="0 0 18 36" fill="none" stroke="currentColor" strokeWidth="0.3">
                      <rect x="2" y="2" width="14" height="32" rx="0.5"/>
                      <rect x="5" y="4" width="8" height="28" rx="0.3"/>
                      <line x1="13" y1="18" x2="15" y2="18"/>
                    </svg>
                  )}
                  {s.key === 'Неоклассика' && (
                    <svg className="w-[80px] h-[160px] text-gray-400" viewBox="0 0 18 36" fill="none" stroke="currentColor" strokeWidth="0.3">
                      <rect x="2" y="2" width="14" height="32" rx="0.5"/>
                      <rect x="4" y="4" width="10" height="14" rx="0.3"/>
                      <rect x="4" y="20" width="10" height="8" rx="0.3"/>
                      <circle cx="13" cy="18" r="0.8"/>
                    </svg>
                  )}
                  {s.key === 'Классика' && (
                    <svg className="w-[80px] h-[160px] text-gray-400" viewBox="0 0 18 36" fill="none" stroke="currentColor" strokeWidth="0.3">
                      <rect x="2" y="2" width="14" height="32" rx="0.5"/>
                      <rect x="4" y="4" width="10" height="14" rx="0.3"/>
                      <rect x="5" y="5" width="8" height="12" rx="0.2"/>
                      <rect x="4" y="20" width="10" height="8" rx="0.3"/>
                      <rect x="5" y="21" width="8" height="6" rx="0.2"/>
                      <line x1="13" y1="17" x2="13" y2="19"/>
                      <line x1="13" y1="17" x2="12" y2="17"/>
                    </svg>
                  )}
                </div>
                <div className="text-center h-6 flex items-center justify-center px-1">
                  <div className="font-medium text-black text-xs leading-tight">{s.key}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

