'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button, Input, Select, Card, Checkbox } from '../ui';
import { CategorySelector, MainCategorySelector, SubCategorySelector, AnyCategorySelector } from './CategorySelector';
import { ProductDisplay, ProductDisplayPreview } from './ProductDisplay';
import CartBlock from './CartBlock';
import { ProductFilters, ProductSearch } from './ProductFilters';
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
  Maximize2 as Maximize,
  Minimize2 as Minimize
} from 'lucide-react';
import { ResizeHandles, snapToGrid, createBlock, availableBlocks } from './ultimate';
import type { DragState, BlockSettings } from './ultimate';

// Типы и утилиты импортируются из ./ultimate

// Главный компонент конструктора
export default function UltimateConstructorFixed({ hideHeader = false }: { hideHeader?: boolean }) {
  const [blocks, setBlocks] = useState<BlockSettings[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [snapToGridEnabled, setSnapToGridEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(hideHeader ? true : true);
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

  // Функция для привязки к сетке (импортируется из ./ultimate)
  const snapToGridCallback = useCallback((x: number, y: number, width: number, height: number) => {
    return snapToGrid(x, y, width, height);
  }, []);

  // Создание нового блока (импортируется из ./ultimate)
  const createBlockCallback = useCallback((type: BlockSettings['type'], x: number, y: number): BlockSettings => {
    return createBlock(type, x, y, blocks.length);
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

  // Простое добавление блока по клику
  const addBlock = useCallback((type: BlockSettings['type']) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = rect.width / 2 - 200;
      const y = rect.height / 2 - 150;
      const newBlock = createBlockCallback(type, x, y);
      setBlocks(prev => [...prev, newBlock]);
      setSelectedBlockId(newBlock.id);
    }
  }, [createBlockCallback]);

  // Простое перемещение блока
  const moveBlock = useCallback((blockId: string, newX: number, newY: number) => {
    let finalX = Math.max(0, newX);
    let finalY = Math.max(0, newY);
    
    if (snapToGridEnabled) {
      const block = blocks.find(b => b.id === blockId);
      if (block) {
        const snapped = snapToGridCallback(finalX, finalY, block.width, block.height);
        finalX = snapped.x;
        finalY = snapped.y;
      }
    }
    
    updateBlock(blockId, { x: finalX, y: finalY });
  }, [blocks, snapToGridEnabled, snapToGridCallback, updateBlock]);

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

    // availableBlocks импортируется из ./ultimate

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Заголовок */}
      {!hideHeader && (
      <div className="bg-white border-b border-gray-200 p-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            🎨 Конструктор страниц
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
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Левая панель с блоками */}
        <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Доступные блоки</h3>
            <div className="space-y-2">
              {availableBlocks.map((block) => (
                <div
                  key={block.type}
                  onClick={() => addBlock(block.type)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
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
              Рабочая область (кликните по блокам слева для добавления)
            </h2>
            
            {/* Контур страницы */}
            <div className="relative bg-white shadow-lg border-2 border-gray-300 min-h-[900px] w-full max-w-[1440px] mx-auto">
              {/* Сетка для выравнивания */}
              {showGrid && (
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #d1d5db 1px, transparent 1px),
                      linear-gradient(to bottom, #d1d5db 1px, transparent 1px)
                    `,
                    backgroundSize: '16px 16px'
                  }}
                >
                  {/* Дополнительная крупная сетка */}
                  <div className="grid grid-cols-12 gap-4 h-full p-8">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="border-l border-dashed border-gray-400 opacity-30"></div>
                    ))}
                  </div>
                  <div className="grid grid-rows-8 gap-4 h-full p-8 absolute inset-0">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="border-t border-dashed border-gray-400 opacity-30"></div>
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
                      <p className="text-gray-500">Кликните по блокам в левой панели для добавления</p>
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
                        `}
                        style={{
                          left: block.x,
                          top: block.y,
                          width: block.width,
                          height: block.height,
                          backgroundColor: block.backgroundColor,
                          borderColor: block.borderColor,
                          borderRadius: block.borderRadius,
                          zIndex: block.zIndex
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

                          const startX = e.clientX;
                          const startY = e.clientY;
                          const startBlockX = block.x;
                          const startBlockY = block.y;

                          const handleMouseMove = (moveEvent: MouseEvent) => {
                            const dx = moveEvent.clientX - startX;
                            const dy = moveEvent.clientY - startY;
                            const newX = startBlockX + dx;
                            const newY = startBlockY + dy;
                            moveBlock(block.id, newX, newY);
                          };

                          const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                          };

                          document.addEventListener('mousemove', handleMouseMove);
                          document.addEventListener('mouseup', handleMouseUp);
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
                              {/* Новые профессиональные блоки */}
                              {block.type === 'category-title' && (
                                <div className="bg-gray-50 p-4 rounded h-full">
                                  <div className="space-y-2">
                                    <div className="text-lg font-semibold text-gray-800">
                                      {block.categoryTitleSettings?.title || 'Название категории'}
                                    </div>
                                    {block.categoryTitleSettings?.subtitle && (
                                      <div className="text-sm text-gray-600">
                                        {block.categoryTitleSettings.subtitle}
                                      </div>
                                    )}
                                    {block.categoryTitleSettings?.showBreadcrumbs && (
                                      <div className="flex space-x-1 text-xs text-gray-500">
                                        <span>Главная</span>
                                        <span>→</span>
                                        <span>Каталог</span>
                                        <span>→</span>
                                        <span className="font-medium">{block.categoryTitleSettings?.title || 'Категория'}</span>
                                      </div>
                                    )}
                                    {block.categoryTitleSettings?.showProductCount && (
                                      <div className="text-xs text-blue-600">
                                        127 товаров
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {block.type === 'main-category' && (
                                <div className="bg-gray-50 p-4 rounded h-full">
                                  {block.mainCategorySettings?.categoryId ? (
                                    <ProductDisplayPreview
                                      categoryId={block.mainCategorySettings.categoryId}
                                      layout={block.mainCategorySettings.layout}
                                      columns={block.mainCategorySettings.columns}
                                      itemsPerPage={block.mainCategorySettings.itemsPerPage}
                                      imageSize={block.mainCategorySettings.imageSize}
                                      imageAspectRatio={block.mainCategorySettings.imageAspectRatio}
                                      showImages={block.mainCategorySettings.showImages}
                                      showPrices={block.mainCategorySettings.showPrices}
                                      showDescriptions={block.mainCategorySettings.showDescriptions}
                                      showCaptions={block.mainCategorySettings.showCaptions}
                                      captionProperty={block.mainCategorySettings.captionProperty}
                                    />
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-gray-700">
                                        Категория не выбрана
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Макет: {block.mainCategorySettings?.layout === 'grid' ? 'Сетка' :
                                                block.mainCategorySettings?.layout === 'list' ? 'Список' :
                                                block.mainCategorySettings?.layout === 'masonry' ? 'Кирпичная кладка' : 'Не выбран'}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {block.mainCategorySettings?.columns || 3} колонки, {block.mainCategorySettings?.itemsPerPage || 6} товаров
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Изображения: {block.mainCategorySettings?.imageSize === 'small' ? 'Маленькие' :
                                                     block.mainCategorySettings?.imageSize === 'medium' ? 'Средние' :
                                                     block.mainCategorySettings?.imageSize === 'large' ? 'Большие' : 'Не выбрано'}
                                        {block.mainCategorySettings?.imageAspectRatio === 'square' ? ', квадратные' :
                                         block.mainCategorySettings?.imageAspectRatio === 'landscape' ? ', горизонтальные' :
                                         block.mainCategorySettings?.imageAspectRatio === 'portrait' ? ', вертикальные' : ''}
                                      </div>
                                      <div className={`grid gap-1 ${
                                        block.mainCategorySettings?.layout === 'grid' ? 
                                          (block.mainCategorySettings?.columns === 1 ? 'grid-cols-1' :
                                           block.mainCategorySettings?.columns === 2 ? 'grid-cols-2' :
                                           block.mainCategorySettings?.columns === 3 ? 'grid-cols-3' :
                                           block.mainCategorySettings?.columns === 4 ? 'grid-cols-4' :
                                           block.mainCategorySettings?.columns === 5 ? 'grid-cols-5' :
                                           block.mainCategorySettings?.columns === 6 ? 'grid-cols-6' : 'grid-cols-3') :
                                        block.mainCategorySettings?.layout === 'list' ? 'grid-cols-1' :
                                        'grid-cols-3'
                                      }`}>
                                        {Array.from({ length: Math.min(block.mainCategorySettings?.itemsPerPage || 6, 12) }).map((_, i) => (
                                          <div key={i} className="space-y-1">
                                            <div className={`bg-gray-200 rounded flex items-center justify-center ${
                                              block.mainCategorySettings?.imageAspectRatio === 'square' ? 'aspect-square' :
                                              block.mainCategorySettings?.imageAspectRatio === 'landscape' ? 'aspect-video' :
                                              block.mainCategorySettings?.imageAspectRatio === 'portrait' ? 'aspect-[3/4]' : 'aspect-square'
                                            }`}>
                                              <Package className={`${
                                                block.mainCategorySettings?.imageSize === 'small' ? 'h-2 w-2' :
                                                block.mainCategorySettings?.imageSize === 'medium' ? 'h-3 w-3' :
                                                block.mainCategorySettings?.imageSize === 'large' ? 'h-4 w-4' : 'h-3 w-3'
                                              }`} />
                                            </div>
                                            {block.mainCategorySettings?.showCaptions && (
                                              <div className="text-xs text-gray-600 text-center">
                                                {block.mainCategorySettings?.captionProperty === 'name' ? 'Дверь Classic' :
                                                 block.mainCategorySettings?.captionProperty === 'description' ? 'Элегантная дверь...' :
                                                 block.mainCategorySettings?.captionProperty === 'price' ? '15,000 ₽' :
                                                 block.mainCategorySettings?.captionProperty === 'material' ? 'Дуб' :
                                                 block.mainCategorySettings?.captionProperty === 'color' ? 'Белый' : 'Название'}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                      <div className="flex space-x-2 text-xs">
                                        {block.mainCategorySettings?.showImages && <span className="text-green-600">📷</span>}
                                        {block.mainCategorySettings?.showPrices && <span className="text-green-600">💰</span>}
                                        {block.mainCategorySettings?.showDescriptions && <span className="text-green-600">📝</span>}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {block.type === 'subcategory' && (
                                <div className="bg-gray-50 p-4 rounded h-full">
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-gray-700">
                                      Родитель: {block.subcategorySettings?.parentCategoryId === 'doors' ? 'Межкомнатные двери' :
                                                 block.subcategorySettings?.parentCategoryId === 'handles' ? 'Дверные ручки' :
                                                 'Не выбрана'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Макет: {block.subcategorySettings?.layout === 'horizontal' ? 'Горизонтальный' :
                                              block.subcategorySettings?.layout === 'vertical' ? 'Вертикальный' :
                                              block.subcategorySettings?.layout === 'grid' ? 'Сетка' : 'Не выбран'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Максимум: {block.subcategorySettings?.maxSubcategories || 6} подкатегорий
                                    </div>
                                    <div className="space-y-1">
                                      <div className="bg-gray-200 rounded h-2 w-full"></div>
                                      <div className="bg-gray-200 rounded h-2 w-3/4"></div>
                                      <div className="bg-gray-200 rounded h-2 w-1/2"></div>
                                    </div>
                                    <div className="flex space-x-2 text-xs">
                                      {block.subcategorySettings?.showProductCount && <span className="text-green-600">🔢</span>}
                                      {block.subcategorySettings?.showImages && <span className="text-green-600">📷</span>}
                                      {block.subcategorySettings?.showDescriptions && <span className="text-green-600">📝</span>}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {block.type === 'additional-category' && (
                                <div className="bg-gray-50 p-4 rounded h-full">
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-gray-700">
                                      {block.additionalCategorySettings?.categoryId === 'handles' ? 'Дверные ручки' :
                                       block.additionalCategorySettings?.categoryId === 'hardware' ? 'Комплекты фурнитуры' :
                                       block.additionalCategorySettings?.categoryId === 'locks' ? 'Замки' :
                                       'Категория не выбрана'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Стратегия: {block.additionalCategorySettings?.pricingStrategy === 'separate' ? 'Отдельная строка' :
                                                 block.additionalCategorySettings?.pricingStrategy === 'combined' ? 'Объединение' : 'Не выбрана'}
                                    </div>
                                    {block.additionalCategorySettings?.targetMainCategory && (
                                      <div className="text-xs text-gray-500">
                                        Целевая: {block.additionalCategorySettings.targetMainCategory === 'doors' ? 'Межкомнатные двери' : 'Не выбрана'}
                                      </div>
                                    )}
                                    <div className="flex space-x-2 text-xs">
                                      {block.additionalCategorySettings?.showImages && <span className="text-green-600">📷</span>}
                                      {block.additionalCategorySettings?.showPrices && <span className="text-green-600">💰</span>}
                                      {block.additionalCategorySettings?.showDescriptions && <span className="text-green-600">📝</span>}
                                    </div>
                                    <div className="text-xs text-blue-600">
                                      {block.additionalCategorySettings?.pricingStrategy === 'combined' ? 'Цены объединяются' : 'Отдельные строки'}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {block.type === 'product-selector' && (
                                <div className="bg-gray-50 p-4 rounded h-full">
                                  <div className="space-y-2">
                                    <div className="text-sm font-medium text-gray-700">
                                      {block.productSelectorSettings?.categoryId === 'doors' ? 'Межкомнатные двери' :
                                       block.productSelectorSettings?.categoryId === 'handles' ? 'Дверные ручки' :
                                       block.productSelectorSettings?.categoryId === 'hardware' ? 'Комплекты фурнитуры' :
                                       'Категория не выбрана'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Макет: {block.productSelectorSettings?.layout === 'horizontal' ? 'Горизонтальный' :
                                              block.productSelectorSettings?.layout === 'vertical' ? 'Вертикальный' : 'Не выбран'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Свойства: {block.productSelectorSettings?.selectedProperties?.join(', ') || 'Не выбраны'}
                                    </div>
                                    <div className="space-y-1">
                                      {block.productSelectorSettings?.selectedProperties?.map((prop, i) => (
                                        <div key={i} className="bg-gray-200 rounded h-2 w-3/4"></div>
                                      )) || <div className="bg-gray-200 rounded h-2 w-1/2"></div>}
                                    </div>
                                    <div className="flex space-x-2 text-xs">
                                      {block.productSelectorSettings?.showPrice && <span className="text-green-600">💰</span>}
                                      {block.productSelectorSettings?.showImage && <span className="text-green-600">📷</span>}
                                      {block.productSelectorSettings?.showDescription && <span className="text-green-600">📝</span>}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {block.type === 'filter-constructor' && (
                                <div className="bg-gray-50 p-4 rounded h-full">
                                  {block.filterConstructorSettings?.categoryId ? (
                                    <ProductFilters
                                      categoryId={block.filterConstructorSettings.categoryId}
                                      filters={[]}
                                      onFiltersChange={() => {}}
                                      onApplyFilters={() => {}}
                                    />
                                  ) : (
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-gray-700">
                                        Категория не выбрана
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Макет: {block.filterConstructorSettings?.layout === 'horizontal' ? 'Горизонтальный' :
                                                block.filterConstructorSettings?.layout === 'vertical' ? 'Вертикальный' :
                                                block.filterConstructorSettings?.layout === 'sidebar' ? 'Боковая панель' : 'Не выбран'}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Фильтры: {block.filterConstructorSettings?.selectedFilters?.join(', ') || 'Не выбраны'}
                                      </div>
                                      <div className="space-y-1">
                                        {block.filterConstructorSettings?.selectedFilters?.map((filter, i) => (
                                          <div key={i} className="bg-gray-200 rounded h-2 w-2/3"></div>
                                        )) || <div className="bg-gray-200 rounded h-2 w-1/2"></div>}
                                      </div>
                                      <div className="flex space-x-2 text-xs">
                                        {block.filterConstructorSettings?.showApplyButton && <span className="text-green-600">✅</span>}
                                        {block.filterConstructorSettings?.showClearButton && <span className="text-green-600">🗑️</span>}
                                        {block.filterConstructorSettings?.autoApply && <span className="text-blue-600">⚡</span>}
                                        {block.filterConstructorSettings?.showResultCount && <span className="text-green-600">🔢</span>}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {block.type === 'product-image' && (
                                <div className="bg-gray-50 p-4 rounded h-full">
                                  <div className="space-y-2">
                                    <div className="text-xs text-gray-500">
                                      Размер: {block.productImageSettings?.size === 'small' ? 'Маленький' :
                                               block.productImageSettings?.size === 'medium' ? 'Средний' :
                                               block.productImageSettings?.size === 'large' ? 'Большой' :
                                               block.productImageSettings?.size === 'fullscreen' ? 'Полноэкранный' : 'Не выбран'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Пропорции: {block.productImageSettings?.aspectRatio === 'square' ? 'Квадрат' :
                                                  block.productImageSettings?.aspectRatio === 'landscape' ? 'Горизонтальный' :
                                                  block.productImageSettings?.aspectRatio === 'portrait' ? 'Вертикальный' :
                                                  block.productImageSettings?.aspectRatio === 'auto' ? 'Автоматически' : 'Не выбраны'}
                                    </div>
                                    <div className={`bg-gray-200 rounded flex items-center justify-center ${
                                      block.productImageSettings?.aspectRatio === 'square' ? 'aspect-square' :
                                      block.productImageSettings?.aspectRatio === 'landscape' ? 'aspect-video' :
                                      block.productImageSettings?.aspectRatio === 'portrait' ? 'aspect-[3/4]' : 'aspect-square'
                                    }`}>
                                      <ZoomIn className="h-6 w-6" />
                                    </div>
                                    <div className="flex space-x-2 text-xs">
                                      {block.productImageSettings?.showGallery && <span className="text-green-600">🖼️</span>}
                                      {block.productImageSettings?.showZoom && <span className="text-green-600">🔍</span>}
                                      {block.productImageSettings?.showThumbnails && <span className="text-green-600">👁️</span>}
                                    </div>
                                    {block.productImageSettings?.showZoom && (
                                      <div className="text-xs text-gray-500">
                                        Зум: {block.productImageSettings.zoomLevel}x
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {block.type === 'cart-export' && (
                                <div className="bg-gray-50 p-4 rounded h-full">
                                  <div className="space-y-2">
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2 text-xs">
                                        {block.cartExportSettings?.quote.enabled && <span className="text-green-600">📋</span>}
                                        <span className="text-gray-600">КП: {block.cartExportSettings?.quote.enabled ? 'Включено' : 'Отключено'}</span>
                                      </div>
                                      <div className="flex items-center space-x-2 text-xs">
                                        {block.cartExportSettings?.invoice.enabled && <span className="text-green-600">🧾</span>}
                                        <span className="text-gray-600">Счет: {block.cartExportSettings?.invoice.enabled ? 'Включен' : 'Отключен'}</span>
                                      </div>
                                      <div className="flex items-center space-x-2 text-xs">
                                        {block.cartExportSettings?.order.enabled && <span className="text-green-600">📦</span>}
                                        <span className="text-gray-600">Заказ: {block.cartExportSettings?.order.enabled ? 'Включен' : 'Отключен'}</span>
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="bg-gray-200 rounded h-2 w-full"></div>
                                      <div className="bg-gray-200 rounded h-2 w-3/4"></div>
                                    </div>
                                    <div className="flex space-x-2 text-xs">
                                      {block.cartExportSettings?.combineAdditionalCategories && <span className="text-green-600">🔗</span>}
                                      {block.cartExportSettings?.showSeparateLines && <span className="text-green-600">📊</span>}
                                      {block.cartExportSettings?.calculateTotal && <span className="text-green-600">🧮</span>}
                                    </div>
                                    <div className="text-xs text-blue-600">
                                      {block.cartExportSettings?.combineAdditionalCategories ? 'Объединение цен' : 'Отдельные строки'}
                                    </div>
                                  </div>
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

                          {block.type === 'document-generator' && (
                            <div className="h-full overflow-hidden">
                              <h3 className="font-medium mb-2">📄 Генератор документов</h3>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div>Доступные документы:</div>
                                {block.documentGeneratorSettings?.enabledDocuments.map(doc => (
                                  <div key={doc} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {doc === 'quote' && '📄 КП'}
                                    {doc === 'invoice' && '💰 Счет'}
                                    {doc === 'supplier_order' && '🏭 Заказ поставщику'}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {block.type === 'cart' && (
                            <div className="h-full overflow-hidden">
                              <CartBlock 
                                settings={block.cartSettings || {
                                  showItemList: true,
                                  showCalculation: true,
                                  showActions: true,
                                  allowQuantityChange: true,
                                  allowItemRemoval: true,
                                  showClientForm: false,
                                  autoCalculate: true,
                                  showTax: true,
                                  showDiscount: true,
                                  maxItems: 50
                                }}
                                className="h-full"
                              />
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
          <div className="w-64 bg-white border-l border-gray-200 overflow-y-auto">
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

              <div className="space-y-6">
                {/* Основные настройки */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Основные настройки</h4>
                  
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
                    <label htmlFor="blockType" className="block text-sm font-medium text-gray-700 mb-1">Тип блока</label>
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      {selectedBlock.type === 'category-title' && '📋 Наименование категории'}
                      {selectedBlock.type === 'main-category' && '🏪 Основная категория товаров'}
                      {selectedBlock.type === 'subcategory' && '📁 Подкатегории товаров'}
                      {selectedBlock.type === 'additional-category' && '➕ Дополнительные категории'}
                      {selectedBlock.type === 'product-selector' && '⚙️ Конструктор подбора товара'}
                      {selectedBlock.type === 'filter-constructor' && '🔍 Конструктор фильтров'}
                      {selectedBlock.type === 'product-image' && '🖼️ Блок изображения товара'}
                      {selectedBlock.type === 'cart-export' && '📄 Корзина с экспортами'}
                      {selectedBlock.type === 'text' && '📝 Текстовый блок'}
                      {selectedBlock.type === 'document-generator' && '📄 Генератор документов'}
                      {selectedBlock.type === 'cart' && '🛒 Корзина'}
                    </div>
                  </div>
                </div>

                {/* Размеры и позиция */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Размеры и позиция</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="blockX" className="block text-sm font-medium text-gray-700 mb-1">X (px)</label>
                      <Input
                        id="blockX"
                        type="number"
                        value={selectedBlock.x}
                        onChange={(e) => updateBlock(selectedBlock.id, { x: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label htmlFor="blockY" className="block text-sm font-medium text-gray-700 mb-1">Y (px)</label>
                      <Input
                        id="blockY"
                        type="number"
                        value={selectedBlock.y}
                        onChange={(e) => updateBlock(selectedBlock.id, { y: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="blockWidth" className="block text-sm font-medium text-gray-700 mb-1">Ширина (px)</label>
                      <Input
                        id="blockWidth"
                        type="number"
                        value={selectedBlock.width}
                        onChange={(e) => updateBlock(selectedBlock.id, { width: parseInt(e.target.value) || 100 })}
                      />
                    </div>
                    <div>
                      <label htmlFor="blockHeight" className="block text-sm font-medium text-gray-700 mb-1">Высота (px)</label>
                      <Input
                        id="blockHeight"
                        type="number"
                        value={selectedBlock.height}
                        onChange={(e) => updateBlock(selectedBlock.id, { height: parseInt(e.target.value) || 100 })}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="blockZIndex" className="block text-sm font-medium text-gray-700 mb-1">Z-Index</label>
                    <Input
                      id="blockZIndex"
                      type="number"
                      value={selectedBlock.zIndex}
                      onChange={(e) => updateBlock(selectedBlock.id, { zIndex: parseInt(e.target.value) || 1 })}
                    />
                    <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded mt-1">
                      <strong>Что такое Z-Index?</strong><br/>
                      Определяет порядок наложения блоков друг на друга. Блоки с большим значением отображаются поверх блоков с меньшим значением. Используйте для создания слоев и наложений.
                    </div>
                  </div>
                </div>

                {/* Стили */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Стили</h4>
                  
                  <div>
                    <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700 mb-1">Фон</label>
                    <div className="flex space-x-2">
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={selectedBlock.backgroundColor}
                        onChange={(e) => updateBlock(selectedBlock.id, { backgroundColor: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={selectedBlock.backgroundColor}
                        onChange={(e) => updateBlock(selectedBlock.id, { backgroundColor: e.target.value })}
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="borderColor" className="block text-sm font-medium text-gray-700 mb-1">Цвет рамки</label>
                    <div className="flex space-x-2">
                      <Input
                        id="borderColor"
                        type="color"
                        value={selectedBlock.borderColor}
                        onChange={(e) => updateBlock(selectedBlock.id, { borderColor: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={selectedBlock.borderColor}
                        onChange={(e) => updateBlock(selectedBlock.id, { borderColor: e.target.value })}
                        placeholder="#e2e8f0"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="borderRadius" className="block text-sm font-medium text-gray-700 mb-1">Скругление углов (px)</label>
                    <Input
                      id="borderRadius"
                      type="number"
                      value={parseInt(selectedBlock.borderRadius) || 0}
                      onChange={(e) => updateBlock(selectedBlock.id, { borderRadius: `${e.target.value}px` })}
                    />
                  </div>
                </div>


                {/* Специфичные настройки для новых блоков */}
                {selectedBlock.type === 'category-title' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Настройки заголовка категории</h4>
                    
                    <div>
                      <label htmlFor="categoryTitle" className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
                      <Input
                        id="categoryTitle"
                        value={selectedBlock.categoryTitleSettings?.title || ''}
                        onChange={(e) => updateBlock(selectedBlock.id, { 
                          categoryTitleSettings: { 
                            ...selectedBlock.categoryTitleSettings!,
                            title: e.target.value,
                            subtitle: selectedBlock.categoryTitleSettings?.subtitle || '',
                            showBreadcrumbs: selectedBlock.categoryTitleSettings?.showBreadcrumbs || true,
                            showProductCount: selectedBlock.categoryTitleSettings?.showProductCount || true
                          }
                        })}
                        placeholder="Введите название категории"
                      />
                    </div>

                    <div>
                      <label htmlFor="categorySubtitle" className="block text-sm font-medium text-gray-700 mb-1">Подзаголовок</label>
                      <Input
                        id="categorySubtitle"
                        value={selectedBlock.categoryTitleSettings?.subtitle || ''}
                        onChange={(e) => updateBlock(selectedBlock.id, { 
                          categoryTitleSettings: { 
                            ...selectedBlock.categoryTitleSettings!,
                            title: selectedBlock.categoryTitleSettings?.title || '',
                            subtitle: e.target.value,
                            showBreadcrumbs: selectedBlock.categoryTitleSettings?.showBreadcrumbs || true,
                            showProductCount: selectedBlock.categoryTitleSettings?.showProductCount || true
                          }
                        })}
                        placeholder="Введите описание категории"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Отображение</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            checked={selectedBlock.categoryTitleSettings?.showBreadcrumbs || false}
                            onChange={(e) => updateBlock(selectedBlock.id, { 
                              categoryTitleSettings: { 
                                ...selectedBlock.categoryTitleSettings!,
                                showBreadcrumbs: e.target.checked
                              }
                            })}
                            className="rounded" 
                          />
                          <span className="text-sm">Показывать хлебные крошки</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            checked={selectedBlock.categoryTitleSettings?.showProductCount || false}
                            onChange={(e) => updateBlock(selectedBlock.id, { 
                              categoryTitleSettings: { 
                                ...selectedBlock.categoryTitleSettings!,
                                showProductCount: e.target.checked
                              }
                            })}
                            className="rounded" 
                          />
                          <span className="text-sm">Показывать количество товаров</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'main-category' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Настройки основной категории</h4>
                    
                    <div>
                      <label htmlFor="mainCategorySelect" className="block text-sm font-medium text-gray-700 mb-1">Основная категория</label>
                      <MainCategorySelector
                        value={selectedBlock.mainCategorySettings?.categoryId || ''}
                        onValueChange={(value) => updateBlock(selectedBlock.id, { 
                          mainCategorySettings: { 
                            ...selectedBlock.mainCategorySettings!,
                            categoryId: value
                          }
                        })}
                        placeholder="Выберите категорию из каталога"
                      />
                    </div>

                    <div>
                      <label htmlFor="productLayout" className="block text-sm font-medium text-gray-700 mb-1">Макет товаров</label>
                      <Select 
                        id="productLayout"
                        value={selectedBlock.mainCategorySettings?.layout || 'grid'}
                        onValueChange={(value) => updateBlock(selectedBlock.id, { 
                          mainCategorySettings: { 
                            ...selectedBlock.mainCategorySettings!,
                            layout: value as any
                          }
                        })}
                      >
                        <option value="grid">Сетка</option>
                        <option value="list">Список</option>
                        <option value="masonry">Кирпичная кладка</option>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="productColumns" className="block text-sm font-medium text-gray-700 mb-1">Колонки</label>
                        <Input
                          id="productColumns"
                          type="number"
                          value={selectedBlock.mainCategorySettings?.columns || 3}
                          onChange={(e) => updateBlock(selectedBlock.id, { 
                            mainCategorySettings: { 
                              ...selectedBlock.mainCategorySettings!,
                              columns: parseInt(e.target.value) || 3
                            }
                          })}
                          min="1"
                          max="6"
                        />
                      </div>
                      <div>
                        <label htmlFor="itemsPerPage" className="block text-sm font-medium text-gray-700 mb-1">Товаров на странице</label>
                        <Input
                          id="itemsPerPage"
                          type="number"
                          value={selectedBlock.mainCategorySettings?.itemsPerPage || 6}
                          onChange={(e) => updateBlock(selectedBlock.id, { 
                            mainCategorySettings: { 
                              ...selectedBlock.mainCategorySettings!,
                              itemsPerPage: parseInt(e.target.value) || 6
                            }
                          })}
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Настройки изображений</label>
                      <div className="space-y-2">
                        <div>
                          <label htmlFor="imageSize" className="block text-sm font-medium text-gray-700 mb-1">Размер изображений</label>
                          <Select 
                            id="imageSize"
                            value={selectedBlock.mainCategorySettings?.imageSize || 'medium'}
                            onValueChange={(value) => updateBlock(selectedBlock.id, { 
                              mainCategorySettings: { 
                                ...selectedBlock.mainCategorySettings!,
                                imageSize: value as any
                              }
                            })}
                          >
                            <option value="small">Маленький</option>
                            <option value="medium">Средний</option>
                            <option value="large">Большой</option>
                          </Select>
                        </div>
                        <div>
                          <label htmlFor="imageAspectRatio" className="block text-sm font-medium text-gray-700 mb-1">Пропорции изображений</label>
                          <Select 
                            id="imageAspectRatio"
                            value={selectedBlock.mainCategorySettings?.imageAspectRatio || 'square'}
                            onValueChange={(value) => updateBlock(selectedBlock.id, { 
                              mainCategorySettings: { 
                                ...selectedBlock.mainCategorySettings!,
                                imageAspectRatio: value as any
                              }
                            })}
                          >
                            <option value="square">Квадрат</option>
                            <option value="landscape">Горизонтальный</option>
                            <option value="portrait">Вертикальный</option>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Подписи к товарам</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            checked={selectedBlock.mainCategorySettings?.showCaptions || false}
                            onChange={(e) => updateBlock(selectedBlock.id, { 
                              mainCategorySettings: { 
                                ...selectedBlock.mainCategorySettings!,
                                showCaptions: e.target.checked
                              }
                            })}
                            className="rounded" 
                          />
                          <span className="text-sm">Показывать подписи</span>
                        </label>
                        {selectedBlock.mainCategorySettings?.showCaptions && (
                          <div>
                            <label htmlFor="captionProperty" className="block text-sm font-medium text-gray-700 mb-1">Свойство для подписи</label>
                            <Select 
                              id="captionProperty"
                              value={selectedBlock.mainCategorySettings?.captionProperty || 'name'}
                              onValueChange={(value) => updateBlock(selectedBlock.id, { 
                                mainCategorySettings: { 
                                  ...selectedBlock.mainCategorySettings!,
                                  captionProperty: value as any
                                }
                              })}
                            >
                              <option value="name">Название товара</option>
                              <option value="description">Описание</option>
                              <option value="price">Цена</option>
                              <option value="material">Материал</option>
                              <option value="color">Цвет</option>
                            </Select>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Отображение</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            checked={selectedBlock.mainCategorySettings?.showImages || false}
                            onChange={(e) => updateBlock(selectedBlock.id, { 
                              mainCategorySettings: { 
                                ...selectedBlock.mainCategorySettings!,
                                showImages: e.target.checked
                              }
                            })}
                            className="rounded" 
                          />
                          <span className="text-sm">Показывать изображения</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            checked={selectedBlock.mainCategorySettings?.showPrices || false}
                            onChange={(e) => updateBlock(selectedBlock.id, { 
                              mainCategorySettings: { 
                                ...selectedBlock.mainCategorySettings!,
                                showPrices: e.target.checked
                              }
                            })}
                            className="rounded" 
                          />
                          <span className="text-sm">Показывать цены</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            checked={selectedBlock.mainCategorySettings?.showDescriptions || false}
                            onChange={(e) => updateBlock(selectedBlock.id, { 
                              mainCategorySettings: { 
                                ...selectedBlock.mainCategorySettings!,
                                showDescriptions: e.target.checked
                              }
                            })}
                            className="rounded" 
                          />
                          <span className="text-sm">Показывать описания</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'subcategory' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Настройки подкатегорий</h4>
                    
                    <div>
                      <label htmlFor="parentCategory" className="block text-sm font-medium text-gray-700 mb-1">Родительская категория</label>
                      <Select id="parentCategory">
                        <option value="">Выберите родительскую категорию</option>
                        <option value="doors">Межкомнатные двери</option>
                        <option value="handles">Дверные ручки</option>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="subcategoryLayout" className="block text-sm font-medium text-gray-700 mb-1">Макет подкатегорий</label>
                      <Select id="subcategoryLayout">
                        <option value="horizontal">Горизонтальный</option>
                        <option value="vertical">Вертикальный</option>
                        <option value="grid">Сетка</option>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="maxSubcategories" className="block text-sm font-medium text-gray-700 mb-1">Максимум подкатегорий</label>
                      <Input
                        id="maxSubcategories"
                        type="number"
                        defaultValue={6}
                        min="1"
                        max="12"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Отображение</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Показывать количество товаров</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Показывать изображения</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Показывать описания</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'additional-category' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Настройки дополнительных категорий</h4>
                    
                    <div>
                      <label htmlFor="additionalCategorySelect" className="block text-sm font-medium text-gray-700 mb-1">Дополнительная категория</label>
                      <Select id="additionalCategorySelect">
                        <option value="">Выберите дополнительную категорию</option>
                        <option value="handles">Дверные ручки</option>
                        <option value="hardware">Комплекты фурнитуры</option>
                        <option value="locks">Замки</option>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="pricingStrategy" className="block text-sm font-medium text-gray-700 mb-1">Стратегия ценообразования</label>
                      <Select id="pricingStrategy">
                        <option value="separate">Отдельная строка</option>
                        <option value="combined">Объединение с основной категорией</option>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="targetMainCategory" className="block text-sm font-medium text-gray-700 mb-1">Целевая основная категория</label>
                      <Select id="targetMainCategory">
                        <option value="">Не выбрана</option>
                        <option value="doors">Межкомнатные двери</option>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Правила объединения</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Объединять с основной категорией</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Показывать как отдельную строку</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Рассчитывать общую стоимость</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'product-selector' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Настройки конструктора подбора</h4>
                    
                    <div>
                      <label htmlFor="selectorCategory" className="block text-sm font-medium text-gray-700 mb-1">Категория для подбора</label>
                      <Select id="selectorCategory">
                        <option value="">Выберите категорию</option>
                        <option value="doors">Межкомнатные двери</option>
                        <option value="handles">Дверные ручки</option>
                        <option value="hardware">Комплекты фурнитуры</option>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Свойства для подбора</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Материал</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Цвет</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Размер</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Стиль</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Цена</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="selectorLayout" className="block text-sm font-medium text-gray-700 mb-1">Макет селектора</label>
                      <Select id="selectorLayout">
                        <option value="vertical">Вертикальный</option>
                        <option value="horizontal">Горизонтальный</option>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Отображение</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Показывать цену</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Показывать изображение</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Показывать описание</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'filter-constructor' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Настройки конструктора фильтров</h4>
                    
                    <div>
                      <label htmlFor="filterCategory" className="block text-sm font-medium text-gray-700 mb-1">Категория для фильтрации</label>
                      <AnyCategorySelector
                        value={selectedBlock.filterConstructorSettings?.categoryId || ''}
                        onValueChange={(value) => updateBlock(selectedBlock.id, { 
                          filterConstructorSettings: { 
                            ...selectedBlock.filterConstructorSettings!,
                            categoryId: value
                          }
                        })}
                        placeholder="Выберите категорию для фильтрации"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Свойства для фильтрации</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Цена (диапазон)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Цвет (выбор)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Материал (выбор)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Размер (диапазон)</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Бренд (выбор)</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="filterLayout" className="block text-sm font-medium text-gray-700 mb-1">Макет фильтров</label>
                      <Select id="filterLayout">
                        <option value="horizontal">Горизонтальный</option>
                        <option value="vertical">Вертикальный</option>
                        <option value="sidebar">Боковая панель</option>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Элементы управления</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Показывать кнопку "Применить"</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Показывать кнопку "Очистить"</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Автоматическое применение</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Показывать количество результатов</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'product-image' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Настройки изображения товара</h4>
                    
                    <div>
                      <label htmlFor="imageSize" className="block text-sm font-medium text-gray-700 mb-1">Размер изображения</label>
                      <Select id="imageSize">
                        <option value="small">Маленький</option>
                        <option value="medium">Средний</option>
                        <option value="large">Большой</option>
                        <option value="fullscreen">Полноэкранный</option>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-700 mb-1">Пропорции</label>
                      <Select id="aspectRatio">
                        <option value="square">Квадрат</option>
                        <option value="landscape">Горизонтальный</option>
                        <option value="portrait">Вертикальный</option>
                        <option value="auto">Автоматически</option>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Функции</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Показывать галерею</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Показывать зум</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Показывать миниатюры</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="zoomLevel" className="block text-sm font-medium text-gray-700 mb-1">Уровень зума</label>
                      <Input
                        id="zoomLevel"
                        type="number"
                        defaultValue={2}
                        min="1"
                        max="5"
                        step="0.5"
                      />
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'cart-export' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Настройки корзины с экспортами</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Коммерческое предложение</h5>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">Включить в экспорт</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">Показывать цены</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">Показывать итоги</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Счет</h5>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">Включить в экспорт</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">Показывать налоги</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">Показывать итоги</span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">Заказ покупателю</h5>
                        <div className="space-y-2">
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">Включить в экспорт</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">Показывать доставку</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input type="checkbox" defaultChecked className="rounded" />
                            <span className="text-sm">Показывать итоги</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Правила ценообразования</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Объединять дополнительные категории</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm">Показывать отдельные строки</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked className="rounded" />
                          <span className="text-sm">Рассчитывать общую стоимость</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'document-generator' && selectedBlock.documentGeneratorSettings && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Настройки генератора документов</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Доступные документы</label>
                      <div className="space-y-2">
                        {['quote', 'invoice', 'supplier_order'].map((docType) => (
                          <label key={docType} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedBlock.documentGeneratorSettings?.enabledDocuments.includes(docType)}
                              onChange={(e) => {
                                const currentDocs = selectedBlock.documentGeneratorSettings?.enabledDocuments || [];
                                const newDocs = e.target.checked
                                  ? [...currentDocs, docType]
                                  : currentDocs.filter(d => d !== docType);
                                updateBlock(selectedBlock.id, {
                                  documentGeneratorSettings: {
                                    ...selectedBlock.documentGeneratorSettings!,
                                    enabledDocuments: newDocs
                                  }
                                });
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">
                              {docType === 'quote' && '📄 Коммерческое предложение'}
                              {docType === 'invoice' && '💰 Счет на оплату'}
                              {docType === 'supplier_order' && '🏭 Заказ поставщику'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="defaultTemplate" className="block text-sm font-medium text-gray-700 mb-1">Шаблон по умолчанию</label>
                      <Select
                        id="defaultTemplate"
                        value={selectedBlock.documentGeneratorSettings?.defaultTemplate || 'quote'}
                        onValueChange={(value) => updateBlock(selectedBlock.id, {
                          documentGeneratorSettings: {
                            ...selectedBlock.documentGeneratorSettings!,
                            defaultTemplate: value
                          }
                        })}
                      >
                        <option value="quote">Коммерческое предложение</option>
                        <option value="invoice">Счет на оплату</option>
                        <option value="supplier_order">Заказ поставщику</option>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedBlock.documentGeneratorSettings?.showPreview || false}
                          onChange={(e) => updateBlock(selectedBlock.id, {
                            documentGeneratorSettings: {
                              ...selectedBlock.documentGeneratorSettings!,
                              showPreview: e.target.checked
                            }
                          })}
                          className="rounded"
                        />
                        <span className="text-sm">Показывать превью документа</span>
                      </label>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedBlock.documentGeneratorSettings?.allowCustomFields || false}
                          onChange={(e) => updateBlock(selectedBlock.id, {
                            documentGeneratorSettings: {
                              ...selectedBlock.documentGeneratorSettings!,
                              allowCustomFields: e.target.checked
                            }
                          })}
                          className="rounded"
                        />
                        <span className="text-sm">Разрешить пользовательские поля</span>
                      </label>
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'cart' && selectedBlock.cartSettings && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Настройки корзины</h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Отображение элементов</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedBlock.cartSettings?.showItemList || false}
                            onChange={(e) => updateBlock(selectedBlock.id, {
                              cartSettings: {
                                ...selectedBlock.cartSettings!,
                                showItemList: e.target.checked
                              }
                            })}
                            className="rounded"
                          />
                          <span className="text-sm">Показывать список товаров</span>
                        </label>

                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedBlock.cartSettings?.showCalculation || false}
                            onChange={(e) => updateBlock(selectedBlock.id, {
                              cartSettings: {
                                ...selectedBlock.cartSettings!,
                                showCalculation: e.target.checked
                              }
                            })}
                            className="rounded"
                          />
                          <span className="text-sm">Показывать расчет стоимости</span>
                        </label>

                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedBlock.cartSettings?.showActions || false}
                            onChange={(e) => updateBlock(selectedBlock.id, {
                              cartSettings: {
                                ...selectedBlock.cartSettings!,
                                showActions: e.target.checked
                              }
                            })}
                            className="rounded"
                          />
                          <span className="text-sm">Показывать кнопки действий</span>
                        </label>

                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedBlock.cartSettings?.showClientForm || false}
                            onChange={(e) => updateBlock(selectedBlock.id, {
                              cartSettings: {
                                ...selectedBlock.cartSettings!,
                                showClientForm: e.target.checked
                              }
                            })}
                            className="rounded"
                          />
                          <span className="text-sm">Показывать форму клиента</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Интерактивность</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedBlock.cartSettings?.allowQuantityChange || false}
                            onChange={(e) => updateBlock(selectedBlock.id, {
                              cartSettings: {
                                ...selectedBlock.cartSettings!,
                                allowQuantityChange: e.target.checked
                              }
                            })}
                            className="rounded"
                          />
                          <span className="text-sm">Разрешить изменение количества</span>
                        </label>

                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedBlock.cartSettings?.allowItemRemoval || false}
                            onChange={(e) => updateBlock(selectedBlock.id, {
                              cartSettings: {
                                ...selectedBlock.cartSettings!,
                                allowItemRemoval: e.target.checked
                              }
                            })}
                            className="rounded"
                          />
                          <span className="text-sm">Разрешить удаление товаров</span>
                        </label>

                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedBlock.cartSettings?.autoCalculate || false}
                            onChange={(e) => updateBlock(selectedBlock.id, {
                              cartSettings: {
                                ...selectedBlock.cartSettings!,
                                autoCalculate: e.target.checked
                              }
                            })}
                            className="rounded"
                          />
                          <span className="text-sm">Автоматический расчет</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Финансы</label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedBlock.cartSettings?.showTax || false}
                            onChange={(e) => updateBlock(selectedBlock.id, {
                              cartSettings: {
                                ...selectedBlock.cartSettings!,
                                showTax: e.target.checked
                              }
                            })}
                            className="rounded"
                          />
                          <span className="text-sm">Показывать НДС</span>
                        </label>

                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedBlock.cartSettings?.showDiscount || false}
                            onChange={(e) => updateBlock(selectedBlock.id, {
                              cartSettings: {
                                ...selectedBlock.cartSettings!,
                                showDiscount: e.target.checked
                              }
                            })}
                            className="rounded"
                          />
                          <span className="text-sm">Показывать скидки</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="maxItems" className="block text-sm font-medium text-gray-700 mb-1">
                        Максимальное количество товаров
                      </label>
                      <Input
                        id="maxItems"
                        type="number"
                        min="1"
                        max="1000"
                        value={selectedBlock.cartSettings?.maxItems || 50}
                        onChange={(e) => updateBlock(selectedBlock.id, {
                          cartSettings: {
                            ...selectedBlock.cartSettings!,
                            maxItems: parseInt(e.target.value) || 50
                          }
                        })}
                      />
                    </div>
                  </div>
                )}

                {selectedBlock.type === 'text' && selectedBlock.textSettings && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 border-b pb-2">Настройки текста</h4>
                    
                    <div>
                      <label htmlFor="textContent" className="block text-sm font-medium text-gray-700 mb-1">Содержимое</label>
                      <textarea
                        id="textContent"
                        value={selectedBlock.textSettings.content}
                        onChange={(e) => updateBlock(selectedBlock.id, { 
                          textSettings: { ...selectedBlock.textSettings!, content: e.target.value }
                        })}
                        className="w-full p-2 border border-gray-300 rounded"
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700 mb-1">Размер шрифта</label>
                        <Input
                          id="fontSize"
                          value={selectedBlock.textSettings.fontSize}
                          onChange={(e) => updateBlock(selectedBlock.id, { 
                            textSettings: { ...selectedBlock.textSettings!, fontSize: e.target.value }
                          })}
                          placeholder="16px"
                        />
                      </div>
                      <div>
                        <label htmlFor="textColor" className="block text-sm font-medium text-gray-700 mb-1">Цвет текста</label>
                        <div className="flex space-x-2">
                          <Input
                            id="textColor"
                            type="color"
                            value={selectedBlock.textSettings.color}
                            onChange={(e) => updateBlock(selectedBlock.id, { 
                              textSettings: { ...selectedBlock.textSettings!, color: e.target.value }
                            })}
                            className="w-12 h-10 p-1"
                          />
                          <Input
                            value={selectedBlock.textSettings.color}
                            onChange={(e) => updateBlock(selectedBlock.id, { 
                              textSettings: { ...selectedBlock.textSettings!, color: e.target.value }
                            })}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="textAlign" className="block text-sm font-medium text-gray-700 mb-1">Выравнивание</label>
                      <Select
                        id="textAlign"
                        value={selectedBlock.textSettings.textAlign}
                        onValueChange={(value) => updateBlock(selectedBlock.id, { 
                          textSettings: { ...selectedBlock.textSettings!, textAlign: value as any }
                        })}
                      >
                        <option value="left">По левому краю</option>
                        <option value="center">По центру</option>
                        <option value="right">По правому краю</option>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Действия */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => duplicateBlock(selectedBlock.id)} 
                      variant="outline" 
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Дублировать
                    </Button>
                    <Button 
                      onClick={() => deleteBlock(selectedBlock.id)} 
                      variant="destructive" 
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Удалить
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-64 bg-white border-l border-gray-200 p-4">
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
