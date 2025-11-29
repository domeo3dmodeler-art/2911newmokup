'use client';

import React, { useRef, useState } from 'react';
import { useConstructor } from './ConstructorContext';
import { BLOCK_DEFINITIONS } from './blockDefinitions';
import ElementRenderer from './ElementRenderer';
import { Button } from '../ui';
import { Grid, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

export default function CanvasArea() {
  const { elements, addElement, selectElement, selectedElementId } = useConstructor();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { type } = data;
      const elementDef = BLOCK_DEFINITIONS[type];
      
      if (elementDef && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = Math.max(0, (e.clientX - rect.left) / zoom - 20);
        const y = Math.max(0, (e.clientY - rect.top) / zoom - 20);
        
        addElement({
          type: elementDef.type || 'block',
          component: elementDef.component || type,
          props: { ...elementDef.defaultProps },
          position: { x, y },
          size: { 
            width: elementDef.defaultSize?.width || '200px', 
            height: elementDef.defaultSize?.height || '100px' 
          },
          responsive: {},
          styles: {}
        });
      }
    } catch (error) {
      clientLogger.error('Error handling drop:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Если кликнули по канвасу (не по элементу), снимаем выделение
    if (e.target === e.currentTarget) {
      selectElement(null);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`flex-1 bg-gray-50 relative overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Панель управления канвасом */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-white rounded-lg shadow-lg p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <span className="text-sm font-medium min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          disabled={zoom >= 2}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-4 bg-gray-300 mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetZoom}
        >
          Reset
        </Button>
        
        <div className="w-px h-4 bg-gray-300 mx-1" />
        
        <Button
          variant={showGrid ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
        >
          <Grid className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Канвас */}
      <div
        ref={canvasRef}
        className="w-full h-full overflow-auto"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleCanvasClick}
        style={{ 
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          minHeight: '100%',
          minWidth: '100%'
        }}
      >
        {/* Сетка */}
        {showGrid && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
        )}

        {/* Контейнер элементов */}
        <div 
          className="relative min-h-full min-w-full"
          style={{ 
            width: '1200px', // Фиксированная ширина для desktop
            height: '800px', // Минимальная высота
            margin: '20px auto',
            backgroundColor: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px'
          }}
        >
          {/* Отладочная информация */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
              Элементов: {elements?.length || 0}
              {elements && elements.length > 0 && (
                <div className="mt-1">
                  {elements.map(el => (
                    <div key={el.id} className="text-xs">
                      {el.component} ({el.position.x}, {el.position.y})
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Элементы */}
          {elements && elements.length > 0 ? elements.map((element) => (
            <ElementRenderer
              key={element.id}
              element={element}
              isSelected={selectedElementId === element.id}
            />
          )) : (
            <div className="text-center text-gray-500 py-12">
              <div className="text-4xl mb-4">🎨</div>
              <p className="text-lg font-medium mb-2">Пустой холст</p>
              <p className="text-sm">Перетащите элементы из панели слева или кликните по ним</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

