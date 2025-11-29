'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button, Input, Select, Card, Checkbox } from '../ui';
import { 
  Layout, 
  Settings, 
  ShoppingCart, 
  Package, 
  Plus,
  Trash2,
  Edit,
  Save,
  Eye,
  Image,
  Filter,
  Type,
  Palette,
  Move,
  Copy,
  ZoomIn,
  Grid,
  Grip,
  Maximize2,
  Minimize2,
  Crop,
  CornerUpLeft,
  CornerUpRight,
  Maximize,
  Minimize
} from 'lucide-react';
import ImagePreviewSettings from './ImagePreviewSettings';
import ProductDetailBlock from './ProductDetailBlock';
import { clientLogger } from '@/lib/logging/client-logger';

// Компонент ручек для изменения размера
const ResizeHandles = ({ block, onStartResize }: { block: BlockSettings; onStartResize: (e: React.MouseEvent, handle: string) => void }) => {
  const handles = [
    { position: 'n', cursor: 'n-resize', icon: '↕' },
    { position: 's', cursor: 's-resize', icon: '↕' },
    { position: 'e', cursor: 'e-resize', icon: '↔' },
    { position: 'w', cursor: 'w-resize', icon: '↔' },
    { position: 'ne', cursor: 'ne-resize', icon: '↗' },
    { position: 'nw', cursor: 'nw-resize', icon: '↖' },
    { position: 'se', cursor: 'se-resize', icon: '↘' },
    { position: 'sw', cursor: 'sw-resize', icon: '↙' }
  ];

  return (
    <>
      {handles.map(({ position, cursor, icon }) => (
        <div
          key={position}
          className={`resize-handle resize-handle-${position}`}
          style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            backgroundColor: '#3b82f6',
            border: '1px solid white',
            cursor: cursor,
            zIndex: 1000,
            ...(position === 'n' && { top: '-4px', left: '50%', transform: 'translateX(-50%)' }),
            ...(position === 's' && { bottom: '-4px', left: '50%', transform: 'translateX(-50%)' }),
            ...(position === 'e' && { right: '-4px', top: '50%', transform: 'translateY(-50%)' }),
            ...(position === 'w' && { left: '-4px', top: '50%', transform: 'translateY(-50%)' }),
            ...(position === 'ne' && { top: '-4px', right: '-4px' }),
            ...(position === 'nw' && { top: '-4px', left: '-4px' }),
            ...(position === 'se' && { bottom: '-4px', right: '-4px' }),
            ...(position === 'sw' && { bottom: '-4px', left: '-4px' })
          }}
          onMouseDown={(e) => onStartResize(e, position)}
        />
      ))}
    </>
  );
};

// Типы для ультимативного конструктора
interface DragState {
  isDragging: boolean;
  dragType: 'new' | 'move' | 'resize';
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  draggedItem: {
    id: string;
    type: string;
    source: 'palette' | 'canvas';
  } | null;
  dragOffset: { x: number; y: number };
}

interface BlockSettings {
  id: string;
  name: string;
  type: 'product-grid' | 'product-detail' | 'configurator' | 'cart' | 'text' | 'image' | 'filter';
  
  // Позиция и размеры
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Настройки макета
  displayWidth: '25%' | '33%' | '50%' | '66%' | '75%' | '100%' | 'custom';
  customWidth?: string;
  alignment: 'left' | 'center' | 'right';
  margin: { top: string; right: string; bottom: string; left: string };
  padding: { top: string; right: string; bottom: string; left: string };
  backgroundColor: string;
  borderColor: string;
  borderRadius: string;
  zIndex: number;
  
  // Настройки товаров
  productSettings?: {
    categoryId: string;
    showImages: boolean;
    imageSize: 'small' | 'medium' | 'large';
    imageAspectRatio: 'square' | 'landscape' | 'portrait';
    showPrices: boolean;
    showDescriptions: boolean;
    columns: number;
    itemsPerPage: number;
    sortBy: 'name' | 'price' | 'popularity';
    filters: any[];
  };
  
  // Настройки детального просмотра
  detailSettings?: {
    showMainImage: boolean;
    showThumbnailGallery: boolean;
    showZoom: boolean;
    imageSize: 'small' | 'medium' | 'large';
    showProductInfo: boolean;
    showPrice: boolean;
    showDescription: boolean;
    showSpecifications: boolean;
  };
  
  // Настройки текста
  textSettings?: {
    content: string;
    fontSize: string;
    fontFamily: string;
    fontWeight: 'normal' | 'bold';
    textAlign: 'left' | 'center' | 'right';
    color: string;
    backgroundColor: string;
  };
  
  // Настройки изображения
  imageSettings?: {
    src: string;
    alt: string;
    width: string;
    height: string;
    objectFit: 'cover' | 'contain' | 'fill';
    borderRadius: string;
    shadow: boolean;
  };
  
  // Настройки фильтров
  filterSettings?: {
    filters: any[];
    showApplyButton: boolean;
  };
}

// Главный компонент ультимативного конструктора
export default function UltimateConstructor() {
  const [blocks, setBlocks] = useState<BlockSettings[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [snapToGridEnabled, setSnapToGridEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: 'new',
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    draggedItem: null,
    dragOffset: { x: 0, y: 0 }
  });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedBlock = blocks.find(block => block.id === selectedBlockId);

  // Функция для привязки к сетке колонок
  const snapToGrid = useCallback((x: number, y: number, width: number, height: number) => {
    const gridSize = 32; // Размер сетки в пикселях
    const snapX = Math.round(x / gridSize) * gridSize;
    const snapY = Math.round(y / gridSize) * gridSize;
    const snapWidth = Math.round(width / gridSize) * gridSize;
    const snapHeight = Math.round(height / gridSize) * gridSize;
    return { x: snapX, y: snapY, width: snapWidth, height: snapHeight };
  }, []);

  // Функция для привязки к колонкам (12-колоночная сетка)
  const snapToColumns = (x: number, width: number) => {
    const pageWidth = 1440 - 64; // Ширина страницы минус отступы (32px с каждой стороны)
    const columnWidth = pageWidth / 12;
    
    // Находим ближайшую колонку
    const column = Math.round(x / columnWidth);
    const snappedX = Math.max(0, Math.min(11, column)) * columnWidth;
    
    // Рассчитываем ширину в колонках
    const columns = Math.round(width / columnWidth);
    const snappedWidth = Math.max(1, Math.min(12, columns)) * columnWidth;
    
    return { x: snappedX, width: snappedWidth };
  };

  // Создание нового блока
  const createBlock = useCallback((type: BlockSettings['type'], x: number, y: number): BlockSettings => {
    const blockNames = {
      'product-grid': 'Каталог товаров',
      'product-detail': 'Карточка товара',
      'configurator': 'Конструктор товара',
      'cart': 'Корзина покупок',
      'text': 'Текстовый блок',
      'image': 'Блок изображения',
      'filter': 'Фильтры поиска'
    };
    
    return {
      id: Date.now().toString(),
      name: blockNames[type] || `Блок ${blocks.length + 1}`,
      type,
      x,
      y,
      width: 400,
      height: 300,
      displayWidth: '100%',
      alignment: 'left',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      padding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
      backgroundColor: '#ffffff',
      borderColor: '#e2e8f0',
      borderRadius: '8px',
      zIndex: blocks.length + 1,
      
      ...(type === 'product-grid' && {
        productSettings: {
          categoryId: '',
          showImages: true,
          imageSize: 'medium',
          imageAspectRatio: 'square',
          showPrices: true,
          showDescriptions: true,
          columns: 3,
          itemsPerPage: 12,
          sortBy: 'name',
          filters: []
        }
      }),
      
      ...(type === 'product-detail' && {
        detailSettings: {
          showMainImage: true,
          showThumbnailGallery: true,
          showZoom: true,
          imageSize: 'medium',
          showProductInfo: true,
          showPrice: true,
          showDescription: true,
          showSpecifications: true
        }
      }),
      
      ...(type === 'text' && {
        textSettings: {
          content: 'Пример текстового содержимого',
          fontSize: '16px',
          fontFamily: 'system-ui',
          fontWeight: 'normal',
          textAlign: 'left',
          color: '#333333',
          backgroundColor: 'transparent'
        }
      }),
      
      ...(type === 'filter' && {
        filterSettings: {
          filters: [],
          showApplyButton: true
        }
      })
    };
  }, [blocks.length]);

  // Обновление блока
  const updateBlock = useCallback((id: string, updates: Partial<BlockSettings>) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === id ? { ...block, ...updates } : block
      )
    );
  }, []);

  // Удаление блока
  const deleteBlock = useCallback((id: string) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== id));
    setSelectedBlockId(null);
  }, []);

  // Дублирование блока
  const duplicateBlock = useCallback((id: string) => {
    const blockToDuplicate = blocks.find(block => block.id === id);
    if (blockToDuplicate) {
      const newBlock: BlockSettings = {
        ...blockToDuplicate,
        id: Date.now().toString(),
        name: `${blockToDuplicate.name} (копия)`,
        x: blockToDuplicate.x + 20,
        y: blockToDuplicate.y + 20,
        zIndex: blocks.length + 1
      };
      setBlocks(prev => [...prev, newBlock]);
      setSelectedBlockId(newBlock.id);
    }
  }, [blocks]);

  // Начало перетаскивания
  const handleMouseDown = useCallback((e: React.MouseEvent, item: { id: string; type: string; source: 'palette' | 'canvas' }) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Проверяем, что currentTarget существует
    if (!e.currentTarget) {
      clientLogger.warn('currentTarget is null, cannot get bounding rect');
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const offset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    const startPos = { x: e.clientX, y: e.clientY };
    
    setDragState({
      isDragging: true,
      dragType: item.source === 'palette' ? 'new' : 'move',
      startPos,
      currentPos: startPos,
      draggedItem: item,
      dragOffset: offset
    });

    // Добавляем обработчики для глобального перетаскивания
    const handleMouseMove = (e: MouseEvent) => {
      setDragState(prev => ({
        ...prev,
        currentPos: { x: e.clientX, y: e.clientY }
      }));
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Определяем позицию drop
      const canvas = canvasRef.current;
      if (canvas && item) {
        const canvasRect = canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left - offset.x;
        const y = e.clientY - canvasRect.top - offset.y;
        
        if (item.source === 'palette') {
          // Создаем новый блок
          let finalX = Math.max(0, x);
          let finalY = Math.max(0, y);
          
          // Применяем привязку к сетке если включена
          if (snapToGridEnabled) {
            const snapped = snapToGrid(finalX, finalY, 400, 300);
            finalX = snapped.x;
            finalY = snapped.y;
          }
          
          const newBlock = createBlock(item.type as BlockSettings['type'], finalX, finalY);
          setBlocks(prev => [...prev, newBlock]);
          setSelectedBlockId(newBlock.id);
        } else {
          // Перемещаем существующий блок
          let finalX = Math.max(0, x);
          let finalY = Math.max(0, y);
          
          // Применяем привязку к сетке если включена
          if (snapToGridEnabled) {
            const existingBlock = blocks.find(b => b.id === item.id);
            if (existingBlock) {
              const snapped = snapToGrid(finalX, finalY, existingBlock.width, existingBlock.height);
              finalX = snapped.x;
              finalY = snapped.y;
            }
          }
          
          setBlocks(prev => prev.map(block => 
            block.id === item.id 
              ? { ...block, x: finalX, y: finalY }
              : block
          ));
        }
      }
      
      // Убираем обработчики
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      setDragState({
        isDragging: false,
        dragType: 'new',
        startPos: { x: 0, y: 0 },
        currentPos: { x: 0, y: 0 },
        draggedItem: null,
        dragOffset: { x: 0, y: 0 }
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [createBlock, blocks, snapToGridEnabled, snapToGrid]);

  // Начало изменения размера
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectedBlock) return;
    
    setIsResizing(true);
    setResizeHandle(handle);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = selectedBlock.width;
    const startHeight = selectedBlock.height;
    const startLeft = selectedBlock.x;
    const startTop = selectedBlock.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!selectedBlock) return;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startLeft;
      let newY = startTop;

      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (handle.includes('e')) {
        newWidth = Math.max(50, startWidth + dx);
      }
      if (handle.includes('s')) {
        newHeight = Math.max(50, startHeight + dy);
      }
      if (handle.includes('w')) {
        newWidth = Math.max(50, startWidth - dx);
        newX = startLeft + dx;
      }
      if (handle.includes('n')) {
        newHeight = Math.max(50, startHeight - dy);
        newY = startTop + dy;
      }

      updateBlock(selectedBlock.id, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setIsResizing(false);
      setResizeHandle(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [selectedBlock, updateBlock]);

  const availableBlocks = [
    { 
      type: 'product-grid' as const, 
      name: 'Каталог товаров', 
      icon: '🏪', 
      description: 'Сетка товаров с изображениями, ценами и описаниями. Настройка колонок, размеров фото, фильтров.' 
    },
    { 
      type: 'product-detail' as const, 
      name: 'Карточка товара', 
      icon: '🔍', 
      description: 'Детальный просмотр товара с увеличенным фото, галереей миниатюр, зумом и полной информацией.' 
    },
    { 
      type: 'configurator' as const, 
      name: 'Конструктор товара', 
      icon: '⚙️', 
      description: 'Настройка параметров товара, калькулятор цены, выбор опций и комплектующих.' 
    },
    { 
      type: 'cart' as const, 
      name: 'Корзина покупок', 
      icon: '🛒', 
      description: 'Отображение выбранных товаров, управление количеством, расчет стоимости и оформление заказа.' 
    },
    { 
      type: 'text' as const, 
      name: 'Текстовый блок', 
      icon: '📝', 
      description: 'Текстовое содержимое с настройкой шрифта, цвета, размера и выравнивания.' 
    },
    { 
      type: 'image' as const, 
      name: 'Блок изображения', 
      icon: '🖼️', 
      description: 'Отдельное изображение с настройкой размеров, обрезки, скругления и эффектов.' 
    },
    { 
      type: 'filter' as const, 
      name: 'Фильтры поиска', 
      icon: '🔍', 
      description: 'Фильтры по свойствам товаров: цена, цвет, материал, размер, бренд и другие параметры.' 
    }
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Заголовок */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            🎨 Ультимативный конструктор страниц
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded"
                />
                <span>📐 Показать сетку</span>
              </label>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={snapToGridEnabled}
                  onChange={(e) => setSnapToGridEnabled(e.target.checked)}
                  className="rounded"
                />
                <span>🧲 Привязка к сетке</span>
              </label>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-1" />
                Сохранить
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Предпросмотр
              </Button>
              <Button size="sm">
                🚀 Опубликовать
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Левая панель с блоками */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Доступные блоки</h3>
            <div className="space-y-2">
              {availableBlocks.map((block) => (
                <div
                  key={block.type}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    
                    // Проверяем, что currentTarget существует
                    if (!e.currentTarget) {
                      return;
                    }
                    
                    // Только начинаем перетаскивание, не добавляем блок сразу
                    const startTime = Date.now();
                    const startPos = { x: e.clientX, y: e.clientY };
                    
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const distance = Math.sqrt(
                        Math.pow(moveEvent.clientX - startPos.x, 2) + 
                        Math.pow(moveEvent.clientY - startPos.y, 2)
                      );
                      
                      // Если мышь переместилась больше чем на 5 пикселей, начинаем перетаскивание
                      if (distance > 5) {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                        handleMouseDown(e, { id: block.type, type: block.type, source: 'palette' });
                      }
                    };
                    
                    const handleMouseUp = (upEvent: MouseEvent) => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                      
                      // Если время клика было коротким и мышь не перемещалась, добавляем блок
                      if (Date.now() - startTime < 200) {
                        const distance = Math.sqrt(
                          Math.pow(upEvent.clientX - startPos.x, 2) + 
                          Math.pow(upEvent.clientY - startPos.y, 2)
                        );
                        if (distance <= 5) {
                          // Быстрое добавление по клику (без перетаскивания)
                          const canvas = canvasRef.current;
                          if (canvas) {
                            const rect = canvas.getBoundingClientRect();
                            const x = rect.width / 2 - 200;
                            const y = rect.height / 2 - 150;
                            const newBlock = createBlock(block.type, x, y);
                            setBlocks(prev => [...prev, newBlock]);
                            setSelectedBlockId(newBlock.id);
                          }
                        }
                      }
                    };
                    
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-grab select-none active:cursor-grabbing"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{block.icon}</span>
                    <div>
                      <div className="font-medium text-gray-800">{block.name}</div>
                      <div className="text-xs text-gray-500">{block.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Центральная область */}
        <div 
          ref={canvasRef}
          className="flex-1 bg-gray-50 p-6 overflow-auto relative"
          onClick={() => setSelectedBlockId(null)}
        >
          {/* Контур страницы */}
          <div className="relative min-h-[600px] max-w-6xl mx-auto">
            {/* Заголовок */}
            <h2 className="text-xl font-semibold mb-6 text-gray-800 text-center">
              Рабочая область (перетащите блоки сюда)
            </h2>
            
            {/* Контур страницы */}
            <div className="relative bg-white shadow-lg border-2 border-gray-300 min-h-[900px] w-full max-w-[1440px] mx-auto">
              {/* Сетка для выравнивания */}
              {showGrid && (
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                  <div className="grid grid-cols-12 gap-4 h-full p-8">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="border-l border-dashed border-gray-300"></div>
                    ))}
                  </div>
                  <div className="grid grid-rows-8 gap-4 h-full p-8 absolute inset-0">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="border-t border-dashed border-gray-300"></div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Информация о размерах страницы */}
              <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                Страница: 1440×900px
              </div>
              
              {/* Разметка колонок */}
              <div className="absolute top-8 left-8 right-8 bottom-8">
                <div className="grid grid-cols-12 gap-4 h-full">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -top-6 left-0 text-xs text-gray-400 font-mono">
                        {i + 1}
                      </div>
                      <div className="border-l-2 border-gray-200 h-full"></div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Подсказки по размерам */}
              <div className="absolute bottom-2 left-2 text-xs text-gray-500 space-y-1">
                <div>📏 Полная ширина: 12 колонок (~1376px)</div>
                <div>📱 Половина: 6 колонок (~688px)</div>
                <div>📐 Треть: 4 колонки (~459px)</div>
                <div>📊 Четверть: 3 колонки (~344px)</div>
              </div>
              
              {/* Контейнер для блоков внутри страницы */}
              <div className="absolute inset-8">
                {blocks.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎨</div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Пустая страница</h3>
                      <p className="text-gray-500">Перетащите блоки из левой панели или кликните по ним</p>
                      {dragState.isDragging && dragState.draggedItem?.source === 'palette' && (
                        <div
                          className="mt-4 p-4 bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg"
                          style={{
                            position: 'absolute',
                            left: dragState.currentPos.x - (canvasRef.current?.getBoundingClientRect().left || 0) - 150,
                            top: dragState.currentPos.y - (canvasRef.current?.getBoundingClientRect().top || 0) - 50,
                            width: 300,
                            height: 100,
                            pointerEvents: 'none',
                            zIndex: 1000
                          }}
                        >
                          <p className="text-blue-700 font-medium">Отпустите здесь для добавления блока</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {blocks.map((block) => (
                      <div
                        key={block.id}
                        className={`
                          absolute border-2 rounded-lg transition-all
                          ${selectedBlockId === block.id 
                            ? 'border-blue-500 bg-blue-50 shadow-lg cursor-move' 
                            : 'border-gray-200 bg-white hover:border-gray-300 cursor-move'
                          }
                          ${dragState.isDragging && dragState.draggedItem?.id === block.id ? 'opacity-50 scale-105 shadow-xl cursor-grabbing' : ''}
                        `}
                        style={{
                          left: dragState.isDragging && dragState.draggedItem?.id === block.id 
                            ? dragState.currentPos.x - dragState.dragOffset.x - (canvasRef.current?.getBoundingClientRect().left || 0)
                            : block.x,
                          top: dragState.isDragging && dragState.draggedItem?.id === block.id 
                            ? dragState.currentPos.y - dragState.dragOffset.y - (canvasRef.current?.getBoundingClientRect().top || 0)
                            : block.y,
                          width: block.width,
                          height: block.height,
                          backgroundColor: block.backgroundColor,
                          borderColor: block.borderColor,
                          borderRadius: block.borderRadius,
                          zIndex: block.zIndex,
                          transform: dragState.isDragging && dragState.draggedItem?.id === block.id ? 'scale(1.05)' : 'scale(1)',
                          transition: dragState.isDragging && dragState.draggedItem?.id === block.id ? 'none' : 'all 0.2s ease'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBlockId(block.id);
                        }}
                        onMouseDown={(e) => {
                          if ((e.target as HTMLElement).closest('.resize-handle')) {
                            return;
                          }
                          e.stopPropagation();

                          // Проверяем, что currentTarget существует
                          if (!e.currentTarget) {
                            return;
                          }

                          // Только начинаем перетаскивание если это не клик для выбора
                          if (e.button === 0) { // левая кнопка мыши
                            // Добавляем небольшую задержку для различения клика и начала перетаскивания
                            const startTime = Date.now();
                            const startPos = { x: e.clientX, y: e.clientY };

                            let isDragging = false;
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const distance = Math.sqrt(
                                Math.pow(moveEvent.clientX - startPos.x, 2) +
                                Math.pow(moveEvent.clientY - startPos.y, 2)
                              );

                              // Если мышь переместилась больше чем на 5 пикселей, начинаем перетаскивание
                              if (distance > 5 && !isDragging) {
                                isDragging = true;
                                
                                // Начинаем перетаскивание напрямую
                                if (!e.currentTarget) {
                                  clientLogger.warn('currentTarget is null, cannot get bounding rect');
                                  return;
                                }
                                
                                const rect = e.currentTarget.getBoundingClientRect();
                                const offset = {
                                  x: e.clientX - rect.left,
                                  y: e.clientY - rect.top
                                };
                                
                                setDragState({
                                  isDragging: true,
                                  dragType: 'move',
                                  startPos: { x: e.clientX, y: e.clientY },
                                  currentPos: { x: moveEvent.clientX, y: moveEvent.clientY },
                                  draggedItem: { id: block.id, type: block.type, source: 'canvas' },
                                  dragOffset: offset
                                });
                              }
                              
                              if (isDragging) {
                                setDragState(prev => ({
                                  ...prev,
                                  currentPos: { x: moveEvent.clientX, y: moveEvent.clientY }
                                }));
                              }
                            };

                            const handleMouseUp = (upEvent: MouseEvent) => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                              
                              if (isDragging) {
                                // Завершаем перетаскивание
                                const canvas = canvasRef.current;
                                if (canvas && e.currentTarget) {
                                  const canvasRect = canvas.getBoundingClientRect();
                                  const blockRect = e.currentTarget.getBoundingClientRect();
                                  const x = upEvent.clientX - canvasRect.left - (e.clientX - blockRect.left);
                                  const y = upEvent.clientY - canvasRect.top - (e.clientY - blockRect.top);
                                  
                                  let finalX = Math.max(0, x);
                                  let finalY = Math.max(0, y);
                                  
                                  // Применяем привязку к сетке если включена
                                  if (snapToGridEnabled) {
                                    const snapped = snapToGrid(finalX, finalY, block.width, block.height);
                                    finalX = snapped.x;
                                    finalY = snapped.y;
                                  }
                                  
                                  setBlocks(prev => prev.map(b => 
                                    b.id === block.id 
                                      ? { ...b, x: finalX, y: finalY }
                                      : b
                                  ));
                                }
                              }
                              
                              setDragState({
                                isDragging: false,
                                dragType: 'new',
                                startPos: { x: 0, y: 0 },
                                currentPos: { x: 0, y: 0 },
                                draggedItem: null,
                                dragOffset: { x: 0, y: 0 }
                              });
                            };

                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }
                        }}
                      >
                        {/* Название блока */}
                        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          {block.name}
                        </div>
                        
                        {/* Ручки изменения размера */}
                        {selectedBlockId === block.id && (
                          <ResizeHandles 
                            block={block}
                            onStartResize={handleResizeStart}
                          />
                        )}
                        
                        {/* Рендер блока в зависимости от типа */}
                        <div className="p-4 h-full overflow-hidden">
                          {block.type === 'product-grid' && (
                            <div className="bg-gray-50 p-4 rounded h-full">
                              <h3 className="font-medium mb-2">🏪 Каталог товаров</h3>
                              <p className="text-sm text-gray-600">
                                {block.productSettings?.columns || 3} колонки, 
                                {block.productSettings?.itemsPerPage || 12} товаров
                              </p>
                              <div className="mt-2 text-xs text-gray-500">
                                Изображения: {block.productSettings?.imageSize}
                              </div>
                            </div>
                          )}
                          
                          {block.type === 'product-detail' && (
                            <div className="bg-gray-50 p-4 rounded h-full">
                              <h3 className="font-medium mb-2">🔍 Карточка товара</h3>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-gray-200 rounded aspect-square flex items-center justify-center">
                                  <ZoomIn className="h-4 w-4" />
                                </div>
                                <div className="space-y-1">
                                  <div className="bg-gray-200 rounded h-2"></div>
                                  <div className="bg-gray-200 rounded h-2 w-3/4"></div>
                                  <div className="bg-gray-200 rounded h-2 w-1/2"></div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {block.type === 'configurator' && (
                            <div className="bg-gray-50 p-4 rounded h-full">
                              <h3 className="font-medium mb-2">⚙️ Конструктор товара</h3>
                              <p className="text-sm text-gray-600">Настройка параметров</p>
                            </div>
                          )}
                          
                          {block.type === 'cart' && (
                            <div className="bg-gray-50 p-4 rounded h-full">
                              <h3 className="font-medium mb-2">🛒 Корзина покупок</h3>
                              <p className="text-sm text-gray-600">Выбранные товары</p>
                            </div>
                          )}
                          
                          {block.type === 'filter' && (
                            <div className="bg-gray-50 p-4 rounded h-full">
                              <h3 className="font-medium mb-2">🔍 Фильтры поиска</h3>
                              <p className="text-sm text-gray-600">Поиск по параметрам</p>
                            </div>
                          )}
                          
                          {block.type === 'text' && (
                            <div style={{
                              fontSize: block.textSettings?.fontSize,
                              color: block.textSettings?.color,
                              textAlign: block.textSettings?.textAlign
                            }} className="h-full overflow-hidden">
                              <h3 className="font-medium mb-2">📝 Текстовый блок</h3>
                              <p className="text-sm text-gray-600">{block.textSettings?.content}</p>
                            </div>
                          )}
                          
                          {block.type === 'image' && (
                            <div className="bg-gray-50 p-4 rounded h-full flex items-center justify-center">
                              <h3 className="font-medium mb-2">🖼️ Блок изображения</h3>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Правая панель настроек */}
        {selectedBlock ? (
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Настройки блока</h3>
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" onClick={() => duplicateBlock(selectedBlock.id)} title="Дублировать">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteBlock(selectedBlock.id)} title="Удалить" className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="blockName" className="block text-sm font-medium text-gray-700 mb-1">Название блока</label>
                  <Input
                    id="blockName"
                    value={selectedBlock.name}
                    onChange={(e) => updateBlock(selectedBlock.id, { name: e.target.value })}
                    placeholder="Название блока"
                  />
                </div>

                <div>
                  <label htmlFor="blockWidth" className="block text-sm font-medium text-gray-700 mb-1">Ширина блока</label>
                  <Select
                    id="blockWidth"
                    value={selectedBlock.displayWidth}
                    onValueChange={(value) => updateBlock(selectedBlock.id, { displayWidth: value as any })}
                  >
                    <option value="25%">25%</option>
                    <option value="50%">50%</option>
                    <option value="75%">75%</option>
                    <option value="100%">100%</option>
                    <option value="auto">Авто</option>
                  </Select>
                </div>

                <div>
                  <label htmlFor="blockZIndex" className="block text-sm font-medium text-gray-700 mb-1">Z-Index</label>
                  <Input
                    id="blockZIndex"
                    type="number"
                    value={selectedBlock.zIndex}
                    onChange={(e) => updateBlock(selectedBlock.id, { zIndex: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <Button onClick={() => deleteBlock(selectedBlock.id)} variant="destructive" className="w-full">
                  Удалить блок
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-96 bg-white border-l border-gray-200 p-4">
            <div className="text-center text-gray-500 py-12">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-lg font-medium mb-2">Настройки блока</h3>
              <p className="text-sm">Выберите блок для редактирования</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
