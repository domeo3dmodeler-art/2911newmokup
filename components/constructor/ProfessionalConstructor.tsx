'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button, Input, Select } from '../ui';
import { MainCategorySelector } from './CategorySelector';
import { 
  Plus, Trash2, Save, Eye, Move, Copy, ZoomIn, Layers, MousePointer, Square,
  ChevronLeft, ChevronRight, Grip, Maximize2, Minimize2
} from 'lucide-react';

// Типы данных
interface BlockSettings {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  mainCategorySettings?: any;
  productDisplaySettings?: any;
  styleSettings?: any;
}

interface DragState {
  isDragging: boolean;
  dragType: 'new' | 'move' | 'resize';
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  draggedBlock?: BlockSettings;
}

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
      {handles.map((handle) => (
        <div
          key={handle.position}
          className={`absolute w-2 h-2 bg-blue-500 border border-white cursor-${handle.cursor} opacity-0 group-hover:opacity-100 transition-opacity`}
          style={{
            [handle.position.includes('n') ? 'top' : 'bottom']: '-4px',
            [handle.position.includes('e') ? 'right' : 'left']: '-4px',
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onStartResize(e, handle.position);
          }}
        >
          <span className="text-xs">{handle.icon}</span>
        </div>
      ))}
    </>
  );
};

export default function ProfessionalConstructor({ hideHeader = false }: { hideHeader?: boolean }) {
  const [blocks, setBlocks] = useState<BlockSettings[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [snapToGridEnabled, setSnapToGridEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: 'new',
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 }
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [toolbarMode, setToolbarMode] = useState<'select' | 'move' | 'resize'>('select');

  const canvasRef = useRef<HTMLDivElement>(null);
  const selectedBlock = blocks.find(block => block.id === selectedBlockId);

  // Функция для привязки к сетке
  const snapToGrid = useCallback((x: number, y: number) => {
    const gridSize = 16;
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  }, []);

  // Создание нового блока
  const createBlock = useCallback((type: string, x: number, y: number) => {
    const id = `${type}-${Date.now()}`;
    const newBlock: BlockSettings = {
      id,
      name: `Блок ${blocks.length + 1}`,
      type,
      x,
      y,
      width: 200,
      height: 100,
      zIndex: blocks.length + 1
    };

    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(id);
  }, [blocks.length]);

  // Обновление блока
  const updateBlock = useCallback((blockId: string, updates: Partial<BlockSettings>) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
  }, []);

  // Удаление блока
  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => prev.filter(block => block.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [selectedBlockId]);

  // Дублирование блока
  const duplicateBlock = useCallback((blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      const newBlock: BlockSettings = {
        ...block,
        id: `${block.type}-${Date.now()}`,
        name: `${block.name} (копия)`,
        x: block.x + 20,
        y: block.y + 20,
        zIndex: blocks.length + 1
      };
      setBlocks(prev => [...prev, newBlock]);
      setSelectedBlockId(newBlock.id);
    }
  }, [blocks]);

  // Обработка начала перетаскивания
  const handleMouseDown = useCallback((e: React.MouseEvent, type: string) => {
    e.preventDefault();
    setDragState({
      isDragging: true,
      dragType: 'new',
      startPos: { x: e.clientX, y: e.clientY },
      currentPos: { x: e.clientX, y: e.clientY },
      draggedBlock: { 
        id: '', 
        name: '', 
        type, 
        x: 0, 
        y: 0, 
        width: 200, 
        height: 100, 
        zIndex: 0 
      }
    });
  }, []);

  // Обработка перемещения мыши
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging) return;

    setDragState(prev => ({
      ...prev,
      currentPos: { x: e.clientX, y: e.clientY }
    }));
  }, [dragState.isDragging]);

  // Обработка отпускания мыши
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragState.dragType === 'new' && dragState.draggedBlock) {
      const snapped = snapToGridEnabled ? snapToGrid(x, y) : { x, y };
      createBlock(dragState.draggedBlock.type, snapped.x, snapped.y);
    }

    setDragState({
      isDragging: false,
      dragType: 'new',
      startPos: { x: 0, y: 0 },
      currentPos: { x: 0, y: 0 }
    });
  }, [dragState, snapToGridEnabled, snapToGrid, createBlock]);

  // Эффекты для обработки мыши
  React.useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Доступные блоки
  const availableBlocks = [
    {
      id: 'category-name',
      name: 'Наименование категории',
      icon: '📁',
      description: 'Заголовок категории с хлебными крошками, количеством товаров и описанием.',
      type: 'category-name'
    },
    {
      id: 'main-category',
      name: 'Основная категория товаров',
      icon: '🏢',
      description: 'Основная категория товаров с связью с деревом каталога, настройкой отображения и фильтрации.',
      type: 'main-category'
    },
    {
      id: 'subcategories',
      name: 'Подкатегории товаров',
      icon: '📂',
      description: 'Вложенные категории верхнего уровня с настройкой макета и отображения.',
      type: 'subcategories'
    },
    {
      id: 'additional-categories',
      name: 'Дополнительные категории',
      icon: '➕',
      description: 'Дополнительные категории для расчета общей цены, с настройкой объединения или отдельного отображения.',
      type: 'additional-categories'
    },
    {
      id: 'product-constructor',
      name: 'Конструктор подбора товара',
      icon: '⚙️',
      description: 'Конструктор параметров для подбора товара, настройка отображаемых свойств и типов ввода.',
      type: 'product-constructor'
    },
    {
      id: 'constructor',
      name: 'Конструктор',
      icon: '🔧',
      description: 'Универсальный конструктор для создания сложных интерфейсов.',
      type: 'constructor'
    }
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Верхняя панель инструментов */}
      {!hideHeader && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                🎨 Конструктор страниц
              </h1>
              
              {/* Режимы инструментов */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    toolbarMode === 'select' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setToolbarMode('select')}
                >
                  <MousePointer className="h-4 w-4" />
                </button>
                <button
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    toolbarMode === 'move' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setToolbarMode('move')}
                >
                  <Move className="h-4 w-4" />
                </button>
                <button
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    toolbarMode === 'resize' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setToolbarMode('resize')}
                >
                  <Square className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Настройки сетки */}
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Сетка</span>
                </label>
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={snapToGridEnabled}
                    onChange={(e) => setSnapToGridEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Привязка</span>
                </label>
              </div>

              {/* Кнопки действий */}
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Предпросмотр
                </Button>
                <Button size="sm">
                  <Save className="h-4 w-4 mr-1" />
                  Сохранить
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Левая панель блоков */}
        <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'w-12' : 'w-64'
        }`}>
          {sidebarCollapsed ? (
            <div className="p-2">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="w-full p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Блоки</h3>
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                {availableBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="p-3 border border-gray-200 rounded-lg cursor-move hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    onMouseDown={(e) => handleMouseDown(e, block.type)}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg">{block.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {block.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {block.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Центральная рабочая область */}
        <div className="flex-1 flex flex-col">
          {/* Информационная панель */}
          <div className="bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Размер: 1440×900px
                </span>
                <span className="text-sm text-gray-600">
                  Блоков: {blocks.length}
                </span>
                {selectedBlock && (
                  <span className="text-sm text-blue-600">
                    Выбран: {selectedBlock.name}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Layers className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Холст */}
          <div className="flex-1 relative overflow-auto bg-gray-100 p-8">
            <div
              ref={canvasRef}
              className="relative bg-white shadow-lg border border-gray-300 min-h-[900px] w-full max-w-[1440px] mx-auto"
              style={{ minWidth: '1440px', minHeight: '900px' }}
            >
              {/* Сетка */}
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
                />
              )}

              {/* Блоки */}
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className={`absolute border-2 cursor-pointer transition-all ${
                    selectedBlockId === block.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  } group`}
                  style={{
                    left: block.x,
                    top: block.y,
                    width: block.width,
                    height: block.height,
                    zIndex: block.zIndex
                  }}
                  onClick={() => setSelectedBlockId(block.id)}
                >
                  <div className="p-2 h-full flex items-center justify-center text-sm text-gray-600">
                    {block.name}
                  </div>
                  
                  {selectedBlockId === block.id && (
                    <ResizeHandles 
                      block={block} 
                      onStartResize={(e, handle) => {
                        e.stopPropagation();
                        // Обработка изменения размера
                      }}
                    />
                  )}
                </div>
              ))}

              {/* Заглушка для пустого холста */}
              {blocks.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-lg font-medium mb-2">Пустая страница</h3>
                  <p className="text-sm">Перетащите блоки из левой панели</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Правая панель настроек */}
        <div className={`bg-white border-l border-gray-200 transition-all duration-300 ${
          rightPanelCollapsed ? 'w-12' : 'w-80'
        }`}>
          {rightPanelCollapsed ? (
            <div className="p-2">
              <button
                onClick={() => setRightPanelCollapsed(false)}
                className="w-full p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Настройки</h3>
                <button
                  onClick={() => setRightPanelCollapsed(true)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {selectedBlock ? (
                <div className="space-y-6">
                  {/* Основные настройки блока */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Основные</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Название
                        </label>
                        <Input
                          value={selectedBlock.name}
                          onChange={(e) => updateBlock(selectedBlock.id, { name: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            X
                          </label>
                          <Input
                            type="number"
                            value={selectedBlock.x}
                            onChange={(e) => updateBlock(selectedBlock.id, { x: parseInt(e.target.value) || 0 })}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Y
                          </label>
                          <Input
                            type="number"
                            value={selectedBlock.y}
                            onChange={(e) => updateBlock(selectedBlock.id, { y: parseInt(e.target.value) || 0 })}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Ширина
                          </label>
                          <Input
                            type="number"
                            value={selectedBlock.width}
                            onChange={(e) => updateBlock(selectedBlock.id, { width: parseInt(e.target.value) || 0 })}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Высота
                          </label>
                          <Input
                            type="number"
                            value={selectedBlock.height}
                            onChange={(e) => updateBlock(selectedBlock.id, { height: parseInt(e.target.value) || 0 })}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Специфичные настройки для разных типов блоков */}
                  {selectedBlock.type === 'main-category' && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Категория</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Основная категория
                          </label>
                          <MainCategorySelector
                            value={selectedBlock.mainCategorySettings?.categoryId || ''}
                            onValueChange={(value) => updateBlock(selectedBlock.id, { 
                              mainCategorySettings: { 
                                ...selectedBlock.mainCategorySettings,
                                categoryId: value 
                              } 
                            })}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Макет товаров
                          </label>
                          <Select
                            value={selectedBlock.productDisplaySettings?.layout || 'grid'}
                            onValueChange={(value) => updateBlock(selectedBlock.id, { 
                              productDisplaySettings: { 
                                ...selectedBlock.productDisplaySettings,
                                layout: value 
                              } 
                            })}
                          >
                            <option value="grid">Сетка</option>
                            <option value="list">Список</option>
                            <option value="masonry">Каменная кладка</option>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Колонки
                            </label>
                            <Input
                              type="number"
                              value={selectedBlock.productDisplaySettings?.columns || 3}
                              onChange={(e) => updateBlock(selectedBlock.id, { 
                                productDisplaySettings: { 
                                  ...selectedBlock.productDisplaySettings,
                                  columns: parseInt(e.target.value) || 3 
                                } 
                              })}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Товаров на странице
                            </label>
                            <Input
                              type="number"
                              value={selectedBlock.productDisplaySettings?.itemsPerPage || 6}
                              onChange={(e) => updateBlock(selectedBlock.id, { 
                                productDisplaySettings: { 
                                  ...selectedBlock.productDisplaySettings,
                                  itemsPerPage: parseInt(e.target.value) || 6 
                                } 
                              })}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Действия с блоком */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => duplicateBlock(selectedBlock.id)}
                        className="flex-1"
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Дублировать
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBlock(selectedBlock.id)}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-4xl mb-4">⚙️</div>
                  <h3 className="text-lg font-medium mb-2">Настройки блока</h3>
                  <p className="text-sm">Выберите блок для редактирования</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}