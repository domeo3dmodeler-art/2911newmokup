'use client';

import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { ConstructorElement, ConstructorState, ConstructorContextType } from './types';
import { v4 as uuidv4 } from '../../lib/utils/uuid';

// Типы действий
type ConstructorAction =
  | { type: 'ADD_ELEMENT'; payload: Partial<ConstructorElement> }
  | { type: 'UPDATE_ELEMENT'; payload: { id: string; updates: Partial<ConstructorElement> } }
  | { type: 'DELETE_ELEMENT'; payload: string }
  | { type: 'SELECT_ELEMENT'; payload: string | null }
  | { type: 'MOVE_ELEMENT'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'RESIZE_ELEMENT'; payload: { id: string; size: { width: string; height: string } } }
  | { type: 'DUPLICATE_ELEMENT'; payload: string }
  | { type: 'SAVE_TO_HISTORY' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_STATE'; payload: ConstructorState }
  | { type: 'RESET_STATE' };

// Начальное состояние
const initialState: ConstructorState = {
  elements: [],
  selectedElementId: null,
  history: [],
  historyPointer: -1,
};

// Редюсер
function constructorReducer(state: ConstructorState, action: ConstructorAction): ConstructorState {
  switch (action.type) {
    case 'ADD_ELEMENT': {
      const newElement: ConstructorElement = {
        id: uuidv4(),
        type: action.payload.type || 'block',
        component: action.payload.component || 'TextBlock',
        props: action.payload.props || {},
        children: action.payload.children || [],
        position: action.payload.position || { x: 0, y: 0 },
        size: action.payload.size || { width: '100%', height: 'auto' },
        responsive: action.payload.responsive || {},
        animations: action.payload.animations || [],
        styles: action.payload.styles || {},
      };

      return {
        ...state,
        elements: [...state.elements, newElement],
        selectedElementId: newElement.id,
      };
    }

    case 'UPDATE_ELEMENT': {
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.payload.id ? { ...el, ...action.payload.updates } : el
        ),
      };
    }

    case 'DELETE_ELEMENT': {
      return {
        ...state,
        elements: state.elements.filter((el) => el.id !== action.payload),
        selectedElementId: state.selectedElementId === action.payload ? null : state.selectedElementId,
      };
    }

    case 'SELECT_ELEMENT': {
      return {
        ...state,
        selectedElementId: action.payload,
      };
    }

    case 'MOVE_ELEMENT': {
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.payload.id
            ? { ...el, position: action.payload.position }
            : el
        ),
      };
    }

    case 'RESIZE_ELEMENT': {
      return {
        ...state,
        elements: state.elements.map((el) =>
          el.id === action.payload.id
            ? { ...el, size: action.payload.size }
            : el
        ),
      };
    }

    case 'DUPLICATE_ELEMENT': {
      const elementToDuplicate = state.elements.find((el) => el.id === action.payload);
      if (!elementToDuplicate) return state;

      const duplicatedElement: ConstructorElement = {
        ...elementToDuplicate,
        id: uuidv4(),
        position: {
          x: elementToDuplicate.position.x + 20,
          y: elementToDuplicate.position.y + 20,
        },
      };

      return {
        ...state,
        elements: [...state.elements, duplicatedElement],
        selectedElementId: duplicatedElement.id,
      };
    }

    case 'SAVE_TO_HISTORY': {
      const newHistory = state.history.slice(0, state.historyPointer + 1);
      const currentState = {
        elements: [...state.elements],
        selectedElementId: state.selectedElementId,
        history: [],
        historyPointer: -1
      };
      newHistory.push(currentState);
      
      return {
        ...state,
        history: newHistory,
        historyPointer: newHistory.length - 1,
      };
    }

    case 'UNDO': {
      if (state.historyPointer > 0) {
        const previousState = state.history[state.historyPointer - 1];
        return {
          ...previousState,
          history: state.history,
          historyPointer: state.historyPointer - 1,
        };
      }
      return state;
    }

    case 'REDO': {
      if (state.historyPointer < state.history.length - 1) {
        const nextState = state.history[state.historyPointer + 1];
        return {
          ...nextState,
          history: state.history,
          historyPointer: state.historyPointer + 1,
        };
      }
      return state;
    }

    case 'LOAD_STATE': {
      return action.payload;
    }

    case 'RESET_STATE': {
      return initialState;
    }

    default:
      return state;
  }
}

// Контекст

const ConstructorContext = createContext<ConstructorContextType | null>(null);

// Провайдер
export function ConstructorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(constructorReducer, initialState);

  const addElement = useCallback((element: Partial<ConstructorElement>) => {
    dispatch({ type: 'ADD_ELEMENT', payload: element });
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<ConstructorElement>) => {
    dispatch({ type: 'UPDATE_ELEMENT', payload: { id, updates } });
  }, []);

  const deleteElement = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ELEMENT', payload: id });
  }, []);

  const selectElement = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_ELEMENT', payload: id });
  }, []);

  const moveElement = useCallback((id: string, position: { x: number; y: number }) => {
    dispatch({ type: 'MOVE_ELEMENT', payload: { id, position } });
  }, []);

  const resizeElement = useCallback((id: string, size: { width: string; height: string }) => {
    dispatch({ type: 'RESIZE_ELEMENT', payload: { id, size } });
  }, []);

  const duplicateElement = useCallback((id: string) => {
    dispatch({ type: 'DUPLICATE_ELEMENT', payload: id });
  }, []);

  const saveToHistory = useCallback(() => {
    dispatch({ type: 'SAVE_TO_HISTORY' });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const loadState = useCallback((newState: ConstructorState) => {
    dispatch({ type: 'LOAD_STATE', payload: newState });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const canUndo = state.historyPointer > 0;
  const canRedo = state.historyPointer < state.history.length - 1;
  const selectedElement = state.elements.find((el) => el.id === state.selectedElementId) || null;

  const value: ConstructorContextType = {
    state,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    moveElement,
    resizeElement,
    duplicateElement,
    saveToHistory,
    undo,
    redo,
    loadState,
    resetState,
    canUndo,
    canRedo,
    selectedElement,
  };

  return (
    <ConstructorContext.Provider value={value}>
      {children}
    </ConstructorContext.Provider>
  );
}

// Хук для использования контекста
export function useConstructor() {
  const context = useContext(ConstructorContext);
  if (!context) {
    throw new Error('useConstructor must be used within a ConstructorProvider');
  }
  return context;
}
