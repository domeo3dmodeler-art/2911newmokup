'use client';

import React from 'react';
import { PublicElementRenderer } from './elements/PublicElementRenderer';
import { ModernDesignWrapper } from './elements/ModernDesignWrapper';

interface PublishedPage {
  id: string;
  title: string;
  description: string;
  url: string;
  elements: Array<{
    id: string;
    type: string;
    props: Record<string, any>;
    position: { x: number; y: number };
    size: { width: number; height: number };
    zIndex: number;
    parentId?: string;
  }>;
}

interface PublishedPageViewerProps {
  page: PublishedPage;
}

export function PublishedPageViewer({ page }: PublishedPageViewerProps) {
  // Преобразуем элементы для рендеринга
  const elements = page.elements.map(element => ({
    ...element,
    constraints: {
      minWidth: 50,
      minHeight: 50,
      maxWidth: 800,
      maxHeight: 600
    },
    style: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: 0,
      padding: { top: 8, right: 8, bottom: 8, left: 8 },
      margin: { top: 0, right: 0, bottom: 0, left: 0 }
    },
    visible: true,
    locked: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  return (
    <ModernDesignWrapper>
      {/* Заголовок страницы */}
      <div className="modern-section border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="modern-section-title">{page.title}</h1>
          {page.description && (
            <p className="modern-mt-2 text-lg text-gray-600">{page.description}</p>
          )}
        </div>
      </div>

      {/* Контент страницы */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative min-h-screen">
          {/* Рендерим элементы страницы */}
          {elements
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((element) => (
              <div
                key={element.id}
                className="absolute"
                style={{
                  left: element.position.x,
                  top: element.position.y,
                  width: element.size.width,
                  height: element.size.height,
                  zIndex: element.zIndex
                }}
              >
                <PublicElementRenderer
                  element={element}
                />
              </div>
            ))}

          {/* Если нет элементов, показываем заглушку */}
          {elements.length === 0 && (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">📄</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Страница пуста
                </h3>
                <p className="text-gray-500">
                  На этой странице пока нет элементов
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Футер */}
      <footer className="modern-section border-t border-gray-300 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>Создано с помощью Domeo Page Builder</p>
            <p className="mt-1">
              URL: <code className="bg-gray-100 px-2 py-1 rounded">{page.url}</code>
            </p>
          </div>
        </div>
      </footer>
    </ModernDesignWrapper>
  );
}
