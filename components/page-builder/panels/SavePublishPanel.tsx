'use client';

import React, { useState } from 'react';
import { PageBuilderDocument } from '../types';

interface SavePublishPanelProps {
  document: PageBuilderDocument;
  onSave: (title: string, description: string) => Promise<void>;
  onPublish: (pageId: string) => Promise<void>;
  onLoad: (pageId: string) => Promise<void>;
  savedPages: Array<{
    id: string;
    title: string;
    description: string;
    isPublished: boolean;
    url: string;
    updatedAt: string;
  }>;
  isLoading: boolean;
}

export function SavePublishPanel({ 
  document, 
  onSave, 
  onPublish, 
  onLoad, 
  savedPages, 
  isLoading 
}: SavePublishPanelProps) {
  const [title, setTitle] = useState(document.title || '');
  const [description, setDescription] = useState(document.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = async () => {
    if (!title.trim()) {
      setSaveMessage('Введите название страницы');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');
    
    try {
      await onSave(title, description);
      setSaveMessage('✅ Страница сохранена успешно!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('❌ Ошибка при сохранении: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (pageId: string) => {
    setIsPublishing(true);
    
    try {
      await onPublish(pageId);
      setSaveMessage('✅ Страница опубликована успешно!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('❌ Ошибка при публикации: ' + (error as Error).message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLoad = async (pageId: string) => {
    try {
      await onLoad(pageId);
      setSaveMessage('✅ Страница загружена успешно!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('❌ Ошибка при загрузке: ' + (error as Error).message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white border-l border-gray-200 p-4 h-full overflow-y-auto">
      <div className="space-y-6">
        {/* Сообщения */}
        {saveMessage && (
          <div className={`p-3 rounded-lg text-sm ${
            saveMessage.includes('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {saveMessage}
          </div>
        )}

        {/* Сохранение страницы */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Сохранение страницы</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название страницы *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Название страницы"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Описание страницы"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Сохранение...' : '💾 Сохранить страницу'}
          </button>
        </div>

        {/* Сохраненные страницы */}
        {savedPages.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Сохраненные страницы</h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {savedPages.map((page) => (
                <div key={page.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {page.title}
                      </h4>
                      {page.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {page.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          page.isPublished 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {page.isPublished ? 'Опубликована' : 'Черновик'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(page.updatedAt)}
                        </span>
                      </div>
                      {page.isPublished && (
                        <div className="mt-2">
                          <a 
                            href={`/pages/${page.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            🔗 Открыть страницу
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleLoad(page.id)}
                      className="flex-1 bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-200 transition-colors"
                    >
                      📂 Загрузить
                    </button>
                    {!page.isPublished && (
                      <button
                        onClick={() => handlePublish(page.id)}
                        disabled={isPublishing}
                        className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                      >
                        {isPublishing ? '⏳' : '🚀 Опубликовать'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Статистика */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Статистика</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div>Элементов на странице: {document.elements.length}</div>
            <div>Сохранено страниц: {savedPages.length}</div>
            <div>Опубликовано: {savedPages.filter(p => p.isPublished).length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

