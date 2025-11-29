'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { DocumentData, DocumentContextType, Page } from '../types';
import { clientLogger } from '@/lib/logging/client-logger';

const DocumentContext = createContext<DocumentContextType | null>(null);

interface DocumentProviderProps {
  value: DocumentData;
  children: ReactNode;
}

export function DocumentProvider({ value, children }: DocumentProviderProps) {
  const updateDocument = (updates: Partial<DocumentData>) => {
    // Эта функция будет реализована в родительском компоненте
    clientLogger.debug('Обновление документа:', updates);
  };

  const addPage = (page: Page) => {
    clientLogger.debug('Добавление страницы:', page);
  };

  const updatePage = (pageId: string, updates: Partial<Page>) => {
    clientLogger.debug('Обновление страницы:', pageId, updates);
  };

  const deletePage = (pageId: string) => {
    clientLogger.debug('Удаление страницы:', pageId);
  };

  const contextValue: DocumentContextType = {
    document: value,
    updateDocument,
    addPage,
    updatePage,
    deletePage
  };

  return (
    <DocumentContext.Provider value={contextValue}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
}
