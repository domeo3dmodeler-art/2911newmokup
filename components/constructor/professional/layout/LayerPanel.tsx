'use client';

import React from 'react';
import { Eye, EyeOff, Lock, Unlock, Plus } from 'lucide-react';
import { BaseElement } from '../ProfessionalPageBuilder';

interface LayerPanelProps {
  elements: BaseElement[]
  selectedElementId: string | null
  onSelectElement: (elementId: string) => void
  onMoveElement: (fromIndex: number, toIndex: number) => void
}

export default function LayerPanel({
  elements,
  selectedElementId,
  onSelectElement,
  onMoveElement
}: LayerPanelProps) {
  
  const getElementIcon = (type: string) => {
    switch (type) {
      case 'container': return '📦'
      case 'text': return '📝'
      case 'image': return '🖼️'
      case 'button': return '🔘'
      default: return '🔷'
    }
  }

  return (
    <div className="h-full overflow-hidden">
      
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Layers</h3>
          <button className="p-1 text-gray-500 hover:text-gray-700">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Layers List */}
      <div className="overflow-y-auto h-full">
        {elements.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No elements on this page
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {elements.map((element, index) => (
              <div
                key={element.id}
                onClick={() => onSelectElement(element.id)}
                className={`
                  flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors
                  ${selectedElementId === element.id ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-50'}
                `}
              >
                {/* Visibility Toggle */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    // Toggle visibility logic
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {element.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>

                {/* Element Icon */}
                <span className="text-lg">{getElementIcon(element.type)}</span>

                {/* Element Name */}
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                  {element.name || element.type}
                </span>

                {/* Layer Order */}
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {index + 1}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="space-y-1">
          <button className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-white rounded">
            Group Selected
          </button>
          <button className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-white rounded">
            Ungroup All
          </button>
          <button className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-white rounded">
            Hide All Others
          </button>
        </div>
      </div>
    </div>
  )
}

