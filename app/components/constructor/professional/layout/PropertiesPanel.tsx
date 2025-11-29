'use client';

import React, { useState } from 'react';
import { ChevronDown, Plus, Minus } from 'lucide-react';
import { DeleteButton } from './DeleteButton';
import { BaseElement, Page } from '../ProfessionalPageBuilder';
import { CalculatorPropertiesPanel } from './CalculatorPropertiesPanel';
import { ProductPropertiesPanel } from './ProductPropertiesPanel';
import { PriceCalculatorPropertiesPanel } from './PriceCalculatorPropertiesPanel';
import { ProductFilterPropertiesPanel } from './ProductFilterPropertiesPanel';
import { DoorConfiguratorPropertiesPanel } from './DoorConfiguratorPropertiesPanel';
import { CalculatorElement } from '../elements/CalculatorElementRenderer';
import { ProductElement } from '../elements/ProductElementRenderer';
import { PriceCalculatorElement } from '../elements/PriceCalculatorRenderer';
import { ProductFilterElement } from '../elements/ProductFilterRenderer';
import { DoorConfiguratorElement } from '../elements/DoorConfiguratorRenderer';

interface PropertiesPanelProps {
  selectedElement: BaseElement | null
  selectedPage: Page
  onUpdateElement: (elementId: string, updates: Partial<BaseElement>) => void
  onUpdatePage: (updates: Partial<Page>) => void
  onDeleteElement: (elementId: string) => void
}

interface PropertySection {
  id: string
  title: string
  expanded: boolean
  children: React.ReactNode
}

export default function PropertiesPanel({
  selectedElement,
  selectedPage,
  onUpdateElement,
  onUpdatePage,
  onDeleteElement
}: PropertiesPanelProps) {
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['design', 'size'])
  )

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const PropertySection = ({ section }: { section: PropertySection }) => (
    <div className="border-b border-gray-100">
      <button
        onClick={() => toggleSection(section.id)}
        className="flex items-center justify-between w-full p-3 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-sm text-gray-900">{section.title}</span>
        {expandedSections.has(section.id) ? 
          <ChevronDown className="w-4 h-4 text-gray-500" /> : 
          <Plus className="w-4 h-4 text-gray-500" />
        }
      </button>
      
      {expandedSections.has(section.id) && (
        <div className="p-3 bg-gray-50">
          {section.children}
        </div>
      )}
    </div>
  )

  // ===================== DESIGN SECTION =====================
  
  const DesignSection = () => (
    <div className="space-y-4">
      
      {/* Position */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Position</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={selectedElement?.position?.x || selectedElement?.style?.left || 0}
            onChange={(e) => selectedElement && onUpdateElement(selectedElement.id, { 
              style: { 
                ...selectedElement?.style, 
                left: Number(e.target.value) 
              } 
            })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            placeholder="X"
          />
          <input
            type="number"
            value={selectedElement?.position?.y || selectedElement?.style?.top || 0}
            onChange={(e) => selectedElement && onUpdateElement(selectedElement.id, { 
              style: { 
                ...selectedElement?.style, 
                top: Number(e.target.value) 
              } 
            })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            placeholder="Y"
          />
        </div>
      </div>

      {/* Opacity */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Opacity: {selectedElement?.style.opacity || 1}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={selectedElement?.style.opacity || 1}
          onChange={(e) => selectedElement && onUpdateElement(selectedElement.id, { 
            style: { 
              ...selectedElement?.style, 
              opacity: Number(e.target.value) 
            } 
          })}
          className="w-full"
        />
      </div>

      {/* Background */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Background</label>
        {selectedElement?.type === 'container' && (
          <input
            type="color"
            value={(selectedElement as any).background?.color || '#ffffff'}
            onChange={(e) => {
              selectedElement && onUpdateElement(selectedElement.id, {
                background: {
                  ...(selectedElement as any).background,
                  color: e.target.value
                }
              })
            }}
            className="w-full h-8 border border-gray-300 rounded"
          />
        )}
      </div>

      {/* Border */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Border</label>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={selectedElement?.style?.border?.width || 0}
              onChange={(e) => selectedElement && onUpdateElement(selectedElement.id, { 
                style: { 
                  ...selectedElement?.style, 
                  border: { 
                    ...selectedElement?.style?.border, 
                    width: Number(e.target.value) 
                  } 
                } 
              })}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="Width"
            />
            <input
              type="color"
              value={selectedElement?.style?.border?.color || '#000000'}
              onChange={(e) => selectedElement && onUpdateElement(selectedElement.id, { 
                style: { 
                  ...selectedElement?.style, 
                  border: { 
                    ...selectedElement?.style?.border, 
                    color: e.target.value 
                  } 
                } 
              })}
              className="w-full h-8 border border-gray-300 rounded"
            />
          </div>
          <input
            type="text"
            value={selectedElement?.style?.border?.radius?.topLeft || 0}
            onChange={(e) => {
              const radius = Number(e.target.value)
              selectedElement && onUpdateElement(selectedElement.id, { 
                style: { 
                  ...selectedElement?.style, 
                  border: { 
                    ...selectedElement?.style?.border, 
                    radius: { 
                      topLeft: radius,
                      topRight: radius,
                      bottomLeft: radius,
                      bottomRight: radius
                    } 
                  } 
                } 
              })
            }}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            placeholder="Border Radius"
          />
        </div>
      </div>
    </div>
  )

  // ===================== SIZE SECTION =====================
  
  const SizeSection = () => (
    <div className="space-y-4">
      
      {/* Dimensions */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Dimensions</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={selectedElement?.size?.width || selectedElement?.style?.width || 0}
            onChange={(e) => selectedElement && onUpdateElement(selectedElement.id, { 
              style: { 
                ...selectedElement?.style, 
                width: Number(e.target.value) 
              } 
            })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            placeholder="Width"
          />
          <input
            type="number"
            value={selectedElement?.size?.height || selectedElement?.style?.height || 0}
            onChange={(e) => selectedElement && onUpdateElement(selectedElement.id, { 
              style: { 
                ...selectedElement?.style, 
                height: Number(e.target.value) 
              } 
            })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
            placeholder="Height"
          />
        </div>
      </div>

      {/* Constraints */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Constraints</label>
        <div className="space-y-2">
          <select
            value={selectedElement?.constraints?.horizontal || 'left'}
            onChange={(e) => selectedElement && onUpdateElement(selectedElement.id, { 
              constraints: { 
                ...selectedElement?.constraints, 
                horizontal: e.target.value as any 
              } 
            })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="stretch">Stretch</option>
          </select>
          
          <select
            value={selectedElement?.constraints?.vertical || 'top'}
            onChange={(e) => selectedElement && onUpdateElement(selectedElement.id, { 
              constraints: { 
                ...selectedElement?.constraints, 
                vertical: e.target.value as any 
              } 
            })}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
            <option value="stretch">Stretch</option>
          </select>
        </div>
      </div>
    </div>
  )

  // ===================== MAIN RENDER =====================
  
  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Properties</h3>
            <p className="text-xs text-gray-500">
              {selectedElement ? selectedElement.name : 'No element selected'}
            </p>
          </div>
          {selectedElement && (
            <DeleteButton 
              onDelete={() => onDeleteElement(selectedElement.id)}
              elementName={selectedElement.name || selectedElement.type}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedElement ? (
          <>
            {/* Specialized panels for calculator and product elements */}
            {(selectedElement.type === 'calculator-input' ||
              selectedElement.type === 'calculator-select' ||
              selectedElement.type === 'calculator-checkbox' ||
              selectedElement.type === 'calculator-radio' ||
              selectedElement.type === 'calculator-display' ||
              selectedElement.type === 'price-display') ? (
              <CalculatorPropertiesPanel
                selectedElement={selectedElement as CalculatorElement}
                onUpdateElement={(id, updates) => onUpdateElement(id, updates)}
              />
            ) : selectedElement.type === 'price-calculator' ? (
              <PriceCalculatorPropertiesPanel
                selectedElement={selectedElement as PriceCalculatorElement}
                onUpdateElement={(id, updates) => onUpdateElement(id, updates)}
              />
            ) : selectedElement.type === 'product-filters' ? (
              <ProductFilterPropertiesPanel
                selectedElement={selectedElement as ProductFilterElement}
                onUpdateElement={(id, updates) => onUpdateElement(id, updates)}
              />
            ) : selectedElement.type === 'door-configurator' ? (
              <DoorConfiguratorPropertiesPanel
                selectedElement={selectedElement as DoorConfiguratorElement}
                onUpdateElement={(id, updates) => onUpdateElement(id, updates)}
              />
            ) : (selectedElement.type === 'product-grid' ||
                  selectedElement.type === 'product-list' ||
                  selectedElement.type === 'product-carousel' ||
                  selectedElement.type === 'product-featured' ||
                  selectedElement.type === 'product-search' ||
                  selectedElement.type === 'product-category' ||
                  selectedElement.type === 'product-filters' ||
                  selectedElement.type === 'product-sort' ||
                  selectedElement.type === 'product-pagination' ||
                  selectedElement.type === 'product-breadcrumbs' ||
                  selectedElement.type === 'product-comparison' ||
                  selectedElement.type === 'product-recommendations' ||
                  selectedElement.type === 'product-reviews' ||
                  selectedElement.type === 'product-favorites' ||
                  selectedElement.type === 'product-recent' ||
                  selectedElement.type === 'product-cart' ||
                  selectedElement.type === 'product-wishlist' ||
                  selectedElement.type === 'delivery-calculator' ||
                  selectedElement.type === 'installation-calculator' ||
                  selectedElement.type === 'discount-calculator') ? (
              <ProductPropertiesPanel
                selectedElement={selectedElement as ProductElement}
                onUpdateElement={(id, updates) => onUpdateElement(id, updates)}
              />
            ) : (
              <>
                {/* Default properties panel for other elements */}
                <PropertySection section={{
                  id: 'design',
                  title: 'Design',
                  expanded: expandedSections.has('design'),
                  children: <DesignSection />
                }} />
                
                <PropertySection section={{
                  id: 'size',
                  title: 'Size & Position',
                  expanded: expandedSections.has('size'),
                  children: <SizeSection />
                }} />
              </>
            )}
          </>
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">
            Select an element to view properties
          </div>
        )}
      </div>
    </div>
  )
}
