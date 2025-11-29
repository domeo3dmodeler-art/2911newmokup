'use client';

import { useState, useCallback } from 'react';
import { DocumentData } from '../types';

interface UseHistoryReturn {
  history: DocumentData[];
  currentIndex: number;
  addToHistory: (document: DocumentData) => void;
  undo: () => DocumentData | null;
  redo: () => DocumentData | null;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

const MAX_HISTORY_SIZE = 50;

export function useHistory(initialDocument: DocumentData): UseHistoryReturn {
  const [history, setHistory] = useState<DocumentData[]>([initialDocument]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const addToHistory = useCallback((document: DocumentData) => {
    // Проверяем, что это не SSR
    if (typeof window === 'undefined') return;

    setHistory(prevHistory => {
      // Удаляем все записи после текущего индекса
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      
      // Добавляем новый документ
      newHistory.push(document);
      
      // Ограничиваем размер истории
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
        setCurrentIndex(prev => Math.max(0, prev - 1));
      } else {
        setCurrentIndex(newHistory.length - 1);
      }
      
      return newHistory;
    });
  }, [currentIndex]);

  const undo = useCallback((): DocumentData | null => {
    // Проверяем, что это не SSR
    if (typeof window === 'undefined') return null;

    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      return history[newIndex];
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback((): DocumentData | null => {
    // Проверяем, что это не SSR
    if (typeof window === 'undefined') return null;

    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      return history[newIndex];
    }
    return null;
  }, [currentIndex, history]);

  const clearHistory = useCallback(() => {
    setHistory([initialDocument]);
    setCurrentIndex(0);
  }, [initialDocument]);

  return {
    history,
    currentIndex,
    addToHistory,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    clearHistory
  };
}
