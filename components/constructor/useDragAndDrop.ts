// Хук для drag & drop функциональности с mouse events

import { useState, useRef, useCallback } from 'react';
import { DragState, DragItem, ProfessionalBlock } from './professionalTypes';

export const useDragAndDrop = () => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: 'move',
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    draggedBlockId: null,
    draggedItem: null,
    dropZone: null,
    dragPreview: null
  });

  const dragRef = useRef<HTMLDivElement>(null);
  const draggedItemRef = useRef<DragItem | null>(null);

  const startDrag = useCallback((
    event: React.MouseEvent,
    dragItem: DragItem,
    dragType: 'move' | 'resize' | 'new' = 'new'
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    draggedItemRef.current = dragItem;
    
    setDragState({
      isDragging: true,
      dragType,
      startPosition: { x: event.clientX, y: event.clientY },
      currentPosition: { x: event.clientX, y: event.clientY },
      draggedBlockId: dragItem.source === 'canvas' ? dragItem.id : null,
      draggedItem: dragItem,
      dropZone: null,
      dragPreview: null
    });

    // Добавляем обработчики для mouse events
    const handleMouseMove = (e: MouseEvent) => {
      setDragState(prev => ({
        ...prev,
        currentPosition: { x: e.clientX, y: e.clientY }
      }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Определяем, где произошел drop
      const canvas = document.querySelector('[data-canvas="true"]') as HTMLElement;
      if (canvas && draggedItemRef.current) {
        const rect = canvas.getBoundingClientRect();
        const position = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
        
        // Вызываем callback для обработки drop
        if (window.handleBlockDrop) {
          window.handleBlockDrop(draggedItemRef.current, position);
        }
      }

      // Убираем обработчики
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      setDragState({
        isDragging: false,
        dragType: 'move',
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        draggedBlockId: null,
        draggedItem: null,
        dropZone: null,
        dragPreview: null
      });
      
      draggedItemRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const updateDrag = useCallback((event: React.MouseEvent) => {
    if (!dragState.isDragging) return;

    setDragState(prev => ({
      ...prev,
      currentPosition: { x: event.clientX, y: event.clientY }
    }));
  }, [dragState.isDragging]);

  const endDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      dragType: 'move',
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      draggedBlockId: null,
      draggedItem: null,
      dropZone: null,
      dragPreview: null
    });
    draggedItemRef.current = null;
  }, []);

  const calculateDragOffset = useCallback(() => {
    return {
      x: dragState.currentPosition.x - dragState.startPosition.x,
      y: dragState.currentPosition.y - dragState.startPosition.y
    };
  }, [dragState]);

  return {
    dragState,
    dragRef,
    startDrag,
    updateDrag,
    endDrag,
    calculateDragOffset
  };
};

// Хук для изменения размеров блоков
export const useResize = () => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null>(null);
  const [startSize, setStartSize] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [startMouse, setStartMouse] = useState({ x: 0, y: 0 });

  const startResize = useCallback((
    event: React.MouseEvent,
    handle: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw',
    block: ProfessionalBlock
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    setIsResizing(true);
    setResizeHandle(handle);
    setStartSize({
      width: block.position.width,
      height: block.position.height,
      x: block.position.x,
      y: block.position.y
    });
    setStartMouse({ x: event.clientX, y: event.clientY });
  }, []);

  const updateResize = useCallback((
    event: React.MouseEvent,
    onResize: (blockId: string, newDimensions: BlockDimensions) => void
  ) => {
    if (!isResizing || !resizeHandle) return;

    const deltaX = event.clientX - startMouse.x;
    const deltaY = event.clientY - startMouse.y;
    
    let newWidth = startSize.width;
    let newHeight = startSize.height;
    let newX = startSize.x;
    let newY = startSize.y;

    // Вычисляем новые размеры в зависимости от ручки
    switch (resizeHandle) {
      case 'e': // правая сторона
        newWidth = Math.max(100, startSize.width + deltaX);
        break;
      case 'w': // левая сторона
        newWidth = Math.max(100, startSize.width - deltaX);
        newX = startSize.x + deltaX;
        break;
      case 's': // нижняя сторона
        newHeight = Math.max(50, startSize.height + deltaY);
        break;
      case 'n': // верхняя сторона
        newHeight = Math.max(50, startSize.height - deltaY);
        newY = startSize.y + deltaY;
        break;
      case 'se': // правый нижний угол
        newWidth = Math.max(100, startSize.width + deltaX);
        newHeight = Math.max(50, startSize.height + deltaY);
        break;
      case 'sw': // левый нижний угол
        newWidth = Math.max(100, startSize.width - deltaX);
        newHeight = Math.max(50, startSize.height + deltaY);
        newX = startSize.x + deltaX;
        break;
      case 'ne': // правый верхний угол
        newWidth = Math.max(100, startSize.width + deltaX);
        newHeight = Math.max(50, startSize.height - deltaY);
        newY = startSize.y + deltaY;
        break;
      case 'nw': // левый верхний угол
        newWidth = Math.max(100, startSize.width - deltaX);
        newHeight = Math.max(50, startSize.height - deltaY);
        newX = startSize.x + deltaX;
        newY = startSize.y + deltaY;
        break;
    }

    // Здесь нужно получить ID блока, который изменяется
    // Для этого нужно передать его в функцию
    const newDimensions = { width: newWidth, height: newHeight, x: newX, y: newY };
    // onResize(blockId, newDimensions);
  }, [isResizing, resizeHandle, startMouse, startSize]);

  const endResize = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  return {
    isResizing,
    resizeHandle,
    startResize,
    updateResize,
    endResize
  };
};
