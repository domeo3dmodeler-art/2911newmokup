'use client';

import React from 'react';

interface ToolbarProps {
  isPreviewMode: boolean
  onTogglePreview: () => void
  onSave: () => void
  blocksCount: number
}

export default function Toolbar({ 
  isPreviewMode, 
  onTogglePreview, 
  onSave, 
  blocksCount 
}: ToolbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">
            Конструктор страниц
          </h1>
          <div className="text-sm text-gray-500">
            {blocksCount} блоков
          </div>
        </div>

        {/* Center */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onTogglePreview}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${isPreviewMode 
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            {isPreviewMode ? (
              <>
                <span className="mr-2">✏️</span>
                Редактировать
              </>
            ) : (
              <>
                <span className="mr-2">👁️</span>
                Предпросмотр
              </>
            )}
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onSave}
            disabled={blocksCount === 0}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${blocksCount === 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-green-500 text-white hover:bg-green-600'
              }
            `}
          >
            <span className="mr-2">💾</span>
            Сохранить
          </button>
          
          {/* Export */}
          <div className="relative group">
            <button className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm">
              📤
            </button>
            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <div className="py-1">
                <button className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
                  📁 Экспорт HTML
                </button>
                <button className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
                  🎨 Экспорт CSS
                </button>
                <button className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">
                  ⚙️ Экспорт JSON
                </button>
              </div>
            </div>
          </div>

          {/* Settings */}
          <button className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm">
            ⚙️
          </button>
        </div>
      </div>
    </div>
  )
}

