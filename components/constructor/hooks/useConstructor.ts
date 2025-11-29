import { useState, useCallback } from 'react';
import { ConstructorElement, ConstructorState, BlockType } from '../types';
import { BLOCK_DEFINITIONS } from '../blockDefinitions';

export function useConstructor() {
  const [state, setState] = useState<ConstructorState>({
    elements: [],
    selectedElement: null,
    viewport: 'desktop',
    zoom: 1,
    grid: true,
    snapToGrid: true
  });

  // Добавить элемент
  const addElement = useCallback((blockType: BlockType, position: { x: number; y: number }) => {
    const blockDef = BLOCK_DEFINITIONS[blockType];
    if (!blockDef) return;

    const newElement: ConstructorElement = {
      id: `element-${Date.now()}`,
      type: 'block',
      component: blockType,
      props: { ...blockDef.defaultProps },
      position,
      size: { ...blockDef.defaultSize },
      responsive: {
        desktop: {
          width: blockDef.defaultSize.width,
          height: blockDef.defaultSize.height,
          position,
          visible: true,
          styles: {}
        },
        tablet: {
          width: blockDef.defaultSize.width * 0.8,
          height: blockDef.defaultSize.height,
          position,
          visible: true,
          styles: {}
        },
        mobile: {
          width: blockDef.defaultSize.width * 0.6,
          height: blockDef.defaultSize.height,
          position,
          visible: true,
          styles: {}
        }
      },
      zIndex: state.elements.length
    };

    setState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      selectedElement: newElement.id
    }));
  }, [state.elements.length]);

  // Обновить элемент
  const updateElement = useCallback((id: string, updates: Partial<ConstructorElement>) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      )
    }));
  }, []);

  // Удалить элемент
  const removeElement = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id),
      selectedElement: prev.selectedElement === id ? null : prev.selectedElement
    }));
  }, []);

  // Выбрать элемент
  const selectElement = useCallback((id: string | null) => {
    setState(prev => ({
      ...prev,
      selectedElement: id
    }));
  }, []);

  // Переместить элемент
  const moveElement = useCallback((id: string, position: { x: number; y: number }) => {
    updateElement(id, { position });
  }, [updateElement]);

  // Изменить размер элемента
  const resizeElement = useCallback((id: string, size: { width: number; height: number }) => {
    updateElement(id, { size });
  }, [updateElement]);

  // Изменить viewport
  const setViewport = useCallback((viewport: 'desktop' | 'tablet' | 'mobile') => {
    setState(prev => ({
      ...prev,
      viewport
    }));
  }, []);

  // Изменить zoom
  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(0.25, Math.min(2, zoom))
    }));
  }, []);

  // Переключить grid
  const toggleGrid = useCallback(() => {
    setState(prev => ({
      ...prev,
      grid: !prev.grid
    }));
  }, []);

  // Переключить snap to grid
  const toggleSnapToGrid = useCallback(() => {
    setState(prev => ({
      ...prev,
      snapToGrid: !prev.snapToGrid
    }));
  }, []);

  // Получить выбранный элемент
  const selectedElement = state.elements.find(el => el.id === state.selectedElement);

  return {
    state,
    selectedElement,
    addElement,
    updateElement,
    removeElement,
    selectElement,
    moveElement,
    resizeElement,
    setViewport,
    setZoom,
    toggleGrid,
    toggleSnapToGrid
  };
}

