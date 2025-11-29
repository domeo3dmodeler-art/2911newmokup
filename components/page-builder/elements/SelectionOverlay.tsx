'use client';

import React, { useState, useCallback } from 'react';
import { BaseElement, Size } from '../types';
import { getBlockName, getBlockDescription, getDisplayName } from '../../../lib/block-names';
import { TechnicalTooltip, BlockTechnicalInfo } from './TechnicalTooltip';

interface SelectionOverlayProps {
  element: BaseElement;
  isSelected: boolean;
  isMultiSelected: boolean;
  allElements: BaseElement[]; // Все элементы страницы для подсчета номеров
  onDelete: () => void;
  onResize: (direction: string, deltaX: number, deltaY: number) => void;
}

export function SelectionOverlay({ element, isSelected, isMultiSelected, allElements, onDelete, onResize }: SelectionOverlayProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [resizeDirection, setResizeDirection] = useState('');

  // Обработчик начала изменения размера
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({ x: e.clientX, y: e.clientY });
  }, []);

  // Обработчик изменения размера
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    onResize(resizeDirection, deltaX, deltaY);

    setResizeStart({ x: e.clientX, y: e.clientY });
  }, [isResizing, resizeDirection, resizeStart, onResize]);

  // Обработчик завершения изменения размера
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeDirection('');
  }, []);

  // Глобальные обработчики мыши
  React.useEffect(() => {
    if (typeof document === 'undefined' || !document.addEventListener) return;

    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Обработчик удаления
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete();
  }, [onDelete]);

  const resizeHandles = [
    { direction: 'nw', position: { top: -6, left: -6 } },
    { direction: 'n', position: { top: -6, left: '50%', transform: 'translateX(-50%)' } },
    { direction: 'ne', position: { top: -6, right: -6 } },
    { direction: 'w', position: { top: '50%', left: -6, transform: 'translateY(-50%)' } },
    { direction: 'e', position: { top: '50%', right: -6, transform: 'translateY(-50%)' } },
    { direction: 'sw', position: { bottom: -6, left: -6 } },
    { direction: 's', position: { bottom: -6, left: '50%', transform: 'translateX(-50%)' } },
    { direction: 'se', position: { bottom: -6, right: -6 } }
  ];

  return (
    <>
      {/* Border */}
      <div className={`absolute inset-0 border-2 pointer-events-none ${
        isMultiSelected 
          ? 'border-orange-500 bg-orange-50 bg-opacity-30' 
          : 'border-blue-500'
      }`} />

      {/* Resize Handles */}
      {resizeHandles.map((handle) => (
        <div
          key={handle.direction}
          className="absolute w-3 h-3 bg-blue-500 border border-white cursor-pointer hover:bg-blue-600 rounded-sm"
          style={{
            ...handle.position,
            transform: handle.position.transform
          }}
          data-resize-handle="true"
          onMouseDown={(e) => handleResizeStart(e, handle.direction)}
        />
      ))}

      {/* Delete Button */}
      <button
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600 cursor-pointer"
        data-delete-button="true"
        onClick={handleDelete}
        title="Удалить элемент"
      >
        ×
      </button>

      {/* Element Info */}
      <TechnicalTooltip
        position="top"
        content={
          <BlockTechnicalInfo
            blockType={getDisplayName(element.type, allElements, element.id)}
            dimensions={element.size}
            additionalInfo={{
              'Описание': getBlockDescription(element.type),
              'ID': element.id.slice(-8)
            }}
          />
        }
      >
        <div className="absolute -top-8 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {getDisplayName(element.type, allElements, element.id)}
        </div>
      </TechnicalTooltip>
    </>
  );
}
