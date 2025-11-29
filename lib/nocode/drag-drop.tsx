'use client';

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { 
  DragDropItem, 
  ComponentConfig, 
  DragDropState, 
  DropZone,
  ComponentType 
} from './types';

// ===================== Drag & Drop Context =====================

interface DragDropContextType {
  state: DragDropState;
  dropZones: DropZone[];
  components: ComponentConfig[];
  
  // Actions
  startDrag: (item: DragDropItem) => void;
  endDrag: () => void;
  updateDragPosition: (x: number, y: number) => void;
  setDropTarget: (targetId: string | null) => void;
  addComponent: (component: ComponentConfig) => void;
  updateComponent: (id: string, updates: Partial<ComponentConfig>) => void;
  removeComponent: (id: string) => void;
  moveComponent: (id: string, position: { x: number; y: number }) => void;
  resizeComponent: (id: string, size: { width: number; height: number }) => void;
  selectComponent: (id: string | null) => void;
  duplicateComponent: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  toggleLock: (id: string) => void;
  
  // Utilities
  snapToGrid: (position: { x: number; y: number }) => { x: number; y: number };
  getComponentBounds: (id: string) => { x: number; y: number; width: number; height: number } | null;
  isOverlapping: (id1: string, id2: string) => boolean;
  findDropZone: (x: number, y: number) => DropZone | null;
}

const DragDropContext = createContext<DragDropContextType | null>(null);

// ===================== Drag & Drop Reducer =====================

type DragDropAction =
  | { type: 'START_DRAG'; payload: DragDropItem }
  | { type: 'END_DRAG' }
  | { type: 'UPDATE_DRAG_POSITION'; payload: { x: number; y: number } }
  | { type: 'SET_DROP_TARGET'; payload: string | null }
  | { type: 'ADD_COMPONENT'; payload: ComponentConfig }
  | { type: 'UPDATE_COMPONENT'; payload: { id: string; updates: Partial<ComponentConfig> } }
  | { type: 'REMOVE_COMPONENT'; payload: string }
  | { type: 'MOVE_COMPONENT'; payload: { id: string; position: { x: number; y: number } } }
  | { type: 'RESIZE_COMPONENT'; payload: { id: string; size: { width: number; height: number } } }
  | { type: 'SELECT_COMPONENT'; payload: string | null }
  | { type: 'DUPLICATE_COMPONENT'; payload: string }
  | { type: 'BRING_TO_FRONT'; payload: string }
  | { type: 'SEND_TO_BACK'; payload: string }
  | { type: 'TOGGLE_LOCK'; payload: string }
  | { type: 'SET_GRID_SIZE'; payload: number }
  | { type: 'TOGGLE_SNAP_TO_GRID' };

interface DragDropStateExtended extends DragDropState {
  components: ComponentConfig[];
  selectedComponent: string | null;
  gridSize: number;
  snapToGrid: boolean;
}

const initialState: DragDropStateExtended = {
  isDragging: false,
  draggedItem: null,
  dropTarget: null,
  dragOffset: { x: 0, y: 0 },
  snapToGrid: true,
  gridSize: 20,
  components: [],
  selectedComponent: null,
};

function dragDropReducer(state: DragDropStateExtended, action: DragDropAction): DragDropStateExtended {
  switch (action.type) {
    case 'START_DRAG':
      return {
        ...state,
        isDragging: true,
        draggedItem: action.payload,
        dragOffset: { x: 0, y: 0 },
      };

    case 'END_DRAG':
      return {
        ...state,
        isDragging: false,
        draggedItem: null,
        dropTarget: null,
        dragOffset: { x: 0, y: 0 },
      };

    case 'UPDATE_DRAG_POSITION':
      return {
        ...state,
        dragOffset: action.payload,
      };

    case 'SET_DROP_TARGET':
      return {
        ...state,
        dropTarget: action.payload,
      };

    case 'ADD_COMPONENT':
      return {
        ...state,
        components: [...state.components, action.payload],
      };

    case 'UPDATE_COMPONENT':
      return {
        ...state,
        components: state.components.map(comp =>
          comp.id === action.payload.id
            ? { ...comp, ...action.payload.updates, updatedAt: new Date() }
            : comp
        ),
      };

    case 'REMOVE_COMPONENT':
      return {
        ...state,
        components: state.components.filter(comp => comp.id !== action.payload),
        selectedComponent: state.selectedComponent === action.payload ? null : state.selectedComponent,
      };

    case 'MOVE_COMPONENT':
      return {
        ...state,
        components: state.components.map(comp =>
          comp.id === action.payload.id
            ? { ...comp, position: action.payload.position, updatedAt: new Date() }
            : comp
        ),
      };

    case 'RESIZE_COMPONENT':
      return {
        ...state,
        components: state.components.map(comp =>
          comp.id === action.payload.id
            ? { ...comp, size: action.payload.size, updatedAt: new Date() }
            : comp
        ),
      };

    case 'SELECT_COMPONENT':
      return {
        ...state,
        selectedComponent: action.payload,
      };

    case 'DUPLICATE_COMPONENT':
      const componentToDuplicate = state.components.find(comp => comp.id === action.payload);
      if (!componentToDuplicate) return state;
      
      const duplicatedComponent: ComponentConfig = {
        ...componentToDuplicate,
        id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: {
          x: componentToDuplicate.position.x + 20,
          y: componentToDuplicate.position.y + 20,
        },
        zIndex: Math.max(...state.components.map(c => c.zIndex)) + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      return {
        ...state,
        components: [...state.components, duplicatedComponent],
        selectedComponent: duplicatedComponent.id,
      };

    case 'BRING_TO_FRONT':
      const maxZIndex = Math.max(...state.components.map(c => c.zIndex));
      return {
        ...state,
        components: state.components.map(comp =>
          comp.id === action.payload
            ? { ...comp, zIndex: maxZIndex + 1, updatedAt: new Date() }
            : comp
        ),
      };

    case 'SEND_TO_BACK':
      const minZIndex = Math.min(...state.components.map(c => c.zIndex));
      return {
        ...state,
        components: state.components.map(comp =>
          comp.id === action.payload
            ? { ...comp, zIndex: minZIndex - 1, updatedAt: new Date() }
            : comp
        ),
      };

    case 'TOGGLE_LOCK':
      return {
        ...state,
        components: state.components.map(comp =>
          comp.id === action.payload
            ? { ...comp, locked: !comp.locked, updatedAt: new Date() }
            : comp
        ),
      };

    case 'SET_GRID_SIZE':
      return {
        ...state,
        gridSize: action.payload,
      };

    case 'TOGGLE_SNAP_TO_GRID':
      return {
        ...state,
        snapToGrid: !state.snapToGrid,
      };

    default:
      return state;
  }
}

// ===================== Drag & Drop Provider =====================

interface DragDropProviderProps {
  children: React.ReactNode;
  initialComponents?: ComponentConfig[];
  dropZones?: DropZone[];
}

export function DragDropProvider({ 
  children, 
  initialComponents = [], 
  dropZones = [] 
}: DragDropProviderProps) {
  const [state, dispatch] = useReducer(dragDropReducer, {
    ...initialState,
    components: initialComponents,
  });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Actions
  const startDrag = useCallback((item: DragDropItem) => {
    dispatch({ type: 'START_DRAG', payload: item });
  }, []);

  const endDrag = useCallback(() => {
    dispatch({ type: 'END_DRAG' });
  }, []);

  const updateDragPosition = useCallback((x: number, y: number) => {
    dispatch({ type: 'UPDATE_DRAG_POSITION', payload: { x, y } });
  }, []);

  const setDropTarget = useCallback((targetId: string | null) => {
    dispatch({ type: 'SET_DROP_TARGET', payload: targetId });
  }, []);

  const addComponent = useCallback((component: ComponentConfig) => {
    dispatch({ type: 'ADD_COMPONENT', payload: component });
  }, []);

  const updateComponent = useCallback((id: string, updates: Partial<ComponentConfig>) => {
    dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates } });
  }, []);

  const removeComponent = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_COMPONENT', payload: id });
  }, []);

  const moveComponent = useCallback((id: string, position: { x: number; y: number }) => {
    dispatch({ type: 'MOVE_COMPONENT', payload: { id, position } });
  }, []);

  const resizeComponent = useCallback((id: string, size: { width: number; height: number }) => {
    dispatch({ type: 'RESIZE_COMPONENT', payload: { id, size } });
  }, []);

  const selectComponent = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_COMPONENT', payload: id });
  }, []);

  const duplicateComponent = useCallback((id: string) => {
    dispatch({ type: 'DUPLICATE_COMPONENT', payload: id });
  }, []);

  const bringToFront = useCallback((id: string) => {
    dispatch({ type: 'BRING_TO_FRONT', payload: id });
  }, []);

  const sendToBack = useCallback((id: string) => {
    dispatch({ type: 'SEND_TO_BACK', payload: id });
  }, []);

  const toggleLock = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_LOCK', payload: id });
  }, []);

  // Utilities
  const snapToGrid = useCallback((position: { x: number; y: number }) => {
    if (!state.snapToGrid) return position;
    
    return {
      x: Math.round(position.x / state.gridSize) * state.gridSize,
      y: Math.round(position.y / state.gridSize) * state.gridSize,
    };
  }, [state.snapToGrid, state.gridSize]);

  const getComponentBounds = useCallback((id: string) => {
    const component = state.components.find(comp => comp.id === id);
    if (!component) return null;
    
    return {
      x: component.position.x,
      y: component.position.y,
      width: component.size.width,
      height: component.size.height,
    };
  }, [state.components]);

  const isOverlapping = useCallback((id1: string, id2: string) => {
    const bounds1 = getComponentBounds(id1);
    const bounds2 = getComponentBounds(id2);
    
    if (!bounds1 || !bounds2) return false;
    
    return !(
      bounds1.x + bounds1.width < bounds2.x ||
      bounds2.x + bounds2.width < bounds1.x ||
      bounds1.y + bounds1.height < bounds2.y ||
      bounds2.y + bounds2.height < bounds1.y
    );
  }, [getComponentBounds]);

  const findDropZone = useCallback((x: number, y: number) => {
    return dropZones.find(zone => {
      const { bounds } = zone;
      return (
        x >= bounds.x &&
        x <= bounds.x + bounds.width &&
        y >= bounds.y &&
        y <= bounds.y + bounds.height
      );
    }) || null;
  }, [dropZones]);

  const contextValue: DragDropContextType = {
    state,
    dropZones,
    components: state.components,
    startDrag,
    endDrag,
    updateDragPosition,
    setDropTarget,
    addComponent,
    updateComponent,
    removeComponent,
    moveComponent,
    resizeComponent,
    selectComponent,
    duplicateComponent,
    bringToFront,
    sendToBack,
    toggleLock,
    snapToGrid,
    getComponentBounds,
    isOverlapping,
    findDropZone,
  };

  return (
    <DragDropContext.Provider value={contextValue}>
      {children}
    </DragDropContext.Provider>
  );
}

// ===================== Hook =====================

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
}

// ===================== Drag Handle Component =====================

interface DragHandleProps {
  componentId: string;
  componentType: ComponentType;
  children: React.ReactNode;
  className?: string;
}

export function DragHandle({ 
  componentId, 
  componentType, 
  children, 
  className = '' 
}: DragHandleProps) {
  const { startDrag, endDrag, updateDragPosition, snapToGrid } = useDragDrop();
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    const dragItem: DragDropItem = {
      id: componentId,
      type: componentType,
      position: { x: 0, y: 0 },
      size: { width: 0, height: 0 },
      zIndex: 0,
      locked: false,
    };
    
    startDrag(dragItem);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const snappedPosition = snapToGrid({ x: deltaX, y: deltaY });
    updateDragPosition(snappedPosition.x, snappedPosition.y);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      endDrag();
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove as any);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div
      className={`drag-handle cursor-move select-none ${className}`}
      onMouseDown={handleMouseDown}
      style={{
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {children}
    </div>
  );
}

// ===================== Drop Zone Component =====================

interface DropZoneProps {
  zoneId: string;
  accepts: ComponentType[];
  maxItems?: number;
  children: React.ReactNode;
  className?: string;
  onDrop?: (componentId: string, position: { x: number; y: number }) => void;
}

export function DropZone({ 
  zoneId, 
  accepts, 
  maxItems, 
  children, 
  className = '',
  onDrop 
}: DropZoneProps) {
  const { state, setDropTarget, addComponent, snapToGrid } = useDragDrop();
  const [isDragOver, setIsDragOver] = React.useState(false);
  const zoneRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    setDropTarget(zoneId);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setDropTarget(null);
    
    if (!state.draggedItem || !zoneRef.current) return;
    
    const rect = zoneRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const snappedPosition = snapToGrid({ x, y });
    
    if (onDrop) {
      onDrop(state.draggedItem.id, snappedPosition);
    }
  };

  return (
    <div
      ref={zoneRef}
      className={`drop-zone ${className} ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        minHeight: '200px',
        border: isDragOver ? '2px dashed #3b82f6' : '2px dashed transparent',
        backgroundColor: isDragOver ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        transition: 'all 0.2s ease',
      }}
    >
      {children}
    </div>
  );
}