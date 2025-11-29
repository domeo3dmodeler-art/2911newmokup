'use client';

import React from 'react';
import { Plus, Copy, Trash2, Eye } from 'lucide-react';
import { Page } from '../ProfessionalPageBuilder';

interface PagesPanelProps {
  pages: Page[]
  selectedPageId: string
  onSelectPage: (pageId: string) => void
  onAddPage: () => void
  onDuplicatePage: (pageId: string) => void
  onDeletePage: (pageId: string) => void
}

export default function PagesPanel({
  pages,
  selectedPageId,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage
}: PagesPanelProps) {
  
  return (
    <div className="h-full overflow-hidden">
      
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Pages</h3>
          <button 
            onClick={onAddPage}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pages List */}
      <div className="overflow-y-auto h-full">
        <div className="space-y-1 p-2">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`
                group relative p-3 rounded-lg cursor-pointer transition-colors
                ${selectedPageId === page.id ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-50'}
              `}
              onClick={() => onSelectPage(page.id)}
            >
              <div className="flex items-center space-x-3">
                {/* Page Icon */}
                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">
                  📄
                </div>
                
                {/* Page Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {page.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {page.slug}
                  </div>
                </div>

                {/* Page Actions */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      onDuplicatePage(page.id)
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 rounded"
                    title="Duplicate Page"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  
                  {pages.length > 1 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeletePage(page.id)
                      }}
                      className="p-1 text-gray-500 hover:text-red-600 rounded"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="space-y-1">
          <button className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-white rounded">
            Import Page
          </button>
          <button className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-white rounded">
            Page Templates
          </button>
          <button className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-white rounded">
            Export Pages
          </button>
        </div>
      </div>
    </div>
  )
}

