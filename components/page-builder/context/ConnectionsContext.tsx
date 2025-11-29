'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Типы для системы связей
export interface FilterConnection {
  id: string;
  sourceElementId: string;
  targetElementId: string;
  connectionType: 'filter' | 'data' | 'cart' | 'navigate';
  sourceProperty?: string;
  targetProperty?: string;
  isActive: boolean;
}

export interface FilterState {
  [elementId: string]: {
    propertyName: string;
    value: string;
    categoryIds: string[];
  };
}

export interface ConnectionsState {
  connections: FilterConnection[];
  filterStates: FilterState;
  globalFilters: {
    [propertyName: string]: string;
  };
}

// Действия для управления связями
type ConnectionsAction =
  | { type: 'ADD_CONNECTION'; connection: FilterConnection }
  | { type: 'REMOVE_CONNECTION'; connectionId: string }
  | { type: 'UPDATE_CONNECTION'; connectionId: string; updates: Partial<FilterConnection> }
  | { type: 'SET_FILTER_VALUE'; elementId: string; propertyName: string; value: string; categoryIds: string[] }
  | { type: 'CLEAR_FILTER'; elementId: string }
  | { type: 'SYNC_FILTERS'; globalFilters: { [propertyName: string]: string } }
  | { type: 'RESET_ALL_FILTERS' };

// Начальное состояние
const initialState: ConnectionsState = {
  connections: [],
  filterStates: {},
  globalFilters: {}
};

// Редьюсер для управления состоянием
function connectionsReducer(state: ConnectionsState, action: ConnectionsAction): ConnectionsState {
  switch (action.type) {
    case 'ADD_CONNECTION':
      return {
        ...state,
        connections: [...state.connections, action.connection]
      };

    case 'REMOVE_CONNECTION':
      return {
        ...state,
        connections: state.connections.filter(conn => conn.id !== action.connectionId)
      };

    case 'UPDATE_CONNECTION':
      return {
        ...state,
        connections: state.connections.map(conn =>
          conn.id === action.connectionId ? { ...conn, ...action.updates } : conn
        )
      };

    case 'SET_FILTER_VALUE':
      const newFilterStates = {
        ...state.filterStates,
        [action.elementId]: {
          propertyName: action.propertyName,
          value: action.value,
          categoryIds: action.categoryIds
        }
      };

      // Обновляем глобальные фильтры
      const newGlobalFilters = {
        ...state.globalFilters,
        [action.propertyName]: action.value
      };

      // Синхронизируем связанные компоненты
      const updatedConnections = state.connections.map(conn => {
        if (conn.sourceElementId === action.elementId && conn.connectionType === 'filter') {
          // Находим целевой компонент и обновляем его
          const targetFilter = newFilterStates[conn.targetElementId];
          if (targetFilter && conn.targetProperty) {
            newGlobalFilters[conn.targetProperty] = action.value;
          }
        }
        return conn;
      });

      return {
        ...state,
        filterStates: newFilterStates,
        globalFilters: newGlobalFilters,
        connections: updatedConnections
      };

    case 'CLEAR_FILTER':
      const clearedFilterStates = { ...state.filterStates };
      delete clearedFilterStates[action.elementId];
      
      return {
        ...state,
        filterStates: clearedFilterStates
      };

    case 'SYNC_FILTERS':
      return {
        ...state,
        globalFilters: action.globalFilters
      };

    case 'RESET_ALL_FILTERS':
      return {
        ...state,
        filterStates: {},
        globalFilters: {}
      };

    default:
      return state;
  }
}

// Контекст
const ConnectionsContext = createContext<{
  state: ConnectionsState;
  dispatch: React.Dispatch<ConnectionsAction>;
  addConnection: (connection: Omit<FilterConnection, 'id'>) => void;
  removeConnection: (connectionId: string) => void;
  updateConnection: (connectionId: string, updates: Partial<FilterConnection>) => void;
  setFilterValue: (elementId: string, propertyName: string, value: string, categoryIds: string[]) => void;
  clearFilter: (elementId: string) => void;
  getFilterValue: (elementName: string) => string | undefined;
  getConnectedElements: (elementId: string) => FilterConnection[];
} | null>(null);

// Провайдер контекста
export function ConnectionsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(connectionsReducer, initialState);

  const addConnection = (connection: Omit<FilterConnection, 'id'>) => {
    const newConnection: FilterConnection = {
      ...connection,
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    dispatch({ type: 'ADD_CONNECTION', connection: newConnection });
  };

  const removeConnection = (connectionId: string) => {
    dispatch({ type: 'REMOVE_CONNECTION', connectionId });
  };

  const updateConnection = (connectionId: string, updates: Partial<FilterConnection>) => {
    dispatch({ type: 'UPDATE_CONNECTION', connectionId, updates });
  };

  const setFilterValue = (elementId: string, propertyName: string, value: string, categoryIds: string[]) => {
    dispatch({ type: 'SET_FILTER_VALUE', elementId, propertyName, value, categoryIds });
  };

  const clearFilter = (elementId: string) => {
    dispatch({ type: 'CLEAR_FILTER', elementId });
  };

  const getFilterValue = (propertyName: string) => {
    return state.globalFilters[propertyName];
  };

  const getConnectedElements = (elementId: string) => {
    return state.connections.filter(conn => 
      conn.sourceElementId === elementId || conn.targetElementId === elementId
    );
  };

  return (
    <ConnectionsContext.Provider value={{
      state,
      dispatch,
      addConnection,
      removeConnection,
      updateConnection,
      setFilterValue,
      clearFilter,
      getFilterValue,
      getConnectedElements
    }}>
      {children}
    </ConnectionsContext.Provider>
  );
}

// Хук для использования контекста
export function useConnections() {
  const context = useContext(ConnectionsContext);
  if (!context) {
    throw new Error('useConnections must be used within a ConnectionsProvider');
  }
  return context;
}

// Хук для управления фильтрами
export function useFilterConnection(elementId: string, propertyName: string) {
  const { state, setFilterValue, clearFilter, getFilterValue } = useConnections();
  
  const currentValue = state.filterStates[elementId]?.value || '';
  const globalValue = getFilterValue(propertyName);

  const updateFilter = (value: string, categoryIds: string[]) => {
    setFilterValue(elementId, propertyName, value, categoryIds);
  };

  const clearCurrentFilter = () => {
    clearFilter(elementId);
  };

  return {
    currentValue,
    globalValue,
    updateFilter,
    clearCurrentFilter,
    isConnected: !!globalValue
  };
}
