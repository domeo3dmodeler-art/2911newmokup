'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Input, Select, Card, Checkbox } from '../ui';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Settings, 
  Eye, 
  Save, 
  Grid3X3,
  Maximize,
  Minimize
} from 'lucide-react';
import { clientLogger } from '@/lib/logging/client-logger';
import CatalogSelector from './CatalogSelector';
import PropertyMapper from './PropertyMapper';
import FormulaBuilder from './FormulaBuilder';

// Интерфейс для блока конструктора категории
interface CategoryBlock {
  id: string;
  name: string;
  type: 'catalog-selector' | 'property-mapper' | 'formula-builder' | 'style-settings' | 'conditional-logic' | 'preview-panel';
  
  // Позиция и размеры
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;

  // Настройки для каждого типа блока
  catalogSelectorSettings?: {
    selectedCategories: string[];
    multiSelect: boolean;
    showProductCount: boolean;
  };
  
  propertyMapperSettings?: {
    showFields: string[];
    requiredFields: string[];
    layout: 'grid' | 'list';
  };
  
  formulaBuilderSettings?: {
    priceFormula: string;
    discountFormula: string;
    customFormulas: { name: string; formula: string }[];
  };
  
  styleSettings?: {
    theme: 'default' | 'dark' | 'light';
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    fonts: {
      primary: string;
      secondary: string;
    };
  };
  
  conditionalLogicSettings?: {
    rules: Array<{
      condition: string;
      action: string;
      target: string;
    }>;
  };
  
  previewPanelSettings?: {
    showPreview: boolean;
    updateMode: 'realtime' | 'manual';
  };
}

// Состояние перетаскивания
interface DragState {
  isDragging: boolean;
  dragItem: {
    id: string;
    type: string;
    source: 'palette' | 'canvas';
  } | null;
  dragOffset: { x: number; y: number };
}

// Компонент ручек для изменения размера
const ResizeHandles = ({ block, onStartResize }: { block: CategoryBlock; onStartResize: (e: React.MouseEvent, handle: string) => void }) => {
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
      {handles.map(handle => (
        <div
          key={handle.position}
          className={`absolute ${handle.position === 'n' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' :
                      handle.position === 's' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' :
                      handle.position === 'e' ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2' :
                      handle.position === 'w' ? 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2' :
                      handle.position === 'ne' ? 'top-0 right-0 -translate-x-1/2 -translate-y-1/2' :
                      handle.position === 'nw' ? 'top-0 left-0 translate-x-1/2 -translate-y-1/2' :
                      handle.position === 'se' ? 'bottom-0 right-0 -translate-x-1/2 translate-y-1/2' :
                      'bottom-0 left-0 translate-x-1/2 translate-y-1/2'} 
                      w-3 h-3 bg-blue-600 border border-white rounded-full cursor-${handle.cursor} opacity-0 hover:opacity-100 transition-opacity`}
          onMouseDown={(e) => onStartResize(e, handle.position)}
        >
          <span className="text-xs text-white flex items-center justify-center h-full">{handle.icon}</span>
        </div>
      ))}
    </>
  );
};

// Главный компонент конструктора категорий
export default function CategoryConstructor() {
  const [blocks, setBlocks] = useState<CategoryBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [snapToGridEnabled, setSnapToGridEnabled] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragItem: null,
    dragOffset: { x: 0, y: 0 }
  });
  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    blockId: string;
    handle: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const gridSize = 20;

  // Создание нового блока
  const createBlock = useCallback((type: CategoryBlock['type'], x: number, y: number): CategoryBlock => {
    const blockNames = {
      'catalog-selector': 'Выбор категорий каталога',
      'property-mapper': 'Настройка свойств товаров',
      'formula-builder': 'Формулы расчета цен',
      'style-settings': 'Настройки стилей',
      'conditional-logic': 'Условная логика',
      'preview-panel': 'Предпросмотр конфигуратора'
    };

    return {
      id: Date.now().toString(),
      name: blockNames[type],
      type,
      x,
      y,
      width: 300,
      height: 200,
      zIndex: blocks.length + 1,
      
      // Настройки по умолчанию для каждого типа
      ...(type === 'catalog-selector' && {
        catalogSelectorSettings: {
          selectedCategories: [],
          multiSelect: true,
          showProductCount: true
        }
      }),
      
      ...(type === 'property-mapper' && {
        propertyMapperSettings: {
          showFields: ['name', 'price', 'brand'],
          requiredFields: ['name', 'price'],
          layout: 'grid'
        }
      }),
      
      ...(type === 'formula-builder' && {
        formulaBuilderSettings: {
          priceFormula: 'base_price * 1.2',
          discountFormula: 'quantity > 10 ? 0.1 : 0',
          customFormulas: []
        }
      }),
      
      ...(type === 'style-settings' && {
        styleSettings: {
          theme: 'default',
          colors: {
            primary: '#3B82F6',
            secondary: '#6B7280',
            accent: '#F59E0B'
          },
          fonts: {
            primary: 'system-ui',
            secondary: 'system-ui'
          }
        }
      }),
      
      ...(type === 'conditional-logic' && {
        conditionalLogicSettings: {
          rules: []
        }
      }),
      
      ...(type === 'preview-panel' && {
        previewPanelSettings: {
          showPreview: true,
          updateMode: 'realtime'
        }
      })
    };
  }, [blocks.length]);

  // Привязка к сетке
  const snapToGrid = useCallback((x: number, y: number, width: number, height: number) => {
    if (!snapToGridEnabled) return { x, y, width, height };
    
    const snapX = Math.round(x / gridSize) * gridSize;
    const snapY = Math.round(y / gridSize) * gridSize;
    const snapWidth = Math.round(width / gridSize) * gridSize;
    const snapHeight = Math.round(height / gridSize) * gridSize;
    return { x: snapX, y: snapY, width: snapWidth, height: snapHeight };
  }, [snapToGridEnabled]);

  // Обновление блока
  const updateBlock = useCallback((id: string, updates: Partial<CategoryBlock>) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === id ? { ...block, ...updates } : block
      )
    );
  }, []);

  // Удаление блока
  const deleteBlock = useCallback((id: string) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  }, [selectedBlockId]);

  // Дублирование блока
  const duplicateBlock = useCallback((id: string) => {
    const blockToDuplicate = blocks.find(block => block.id === id);
    if (blockToDuplicate) {
      const newBlock: CategoryBlock = {
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
  const addBlock = useCallback((type: CategoryBlock['type']) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = rect.width / 2 - 200;
      const y = rect.height / 2 - 150;
      const newBlock = createBlock(type, x, y);
      setBlocks(prev => [...prev, newBlock]);
      setSelectedBlockId(newBlock.id);
    }
  }, [createBlock]);

  // Начало перетаскивания
  const handleDragStart = useCallback((e: React.MouseEvent, type: CategoryBlock['type'], source: 'palette' | 'canvas' = 'palette') => {
    e.preventDefault();
    setDragState({
      isDragging: true,
      dragItem: { id: Date.now().toString(), type, source },
      dragOffset: { x: 0, y: 0 }
    });
  }, []);

  // Обработка клика по холсту
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (dragState.isDragging && dragState.dragItem) {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - dragState.dragOffset.x;
        const y = e.clientY - rect.top - dragState.dragOffset.y;
        
        const { x: snappedX, y: snappedY } = snapToGrid(x, y, 300, 200);
        const newBlock = createBlock(dragState.dragItem.type as CategoryBlock['type'], snappedX, snappedY);
        
        setBlocks(prev => [...prev, newBlock]);
        setSelectedBlockId(newBlock.id);
      }
    }
    
    setDragState({
      isDragging: false,
      dragItem: null,
      dragOffset: { x: 0, y: 0 }
    });
  }, [dragState, createBlock, snapToGrid]);

  // Обработка клика по блоку
  const handleBlockClick = useCallback((e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    setSelectedBlockId(blockId);
  }, []);

  // Начало перетаскивания блока
  const handleBlockDragStart = useCallback((e: React.MouseEvent, blockId: string) => {
    e.stopPropagation();
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      setDragState({
        isDragging: true,
        dragItem: { id: blockId, type: block.type, source: 'canvas' },
        dragOffset: {
          x: e.clientX - block.x,
          y: e.clientY - block.y
        }
      });
    }
  }, [blocks]);

  // Начало изменения размера
  const handleResizeStart = useCallback((e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    const block = blocks.find(b => b.id === selectedBlockId);
    if (block) {
      setResizeState({
        isResizing: true,
        blockId: block.id,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: block.width,
        startHeight: block.height
      });
    }
  }, [blocks, selectedBlockId]);

  // Получение текущего выбранного блока
  const selectedBlock = blocks.find(block => block.id === selectedBlockId);

  // Сохранение конфигурации
  const handleSave = useCallback(() => {
    const config = {
      layout: {
        type: 'grid',
        columns: 12,
        gap: 4
      },
      components: blocks.map(block => ({
        id: block.id,
        type: block.type,
        config: {
          ...block.catalogSelectorSettings,
          ...block.propertyMapperSettings,
          ...block.formulaBuilderSettings,
          ...block.styleSettings,
          ...block.conditionalLogicSettings,
          ...block.previewPanelSettings
        },
        position: {
          x: block.x,
          y: block.y,
          width: block.width,
          height: block.height,
          zIndex: block.zIndex
        }
      })),
      settings: {
        theme: 'default',
        colors: {
          primary: '#3B82F6',
          secondary: '#6B7280'
        }
      }
    };

    clientLogger.debug('Сохранение конфигурации:', config);
    // Здесь будет логика сохранения в базу данных
    alert('Конфигурация сохранена!');
  }, [blocks]);

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Панель инструментов */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Заголовок */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Конструктор категории</h2>
          <p className="text-sm text-gray-600 mt-1">Создайте интерфейс конфигуратора</p>
        </div>

        {/* Палитра блоков */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Блоки конструктора</h3>
          
          <div className="space-y-2">
            {/* Блок выбора категорий каталога */}
            <div
              className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onMouseDown={(e) => handleDragStart(e, 'catalog-selector')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-sm">📋</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Выбор категорий</div>
                  <div className="text-xs text-gray-500">Выберите категории каталога с товарами</div>
                </div>
              </div>
            </div>

            {/* Блок настройки свойств */}
            <div
              className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onMouseDown={(e) => handleDragStart(e, 'property-mapper')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-sm">🏷️</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Настройка свойств</div>
                  <div className="text-xs text-gray-500">Настройте отображение свойств товаров</div>
                </div>
              </div>
            </div>

            {/* Блок формул расчета */}
            <div
              className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onMouseDown={(e) => handleDragStart(e, 'formula-builder')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-sm">🧮</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Формулы расчета</div>
                  <div className="text-xs text-gray-500">Настройте формулы расчета цен</div>
                </div>
              </div>
            </div>

            {/* Блок настроек стилей */}
            <div
              className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onMouseDown={(e) => handleDragStart(e, 'style-settings')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                  <span className="text-pink-600 text-sm">🎨</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Настройки стилей</div>
                  <div className="text-xs text-gray-500">Настройте внешний вид конфигуратора</div>
                </div>
              </div>
            </div>

            {/* Блок условной логики */}
            <div
              className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onMouseDown={(e) => handleDragStart(e, 'conditional-logic')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 text-sm">🔄</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Условная логика</div>
                  <div className="text-xs text-gray-500">Настройте условные правила</div>
                </div>
              </div>
            </div>

            {/* Блок предпросмотра */}
            <div
              className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              onMouseDown={(e) => handleDragStart(e, 'preview-panel')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-600 text-sm">📊</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Предпросмотр</div>
                  <div className="text-xs text-gray-500">Предпросмотр конфигуратора</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Панель свойств */}
        {selectedBlock && (
          <div className="border-t border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Свойства блока</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Название</label>
                <Input
                  value={selectedBlock.name}
                  onChange={(e) => updateBlock(selectedBlock.id, { name: e.target.value })}
                  className="text-sm"
                />
              </div>

              {/* Настройки для блока выбора категорий */}
              {selectedBlock.type === 'catalog-selector' && selectedBlock.catalogSelectorSettings && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Множественный выбор</label>
                    <Checkbox
                      checked={selectedBlock.catalogSelectorSettings.multiSelect}
                      onChange={(checked) => updateBlock(selectedBlock.id, {
                        catalogSelectorSettings: {
                          ...selectedBlock.catalogSelectorSettings,
                          multiSelect: checked
                        }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Показывать количество товаров</label>
                    <Checkbox
                      checked={selectedBlock.catalogSelectorSettings.showProductCount}
                      onChange={(checked) => updateBlock(selectedBlock.id, {
                        catalogSelectorSettings: {
                          ...selectedBlock.catalogSelectorSettings,
                          showProductCount: checked
                        }
                      })}
                    />
                  </div>
                </div>
              )}

              {/* Настройки для блока свойств */}
              {selectedBlock.type === 'property-mapper' && selectedBlock.propertyMapperSettings && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Макет</label>
                  <Select
                    value={selectedBlock.propertyMapperSettings.layout}
                    onChange={(value) => updateBlock(selectedBlock.id, {
                      propertyMapperSettings: {
                        ...selectedBlock.propertyMapperSettings,
                        layout: value as 'grid' | 'list'
                      }
                    })}
                  >
                    <option value="grid">Сетка</option>
                    <option value="list">Список</option>
                  </Select>
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="flex space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => duplicateBlock(selectedBlock.id)}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-1" />
                Копировать
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteBlock(selectedBlock.id)}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Удалить
              </Button>
            </div>
          </div>
        )}

        {/* Кнопка сохранения */}
        <div className="border-t border-gray-200 p-4">
          <Button
            onClick={handleSave}
            className="w-full"
            disabled={blocks.length === 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Сохранить конфигурацию
          </Button>
        </div>
      </div>

      {/* Основная область */}
      <div className="flex-1 flex flex-col">
        {/* Панель инструментов */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="snapToGrid"
                  checked={snapToGridEnabled}
                  onChange={(e) => setSnapToGridEnabled(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="snapToGrid" className="text-sm text-gray-600">Привязка к сетке</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showGrid"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="showGrid" className="text-sm text-gray-600">Показать сетку</label>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-1" />
                Предпросмотр
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-1" />
                Настройки
              </Button>
            </div>
          </div>
        </div>

        {/* Холст */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden bg-gray-50"
          onClick={handleCanvasClick}
          style={{
            backgroundImage: showGrid ? `radial-gradient(circle, #e5e7eb 1px, transparent 1px)` : 'none',
            backgroundSize: `${gridSize}px ${gridSize}px`
          }}
        >
          {/* Блоки */}
          {blocks.map(block => (
            <div
              key={block.id}
              className={`absolute border-2 cursor-move transition-all ${
                selectedBlockId === block.id
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{
                left: block.x,
                top: block.y,
                width: block.width,
                height: block.height,
                zIndex: block.zIndex,
                backgroundColor: 'white'
              }}
              onClick={(e) => handleBlockClick(e, block.id)}
              onMouseDown={(e) => handleBlockDragStart(e, block.id)}
            >
              {/* Ручки изменения размера */}
              {selectedBlockId === block.id && (
                <ResizeHandles block={block} onStartResize={handleResizeStart} />
              )}

              {/* Содержимое блока */}
              <div className="p-2 h-full overflow-hidden">
                {block.type === 'catalog-selector' && (
                  <div className="h-full">
                    <CatalogSelector
                      selectedCategories={block.catalogSelectorSettings?.selectedCategories || []}
                      multiSelect={block.catalogSelectorSettings?.multiSelect || true}
                      showProductCount={block.catalogSelectorSettings?.showProductCount || true}
                      onSelectionChange={(selectedIds) => updateBlock(block.id, {
                        catalogSelectorSettings: {
                          ...block.catalogSelectorSettings,
                          selectedCategories: selectedIds
                        }
                      })}
                    />
                  </div>
                )}

                {block.type === 'property-mapper' && (
                  <div className="h-full">
                    <PropertyMapper
                      showFields={block.propertyMapperSettings?.showFields || []}
                      requiredFields={block.propertyMapperSettings?.requiredFields || []}
                      layout={block.propertyMapperSettings?.layout || 'grid'}
                      onFieldsChange={(fields) => {
                        // Обновляем поля в настройках блока
                        updateBlock(block.id, {
                          propertyMapperSettings: {
                            ...block.propertyMapperSettings,
                            showFields: fields.filter(f => f.isVisible).map(f => f.name),
                            requiredFields: fields.filter(f => f.isRequired).map(f => f.name)
                          }
                        });
                      }}
                      onRequiredFieldsChange={(requiredFields) => {
                        updateBlock(block.id, {
                          propertyMapperSettings: {
                            ...block.propertyMapperSettings,
                            requiredFields
                          }
                        });
                      }}
                    />
                  </div>
                )}

                {block.type === 'formula-builder' && (
                  <div className="h-full">
                    <FormulaBuilder
                      priceFormula={block.formulaBuilderSettings?.priceFormula || 'base_price * 1.2'}
                      discountFormula={block.formulaBuilderSettings?.discountFormula || 'quantity > 10 ? 0.1 : 0'}
                      customFormulas={block.formulaBuilderSettings?.customFormulas || []}
                      onPriceFormulaChange={(formula) => updateBlock(block.id, {
                        formulaBuilderSettings: {
                          ...block.formulaBuilderSettings,
                          priceFormula: formula
                        }
                      })}
                      onDiscountFormulaChange={(formula) => updateBlock(block.id, {
                        formulaBuilderSettings: {
                          ...block.formulaBuilderSettings,
                          discountFormula: formula
                        }
                      })}
                      onCustomFormulasChange={(formulas) => updateBlock(block.id, {
                        formulaBuilderSettings: {
                          ...block.formulaBuilderSettings,
                          customFormulas: formulas
                        }
                      })}
                    />
                  </div>
                )}

                {block.type === 'style-settings' && (
                  <div className="bg-pink-50 p-4 rounded h-full">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-pink-800">
                        Тема: {block.styleSettings?.theme || 'default'}
                      </div>
                      <div className="text-xs text-pink-600">
                        Основной цвет: {block.styleSettings?.colors.primary || '#3B82F6'}
                      </div>
                      <div className="text-xs text-pink-600">
                        Шрифт: {block.styleSettings?.fonts.primary || 'system-ui'}
                      </div>
                    </div>
                  </div>
                )}

                {block.type === 'conditional-logic' && (
                  <div className="bg-orange-50 p-4 rounded h-full">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-orange-800">
                        Условная логика
                      </div>
                      <div className="text-xs text-orange-600">
                        Правил: {block.conditionalLogicSettings?.rules.length || 0}
                      </div>
                    </div>
                  </div>
                )}

                {block.type === 'preview-panel' && (
                  <div className="bg-gray-50 p-4 rounded h-full">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-800">
                        Предпросмотр конфигуратора
                      </div>
                      <div className="text-xs text-gray-600">
                        Режим: {block.previewPanelSettings?.updateMode === 'realtime' ? 'Реальное время' : 'Ручной'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Сообщение при пустом холсте */}
          {blocks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-4">🎨</div>
                <div className="text-lg font-medium mb-2">Начните создание конфигуратора</div>
                <div className="text-sm">Перетащите блоки из панели слева на холст</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
