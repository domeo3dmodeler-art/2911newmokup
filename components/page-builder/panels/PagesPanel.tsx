'use client';

import React, { useState } from 'react';
import { DocumentData, Page } from '../types';

interface PagesPanelProps {
  document: DocumentData;
  selectedPageId: string | null;
  onSelectPage: (pageId: string) => void;
  onAddPage: () => void;
  onDeletePage: (pageId: string) => void;
  onDuplicatePage: (pageId: string) => void;
  onUpdatePage: (pageId: string, updates: Partial<Page>) => void;
}

export function PagesPanel({
  document,
  selectedPageId,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onDuplicatePage,
  onUpdatePage
}: PagesPanelProps) {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEditStart = (pageId: string, currentName: string) => {
    setIsEditing(pageId);
    setEditValue(currentName);
  };

  const handleEditComplete = () => {
    if (isEditing && editValue.trim()) {
      onUpdatePage(isEditing, { name: editValue.trim() });
    }
    setIsEditing(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setIsEditing(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditComplete();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  return (
    <div className="w-32 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-1 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-gray-900">Страницы</h3>
          <button
            onClick={onAddPage}
            className="p-0.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Добавить страницу"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto">
        {document.pages.map((page) => (
          <div
            key={page.id}
            className={`group border-b border-gray-100 ${
              selectedPageId === page.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
            }`}
          >
            <div className="p-1">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {isEditing === page.id ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleEditComplete}
                      onKeyDown={handleKeyDown}
                      className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => onSelectPage(page.id)}
                      onDoubleClick={() => handleEditStart(page.id, page.name)}
                      className="w-full text-left text-xs font-medium text-gray-900 hover:text-blue-600 truncate"
                    >
                      {page.name}
                    </button>
                  )}
                </div>

                {/* Page Actions - только на hover */}
                <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {document.pages.length > 1 && (
                    <button
                      onClick={() => onDeletePage(page.id)}
                      className="p-0.5 text-gray-400 hover:text-red-600"
                      title="Удалить"
                    >
                      <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Page Info - минимальная */}
              <div className="text-xs text-gray-400">
                {page.elements.length}
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {document.pages.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">📄</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Нет страниц</h4>
            <p className="text-gray-500 text-sm mb-4">
              Добавьте первую страницу для начала работы
            </p>
            <button
              onClick={onAddPage}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Добавить страницу
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
