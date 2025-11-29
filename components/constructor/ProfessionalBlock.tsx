'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { Trash2, Move, RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '../ui';
import ProductCatalogBlock from './ProductCatalogBlock';
import { clientLogger } from '@/lib/logging/client-logger';

interface ProfessionalBlockProps {
  block: any;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (block: any) => void;
  onDelete: () => void;
}

const ProfessionalBlock: React.FC<ProfessionalBlockProps> = ({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete
}) => {
  const blockRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, blockX: 0, blockY: 0 });

  const [{ isDragging: isDndDragging }, drag] = useDrag(() => ({
    type: 'block',
    item: () => ({ id: block.id, type: 'move', source: 'canvas' }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));

  // Обработчик начала перетаскивания мышкой
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Только левая кнопка мыши
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      blockX: block.x,
      blockY: block.y
    });
    
    onSelect();
  };

  // Обработчик перемещения мышкой
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Выравнивание по сетке
    const gridSize = 20;
    const newX = Math.max(0, dragStart.blockX + deltaX);
    const newY = Math.max(0, dragStart.blockY + deltaY);
    const snappedX = Math.round(newX / gridSize) * gridSize;
    const snappedY = Math.round(newY / gridSize) * gridSize;
    
    onUpdate({
      ...block,
      x: snappedX,
      y: snappedY
    });
  };

  // Обработчик окончания перетаскивания
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Обработчик начала изменения размера
  const handleResizeStart = (e: React.MouseEvent, direction: 'se' | 'sw' | 'ne' | 'nw') => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: block.width,
      height: block.height
    });
  };

  // Обработчик изменения размера
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;
    
    let newWidth = Math.max(200, resizeStart.width + deltaX);
    let newHeight = Math.max(150, resizeStart.height + deltaY);
    
    // Выравнивание по сетке
    const gridSize = 20;
    newWidth = Math.round(newWidth / gridSize) * gridSize;
    newHeight = Math.round(newHeight / gridSize) * gridSize;
    
    onUpdate({
      ...block,
      width: newWidth,
      height: newHeight
    });
  }, [isResizing, resizeStart, block, onUpdate]);

  // Обработчик окончания изменения размера
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Добавляем обработчики событий
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'nw-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  return (
    <div
      ref={(node) => {
        blockRef.current = node;
        drag(node);
      }}
      className={`
        absolute border-2 rounded-lg p-4 transition-all duration-200
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
        ${isDndDragging ? 'opacity-50' : ''}
        ${isDragging ? 'cursor-grabbing' : 'cursor-move'}
      `}
      style={{
        left: `${block.x}px`,
        top: `${block.y}px`,
        width: `${block.width}px`,
        height: `${block.height}px`,
        zIndex: block.zIndex || 1,
        transform: 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Заголовок блока */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Move className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-900 text-sm">{block.name}</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {block.type}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-6 w-6 p-0 hover:bg-red-100"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Содержимое блока */}
      <div className="text-xs text-gray-700">
        {block.type === 'main-category' && (
          <div>
            {block.catalogCategoryInfo ? (
              <div className="flex items-center space-x-2">
                {block.catalogCategoryInfo.imageUrl && (
                  <img 
                    src={block.catalogCategoryInfo.imageUrl} 
                    alt={block.catalogCategoryInfo.name} 
                    className="w-6 h-6 rounded object-cover" 
                  />
                )}
                <span className="truncate">{block.catalogCategoryInfo.name}</span>
                <span className="text-gray-500">({block.catalogCategoryInfo.productCount})</span>
              </div>
            ) : (
              <span className="text-gray-400">Выберите категорию</span>
            )}
          </div>
        )}
        {block.type === 'text' && <p>Текстовый блок</p>}
        {block.type === 'image' && <p>Блок изображения</p>}
        {block.type === 'product-card' && <p>Карточка товара</p>}
        {block.type === 'product-catalog' && <p>Каталог товаров</p>}
        {block.type === 'dynamic-calculator' && <p>Динамический калькулятор</p>}
        {block.type === 'analytics-dashboard' && <p>Аналитическая панель</p>}
        {block.type === 'advanced-pricing' && <p>Продвинутое ценообразование</p>}
        {block.type === 'subcategory' && <p>Подкатегория</p>}
      </div>

      {/* Полноценное отображение товаров для блоков каталога */}
      {(block.type === 'main-category' || block.type === 'subcategory' || block.type === 'additional-category') && 
       block.catalogCategoryId && (
        <div className="mt-4 h-96 overflow-hidden">
          <ProductCatalogBlock
            block={{
              ...block,
              catalogCategoryId: block.catalogCategoryId,
              catalogCategoryInfo: block.catalogCategoryInfo,
              displayMode: block.displayMode || 'cards',
              itemsPerPage: block.itemsPerPage || 6,
              showImages: block.showImages !== false,
              showPrices: block.showPrices !== false,
              showDescriptions: block.showDescriptions !== false,
              showFilters: block.showFilters !== false,
              showSearch: block.showSearch !== false,
              imageSize: block.imageSize || 'medium',
              columns: block.columns || 2
            }}
            isPreview={true}
            onProductSelect={(product) => {
              clientLogger.debug('Product selected:', product);
            }}
            onProductAddToCart={(product) => {
              clientLogger.debug('Product added to cart:', product);
            }}
          />
        </div>
      )}

      {/* Ручки для изменения размера */}
      {isSelected && (
        <>
          {/* Юго-восточный угол */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize rounded-full border-2 border-white shadow-lg hover:bg-blue-600 transition-colors"
            style={{ transform: 'translate(50%, 50%)' }}
            onMouseDown={(e) => handleResizeStart(e, 'se')}
          />
          {/* Юго-западный угол */}
          <div
            className="absolute bottom-0 left-0 w-4 h-4 bg-blue-500 cursor-sw-resize rounded-full border-2 border-white shadow-lg hover:bg-blue-600 transition-colors"
            style={{ transform: 'translate(-50%, 50%)' }}
            onMouseDown={(e) => handleResizeStart(e, 'sw')}
          />
          {/* Северо-восточный угол */}
          <div
            className="absolute top-0 right-0 w-4 h-4 bg-blue-500 cursor-ne-resize rounded-full border-2 border-white shadow-lg hover:bg-blue-600 transition-colors"
            style={{ transform: 'translate(50%, -50%)' }}
            onMouseDown={(e) => handleResizeStart(e, 'ne')}
          />
          {/* Северо-западный угол */}
          <div
            className="absolute top-0 left-0 w-4 h-4 bg-blue-500 cursor-nw-resize rounded-full border-2 border-white shadow-lg hover:bg-blue-600 transition-colors"
            style={{ transform: 'translate(-50%, -50%)' }}
            onMouseDown={(e) => handleResizeStart(e, 'nw')}
          />
        </>
      )}

      {/* Индикатор размера */}
      {isSelected && (
        <div className="absolute top-full left-0 mt-1 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow border">
          {block.width} × {block.height}
        </div>
      )}
    </div>
  );
};

export default ProfessionalBlock;
