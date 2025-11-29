'use client';

import React from 'react';
import { Layout, Layers, FileText, ChevronDown, ChevronRight, Calculator, Package, Database } from 'lucide-react';

interface SidebarProps {
  leftPanels: {
    library: boolean
    calculator: boolean
    products: boolean
    catalog: boolean
    layers: boolean
    pages: boolean
  }
  onTogglePanel: (panels: any) => void
  onAddElement: (element: any) => void
  elements: any[]
  selectedElementId: string | null
  onSelectElement: (elementId: string) => void
  children: React.ReactNode
}

export default function Sidebar({
  leftPanels,
  onTogglePanel,
  onAddElement,
  elements,
  selectedElementId,
  onSelectElement,
  children
}: SidebarProps) {
  
  const PanelHeader = ({ 
    icon: Icon, 
    title, 
    active, 
    onClick 
  }: { 
    icon: any
    title: string
    active: boolean
    onClick: () => void 
  }) => (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-4 py-3 bg-white border-b cursor-pointer hover:bg-gray-50 transition-colors ${
        active ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-gray-700'
      }`}
    >
      <div className="flex items-center space-x-2">
        <Icon className="w-4 h-4" />
        <span className="font-medium text-sm">{title}</span>
      </div>
      {active ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
    </div>
  )

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      
      {/* Library Panel */}
      <PanelHeader
        icon={Layout}
        title="Компоненты"
        active={leftPanels.library}
        onClick={() => onTogglePanel({ ...leftPanels, library: !leftPanels.library })}
      />
      
      {/* Calculator Panel */}
      <PanelHeader
        icon={Calculator}
        title="Калькуляторы"
        active={leftPanels.calculator}
        onClick={() => onTogglePanel({ ...leftPanels, calculator: !leftPanels.calculator })}
      />
      
      {/* Products Panel */}
      <PanelHeader
        icon={Package}
        title="Товары"
        active={leftPanels.products}
        onClick={() => onTogglePanel({ ...leftPanels, products: !leftPanels.products })}
      />
      
      {/* Catalog Panel */}
      <PanelHeader
        icon={Database}
        title="Каталог"
        active={leftPanels.catalog}
        onClick={() => onTogglePanel({ ...leftPanels, catalog: !leftPanels.catalog })}
      />
      
      {/* Layers Panel */}
      <PanelHeader
        icon={Layers}
        title="Слои"
        active={leftPanels.layers}
        onClick={() => onTogglePanel({ ...leftPanels, layers: !leftPanels.layers })}
      />
      
      {/* Pages Panel */}
      <PanelHeader
        icon={FileText}
        title="Страницы"
        active={leftPanels.pages}
        onClick={() => onTogglePanel({ ...leftPanels, pages: !leftPanels.pages })}
      />
      
      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
