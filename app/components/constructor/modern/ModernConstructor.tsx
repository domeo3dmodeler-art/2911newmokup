'use client';

import React, { useState } from 'react';
import BlocksPanel from './BlocksPanel';
import Canvas from './Canvas';
import PropertiesPanel from './PropertiesPanel';
import Toolbar from './Toolbar';

// ========== TYPES ==========
interface Block {
  id: string
  type: 'container' | 'text' | 'image' | 'product-catalog' | 'product-detail' | 'cart' | 'spacer'
  position: { x: number, y: number }
  size: { width: number, height: number }
  props: Record<string, any>
}

interface ModerenConstructorState {
  blocks: Block[]
  selectedBlockId: string | null
  isPreviewMode: boolean
}

// ========== MAIN CONSTRUCTOR ==========
export default function ModernConstructor() {
  const [state, setState] = useState<ModerenConstructorState>({
    blocks: [],
    selectedBlockId: null,
    isPreviewMode: false
  })

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: `block_${Date.now()}`,
      type,
      position: { x: 50, y: 50 },
      size: { width: 300, height: type === 'spacer' ? 20 : 200 },
      props: getDefaultProps(type)
    }

    setState(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
      selectedBlockId: newBlock.id
    }))
  }

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    setState(prev => ({
      ...prev,
      blocks: prev.blocks.map(block => 
        block.id === blockId 
          ? { ...block, ...updates }
          : block
      )
    }))
  }

  const deleteBlock = (blockId: string) => {
    setState(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId),
      selectedBlockId: prev.selectedBlockId === blockId ? null : prev.selectedBlockId
    }))
  }

  const selectBlock = (blockId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedBlockId: (
        prev.selectedBlockId === blockId 
          ? null 
          : blockId
      )
    }))
  }

  const selectedBlock = state.blocks.find(block => block.id === state.selectedBlockId)

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* TOP TOOLBAR */}
      <Toolbar 
        isPreviewMode={state.isPreviewMode}
        onTogglePreview={() => setState(prev => ({ 
          ...prev, 
          isPreviewMode: !prev.isPreviewMode 
        }))}
        onSave={() => clientLogger.debug('Save:', state.blocks)}
        blocksCount={state.blocks.length}
      />

      <div className="flex-1 flex">
        {/* LEFT PANEL - BLOCKS */}
        <BlocksPanel onAddBlock={addBlock} />

        {/* CENTER - CANVAS */}
        <Canvas
          blocks={state.blocks}
          selectedBlockId={state.selectedBlockId}
          isPreviewMode={state.isPreviewMode}
          onBlockSelect={selectBlock}
          onBlockUpdate={updateBlock}
          onBlockDelete={deleteBlock}
        />

        {/* RIGHT PANEL - PROPERTIES */}
        {selectedBlock && !state.isPreviewMode && (
          <PropertiesPanel
            block={selectedBlock}
            onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
          />
        )}
      </div>
    </div>
  )
}

// ========== DEFAULT PROPS ==========
function getDefaultProps(type: Block['type']): Record<string, any> {
  switch (type) {
    case 'container':
      return {
        backgroundColor: '#ffffff',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }
    case 'text':
      return {
        content: 'Ваш текст',
        fontSize: '16px',
        color: '#333333',
        fontWeight: 'normal',
        textAlign: 'left'
      }
    case 'image':
      return {
        src: '/placeholder.jpg',
        alt: 'Изображение',
        borderRadius: '8px',
        objectFit: 'cover'
      }
    case 'product-catalog':
      return {
        categoryId: '',
        showFilters: true,
        columns: 3,
        showPrices: true,
        displayMode: 'grid'
      }
    case 'product-detail':
      return {
        productId: '',
        showPhotos: true,
        showSpecifications: true,
        showPrice: true
      }
    case 'cart':
      return {
        showHeaders: true,
        showQuantity: true,
        showTotal: true,
        checkoutButton: true
      }
    case 'spacer':
      return {
        height: '20px',
        backgroundColor: 'transparent'
      }
    default:
      return {}
  }
}
