'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button, Input, Select, Card } from '../ui';
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
  Grip
} from 'lucide-react';
import { useDragAndDrop, useResize } from './useDragAndDrop';
import { ProfessionalBlock, DragItem } from './professionalTypes';
import ImagePreviewSettings from './ImagePreviewSettings';
import ProductDetailBlock from './ProductDetailBlock';

// Компонент для отображения ручек изменения размера
function ResizeHandles({ block, onStartResize }: {
  block: ProfessionalBlock;
  onStartResize: (e: React.MouseEvent, handle: any) => void;
}) {
  const handles = [
    { position: 'n', cursor: 'ns-resize' },
    { position: 's', cursor: 'ns-resize' },
    { position: 'e', cursor: 'ew-resize' },
    { position: 'w', cursor: 'ew-resize' },
    { position: 'ne', cursor: 'nesw-resize' },
    { position: 'nw', cursor: 'nwse-resize' },
    { position: 'se', cursor: 'nwse-resize' },
    { position: 'sw', cursor: 'nesw-resize' }
  ];

  return (
    <>
      {handles.map(handle => (
        <div
          key={handle.position}
          className={`absolute w-3 h-3 bg-blue-500 border border-white hover:bg-blue-600 resize-handle`}
          style={{
            [handle.position]: '-6px',
            cursor: handle.cursor
          }}
          onMouseDown={(e) => onStartResize(e, handle.position)}
        />
      ))}
    </>
  );
}

// Компонент настроек блока
function BlockSettingsPanel({ block, onUpdateBlock, onDeleteBlock, onDuplicateBlock }: {
  block: ProfessionalBlock;
  onUpdateBlock: (updates: Partial<ProfessionalBlock>) => void;
  onDeleteBlock: () => void;
  onDuplicateBlock: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'general' | 'content' | 'style'>('general');

  return (
    <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Настройки блока</h3>
          <div className="flex space-x-1">
            <Button size="sm" variant="outline" onClick={onDuplicateBlock} title="Дублировать">
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onDeleteBlock} title="Удалить" className="text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Название блока */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Название блока</label>
          <Input
            value={block.name}
            onChange={(e) => onUpdateBlock({ name: e.target.value })}
            placeholder="Введите название блока"
          />
        </div>

        {/* Табы */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeTab === 'general' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            <Layout className="h-4 w-4 inline mr-1" />
            Общие
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeTab === 'content' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            <Package className="h-4 w-4 inline mr-1" />
            Контент
          </button>
          <button
            onClick={() => setActiveTab('style')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeTab === 'style' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            <Palette className="h-4 w-4 inline mr-1" />
            Стиль
          </button>
        </div>

        {/* Содержимое табов */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ширина</label>
                <Select
                  value={block.width}
                  onValueChange={(value: any) => onUpdateBlock({ width: value })}
                >
                  <option value="25%">25% (1/4)</option>
                  <option value="33%">33% (1/3)</option>
                  <option value="50%">50% (1/2)</option>
                  <option value="66%">66% (2/3)</option>
                  <option value="75%">75% (3/4)</option>
                  <option value="100%">100% (полная)</option>
                  <option value="custom">Пользовательская</option>
                </Select>
              </div>

              {block.width === 'custom' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Пользовательская ширина</label>
                  <Input
                    value={block.customWidth || ''}
                    onChange={(e) => onUpdateBlock({ customWidth: e.target.value })}
                    placeholder="400px, 60%"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Выравнивание</label>
                <Select
                  value={block.alignment}
                  onValueChange={(value: any) => onUpdateBlock({ alignment: value })}
                >
                  <option value="left">По левому краю</option>
                  <option value="center">По центру</option>
                  <option value="right">По правому краю</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Отступ сверху</label>
                <Input
                  value={block.margin.top}
                  onChange={(e) => onUpdateBlock({ 
                    margin: { ...block.margin, top: e.target.value }
                  })}
                  placeholder="10px"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Отступ снизу</label>
                <Input
                  value={block.margin.bottom}
                  onChange={(e) => onUpdateBlock({ 
                    margin: { ...block.margin, bottom: e.target.value }
                  })}
                  placeholder="10px"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-4">
            {block.type === 'product-grid' && block.productSettings && (
              <ProductGridSettings 
                settings={block.productSettings}
                onUpdate={(updates) => onUpdateBlock({ productSettings: { ...block.productSettings, ...updates } })}
              />
            )}
            
            {block.type === 'product-detail' && (
              <ProductDetailBlock 
                block={block}
                onUpdate={onUpdateBlock}
              />
            )}
            
            {block.type === 'text' && block.textSettings && (
              <TextSettings 
                settings={block.textSettings}
                onUpdate={(updates) => onUpdateBlock({ textSettings: { ...block.textSettings, ...updates } })}
              />
            )}
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Цвет фона</label>
                <Input
                  type="color"
                  value={block.backgroundColor || '#ffffff'}
                  onChange={(e) => onUpdateBlock({ backgroundColor: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Цвет границы</label>
                <Input
                  type="color"
                  value={block.borderColor || '#e5e7eb'}
                  onChange={(e) => onUpdateBlock({ borderColor: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Скругление углов</label>
              <Input
                value={block.borderRadius || '0px'}
                onChange={(e) => onUpdateBlock({ borderRadius: e.target.value })}
                placeholder="8px, 50%"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Настройки сетки товаров
function ProductGridSettings({ settings, onUpdate }: {
  settings: ProfessionalBlock['productSettings'];
  onUpdate: (updates: Partial<ProfessionalBlock['productSettings']>) => void;
}) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold flex items-center">
        <Package className="h-4 w-4 mr-2" />
        Настройки товаров
      </h4>
      
      <div>
        <label className="block text-sm font-medium mb-1">Категория товаров</label>
        <Select
          value={settings.categoryId}
          onValueChange={(value) => onUpdate({ categoryId: value })}
        >
          <option value="">Выберите категорию</option>
          <option value="doors">Межкомнатные двери</option>
          <option value="handles">Дверные ручки</option>
          <option value="hardware">Комплекты фурнитуры</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Колонки</label>
          <Input
            type="number"
            value={settings.columns}
            onChange={(e) => onUpdate({ columns: parseInt(e.target.value) })}
            min={1}
            max={6}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Товаров на странице</label>
          <Input
            type="number"
            value={settings.itemsPerPage}
            onChange={(e) => onUpdate({ itemsPerPage: parseInt(e.target.value) })}
            min={1}
            max={100}
          />
        </div>
      </div>

      {/* Настройки изображений */}
      <ImagePreviewSettings
        settings={settings.imageSettings}
        onUpdate={(imageSettings) => onUpdate({ imageSettings })}
      />

      <div className="space-y-2">
        <h5 className="font-medium flex items-center">
          <Type className="h-4 w-4 mr-2" />
          Отображение информации
        </h5>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showPrices"
              checked={settings.showPrices}
              onChange={(e) => onUpdate({ showPrices: e.target.checked })}
            />
            <label htmlFor="showPrices" className="text-sm">Показывать цены</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showDescriptions"
              checked={settings.showDescriptions}
              onChange={(e) => onUpdate({ showDescriptions: e.target.checked })}
            />
            <label htmlFor="showDescriptions" className="text-sm">Показывать описания</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showAddToCart"
              checked={settings.showAddToCart}
              onChange={(e) => onUpdate({ showAddToCart: e.target.checked })}
            />
            <label htmlFor="showAddToCart" className="text-sm">Кнопка "В корзину"</label>
          </div>
        </div>
      </div>
    </div>
  );
}

// Настройки текста
function TextSettings({ settings, onUpdate }: any) {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Настройки текста</h4>
      <div>
        <label className="block text-sm font-medium mb-1">Содержимое</label>
        <textarea
          value={settings.content}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded"
          rows={4}
        />
      </div>
    </div>
  );
}

// Главный компонент профессионального конструктора
export default function ProfessionalConstructorNew() {
  const [blocks, setBlocks] = useState<ProfessionalBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

  const { dragState, startDrag } = useDragAndDrop();
  const { isResizing, startResize } = useResize();

  const selectedBlock = blocks.find(block => block.id === selectedBlockId);

  // Глобальная функция для обработки drop
  const handleBlockDrop = (dragItem: DragItem, position: { x: number; y: number }) => {
    if (dragItem.source === 'palette') {
      addBlock(dragItem.type as ProfessionalBlock['type'], position);
    } else {
      // Перемещение существующего блока
      updateBlock(dragItem.id, {
        position: { 
          ...blocks.find(b => b.id === dragItem.id)?.position || { width: 400, height: 200, x: 0, y: 0 }, 
          x: position.x, 
          y: position.y 
        }
      });
    }
  };

  // Устанавливаем глобальную функцию
  (window as any).handleBlockDrop = handleBlockDrop;

  const addBlock = (type: ProfessionalBlock['type'], position?: { x: number; y: number }) => {
    const newBlock: ProfessionalBlock = {
      id: Date.now().toString(),
      name: `Блок ${blocks.length + 1}`,
      type,
      position: position ? { width: 400, height: 200, x: position.x - 200, y: position.y - 100 } : { width: 400, height: 200, x: 100, y: 100 },
      isDragging: false,
      isResizing: false,
      width: '100%',
      alignment: 'left',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      padding: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderRadius: '8px',
      zIndex: blocks.length + 1,
      
      // Настройки по умолчанию для каждого типа
      ...(type === 'product-grid' && {
        productSettings: {
          categoryId: '',
          showImages: true,
          imageSettings: {
            size: 'medium',
            aspectRatio: 'square',
            borderRadius: 8,
            shadow: true,
            captionField: 'name',
            placeholderImage: '/placeholder.jpg',
            showOnHover: false
          },
          showPrices: true,
          priceFormat: 'with-currency',
          showDescriptions: true,
          descriptionLength: 'medium',
          showAddToCart: true,
          columns: 3,
          itemsPerPage: 12,
          sortBy: 'name',
          filters: [],
          showProductCount: true,
          showPagination: true
        }
      }),
      
      ...(type === 'product-detail' && {
        detailSettings: {
          showMainImage: true,
          showThumbnailGallery: true,
          showZoom: true,
          imageSettings: {
            size: 'large',
            aspectRatio: 'square',
            borderRadius: 8,
            shadow: true,
            captionField: 'name',
            placeholderImage: '/placeholder.jpg',
            showOnHover: false
          },
          showProductInfo: true,
          showPrice: true,
          showDescription: true,
          showSpecifications: true,
          showRelatedProducts: true
        }
      }),
      
      ...(type === 'text' && {
        textSettings: {
          content: 'Введите текст',
          fontSize: '16px',
          fontFamily: 'system-ui',
          fontWeight: 'normal',
          textAlign: 'left',
          lineHeight: '1.5',
          color: '#333333',
          backgroundColor: 'transparent',
          padding: '10px'
        }
      })
    };
    
    setBlocks([...blocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<ProfessionalBlock>) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  const duplicateBlock = (id: string) => {
    const blockToDuplicate = blocks.find(block => block.id === id);
    if (blockToDuplicate) {
      const newBlock = {
        ...blockToDuplicate,
        id: Date.now().toString(),
        name: `${blockToDuplicate.name} (копия)`,
        position: {
          ...blockToDuplicate.position,
          x: blockToDuplicate.position.x + 20,
          y: blockToDuplicate.position.y + 20
        },
        zIndex: blocks.length + 1
      };
      setBlocks([...blocks, newBlock]);
      setSelectedBlockId(newBlock.id);
    }
  };


  const availableBlocks = [
    { type: 'product-grid' as const, name: 'Сетка товаров', icon: '🏪', description: 'Отображение товаров в виде сетки' },
    { type: 'product-detail' as const, name: 'Детальный просмотр', icon: '🔍', description: 'Увеличенное фото и детали товара' },
    { type: 'product-configurator' as const, name: 'Конфигуратор', icon: '⚙️', description: 'Настройка параметров товара' },
    { type: 'cart-display' as const, name: 'Корзина', icon: '🛒', description: 'Отображение товаров в корзине' },
    { type: 'text' as const, name: 'Текст', icon: '📝', description: 'Текстовый блок' },
    { type: 'image' as const, name: 'Изображение', icon: '🖼️', description: 'Блок с изображением' },
    { type: 'filter' as const, name: 'Фильтры', icon: '🔍', description: 'Фильтры для товаров' }
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Заголовок */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            🎨 Профессиональный конструктор с Drag & Drop
          </h1>
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
                    const dragItem: DragItem = {
                      id: block.type,
                      type: block.type,
                      source: 'palette'
                    };
                    startDrag(e, dragItem, 'new');
                  }}
                  onClick={() => addBlock(block.type)}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer select-none"
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

        {/* Центральная область с drag & drop */}
        <div 
          className="flex-1 bg-gray-50 p-6 overflow-auto relative"
          data-canvas="true"
        >
          <div className="relative min-h-[600px]">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">
              Рабочая область (перетащите блоки сюда)
            </h2>
            
            {blocks.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Пустая страница</h3>
                  <p className="text-gray-500">Перетащите блоки из левой панели или кликните по ним</p>
                  {dragState.isDragging && dragState.draggedItem?.source === 'palette' && (
                    <div className="mt-4 p-4 bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg">
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
                      absolute border-2 rounded-lg cursor-pointer transition-all
                      ${selectedBlockId === block.id 
                        ? 'border-blue-500 bg-blue-50 shadow-lg' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                      }
                      ${dragState.isDragging && dragState.draggedBlockId === block.id ? 'opacity-50 scale-105 shadow-xl' : ''}
                    `}
                    style={{
                      width: block.position.width,
                      height: block.position.height,
                      left: block.position.x,
                      top: block.position.y,
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
                      if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.resize-handle')) {
                        return; // Не начинаем drag если кликнули на ручку изменения размера
                      }
                      const dragItem: DragItem = {
                        id: block.id,
                        type: block.type,
                        source: 'canvas'
                      };
                      startDrag(e, dragItem, 'move');
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
                        onStartResize={(e, handle) => startResize(e, handle, block)}
                      />
                    )}
                    
                    {/* Рендер блока в зависимости от типа */}
                    <div className="p-4 h-full overflow-hidden">
                      {block.type === 'product-grid' && (
                        <div className="bg-gray-50 p-4 rounded h-full">
                          <h3 className="font-medium mb-2">Сетка товаров</h3>
                          <p className="text-sm text-gray-600">
                            {block.productSettings?.columns || 3} колонки, 
                            {block.productSettings?.itemsPerPage || 12} товаров
                          </p>
                          <div className="mt-2 text-xs text-gray-500">
                            Изображения: {block.productSettings?.imageSettings?.size}
                          </div>
                        </div>
                      )}
                      
                      {block.type === 'product-detail' && (
                        <div className="bg-gray-50 p-4 rounded h-full">
                          <h3 className="font-medium mb-2">Детальный просмотр</h3>
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
                      
                      {block.type === 'text' && (
                        <div style={{
                          fontSize: block.textSettings?.fontSize,
                          color: block.textSettings?.color,
                          textAlign: block.textSettings?.textAlign
                        }}>
                          {block.textSettings?.content || 'Текстовый блок'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Правая панель настроек */}
        {selectedBlock ? (
          <BlockSettingsPanel
            block={selectedBlock}
            onUpdateBlock={(updates) => updateBlock(selectedBlock.id, updates)}
            onDeleteBlock={() => deleteBlock(selectedBlock.id)}
            onDuplicateBlock={() => duplicateBlock(selectedBlock.id)}
          />
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
