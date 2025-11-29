'use client';

import { useState, useCallback, useRef } from 'react';
import { DocumentData } from '../ProfessionalPageBuilder';

interface HistoryState {
  document: DocumentData;
  timestamp: number;
  action: string;
}

export function useHistory(initialDocument: DocumentData) {
  const [history, setHistory] = useState<HistoryState[]>([{
    document: initialDocument,
    timestamp: Date.now(),
    action: 'initial'
  }]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUndoRedo, setIsUndoRedo] = useState(false);

  const addToHistory = useCallback((document: DocumentData, action: string) => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    if (isUndoRedo) {
      setIsUndoRedo(false);
      return;
    }

    const newState: HistoryState = {
      document: JSON.parse(JSON.stringify(document)), // Deep clone
      timestamp: Date.now(),
      action
    };

    setHistory(prev => {
      // Remove any states after current index
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);
      
      // Limit history to 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });

    setCurrentIndex(prev => {
      const newIndex = prev + 1;
      return Math.min(newIndex, 49); // Max 50 states
    });
  }, [currentIndex, isUndoRedo]);

  const undo = useCallback(() => {
    // Only run on client side
    if (typeof window === 'undefined') return null;
    
    if (currentIndex > 0) {
      setIsUndoRedo(true);
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1].document;
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    // Only run on client side
    if (typeof window === 'undefined') return null;
    
    if (currentIndex < history.length - 1) {
      setIsUndoRedo(true);
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1].document;
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const getCurrentDocument = useCallback(() => {
    return history[currentIndex].document;
  }, [history, currentIndex]);

  const clearHistory = useCallback(() => {
    setHistory([{
      document: initialDocument,
      timestamp: Date.now(),
      action: 'initial'
    }]);
    setCurrentIndex(0);
  }, [initialDocument]);

  return {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    getCurrentDocument,
    clearHistory,
    historyLength: history.length,
    currentAction: history[currentIndex]?.action
  };
}
