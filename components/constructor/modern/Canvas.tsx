'use client';

import React, { useState } from 'react';
import BlockContent from './BlockContent';

interface Block {
  id: string
  type: 'container' | 'text' | 'image' | 'product-catalog' | 'product-detail' | 'cart' | 'spacer'
  position: { x: number, y: number }
  size: { width: number, height: number }
  props: Record<string, any>
}

interface CanvasProps {
  blocks: Block[]
  selectedBlockId: string | null
  isPreviewMode: boolean
  onBlockSelect: (blockId: string | null) => void
  onBlockUpdate: (blockId: string, updates: Partial<Block>) => void
  onBlockDelete: (blockId: string) => void
}

export default function Canvas({
  blocks,
  selectedBlockId,
  isPreviewMode,
  onBlockSelect,
  onBlockUpdate,
  onBlockDelete
}: CanvasProps) {
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent, blockId: string) => {
    if (isPreviewMode) return

    const block = blocks.find(b => b.id === blockId)!
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    
    setDraggedBlock(blockId)
    setDragOffset({
      x: e.clientX - block.position.x,
      y: e.clientY - block.position.y
    })
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedBlock) return

    const canvasRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const newPosition = {
      x: Math.max(10, Math.min(canvasRect.width - 200, e.clientX - dragOffset.x)),
      y: Math.max(10, e.clientY - dragOffset.y)
    }

    onBlockUpdate(draggedBlock, { position: newPosition })
  }

  const handleMouseUp = () => {
    setDraggedBlock(null)
    setDragOffset({ x: 0, y: 0 })
  }

  const handleResize = (blockId: string, direction: 'width' | 'height', delta: number) => {
    const block = blocks.find(b => b.id === blockId)!
    const newSize = {
      ...block.size,
      [direction]: Math.max(100, Math.min(600, block.size[direction] + delta))
    }
    onBlockUpdate(blockId, { size: newSize })
  }

  return (
    <div className="flex-1 bg-gray-100 flex items-center justify-center p-8">
      {/* Canvas Area */}
      <div 
        className={`
          bg-white shadow-lg rounded-lg border border-gray-200 relative overflow-hidden
          ${isPreviewMode ? 'w-full max-w-4xl' : 'w-full max-w-5xl'}
        `}
        style={{ minHeight: '600px' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Canvas Header */}
        {!isPreviewMode && (
          <div className="absolute top-0 left-0 right-0 bg-gray-50 border-b border-gray-200 p-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Холст</span>
              <span className="text-sm text-gray-400">{blocks.length} блоков</span>
            </div>
          </div>
        )}

        {/* Blocks */}
        {blocks.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-6xl mb-4">🎨</div>
              <p className="text-lg">Начните создавать страницу</p>
              <p className="text-sm">Выберите блок слева и добавьте его на холст</p>
            </div>


          </div>
        ) : (
          blocks.map(block => (
            <div
              key={block.id}
              className={`
                absolute border-2 rounded-lg transition-all duration-150 cursor-pointer
                ${selectedBlockId === block.id 
                  ? 'border-blue-500 shadow-lg' 
                  : 'border-transparent hover:border-gray-300'
                }
                ${draggedBlock === block.id ? 'z-10 shadow-2xl' : 'z-0'}
              `}
              style={{
                left: block.position.x,
                top: block.position.y,
                width: block.size.width,
                height: block.size.height
              }}
              onClick={() => onBlockSelect(block.id)}
              onMouseDown={(e) => handleMouseDown(e, block.id)}
            >
              {/* Block Content */}
              <div className="w-full h-full overflow-hidden">
                <BlockContent 
                  block={block} 
                  isPreview={isPreviewMode}
                  isSelected={selectedBlockId === block.id}
                />
              </div>

              {/* Block Controls */}
              {!isPreviewMode && selectedBlockId === block.id && (
                <>
                  {/* Delete Button */}
                  <button
                    onClick={() => onBlockDelete(block.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600"
                  >
                    ×
                  </button>

                  {/* Resize Handles */}
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      const startY = e.clientY
                      const startWidth = block.size.width
                      
                      const handleMouseMove = (e: MouseEvent) => {
                        const delta = e.clientY - startY
                        handleResize(block.id, 'width', delta)
                      }
                      
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove)
                        document.removeEventListener('mouseup', handleMouseUp)
                      }
                      
                      document.addEventListener('mousemove', handleMouseMove)
                      document.addEventListener('mouseup', handleMouseUp)
                    }}
                  />
                </>
              )}
            </div>
          ))
        )}

        {/* Drop Zone Indicator */}
        {isPreviewMode && blocks.length === 0 && (
          <div className="absolute inset-8 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <p className="text-gray-400">Предпросмотр страницы</p>
          </div>
        )}
      </div>
    </div>
  )
}

