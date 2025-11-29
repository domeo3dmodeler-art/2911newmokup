'use client';

import React, { useState } from 'react';
import { 
  Square, Type, Image, Play, MousePointer, Search, FileText, 
  CheckSquare, CircleDot, Menu, ChevronRight, ChevronDown,
  CreditCard, Table, BarChart3, Map, Minus, Space, Eye, Users, 
  TestTube, Quote, Star, MessageCircle, Mail,
  ShoppingCart, Package, StarIcon, Heart, Wrench, Zap,
  Settings, Filter, GitCompare, ShoppingBag, Bell,
  TrendingUp, CheckSquare as CheckSquareIcon, FolderOpen
} from 'lucide-react';
import { ElementType } from '../ProfessionalPageBuilder';

interface ComponentLibraryProps {
  onAddElement: (element: ElementType) => void
}

interface ComponentGroup {
  id: string
  name: string
  icon: React.ElementType
  components: ComponentItem[]
}

interface ComponentItem {
  type: ElementType
  name: string
  icon: React.ElementType
  description: string
}

const COMPONENT_GROUPS: ComponentGroup[] = [
  {
    id: 'layout',
    name: 'Layout',
    icon: Square,
    components: [
      { type: 'container', name: 'Container', icon: Square, description: 'Flexible container' },
      { type: 'spacer', name: 'Spacer', icon: Space, description: 'Empty space' },
      { type: 'divider', name: 'Divider', icon: Minus, description: 'Visual separator' }
    ]
  },
  {
    id: 'content',
    name: 'Content',
    icon: Type,
    components: [
      { type: 'text', name: 'Text', icon: Type, description: 'Text element' },
      { type: 'heading', name: 'Heading', icon: Type, description: 'Large heading text' },
      { type: 'image', name: 'Image', icon: Image, description: 'Image element' },
      { type: 'video', name: 'Video', icon: Play, description: 'Video player' },
      { type: 'icon', name: 'Icon', icon: Eye, description: 'Icon element' }
    ]
  },
  {
    id: 'forms',
    name: 'Forms',
    icon: MousePointer,
    components: [
      { type: 'button', name: 'Button', icon: MousePointer, description: 'Clickable button' },
      { type: 'input', name: 'Input', icon: Search, description: 'Text input field' },
      { type: 'textarea', name: 'Textarea', icon: FileText, description: 'Multi-line text input' },
      { type: 'select', name: 'Select', icon: ChevronRight, description: 'Dropdown selection' },
      { type: 'checkbox', name: 'Checkbox', icon: CheckSquareIcon, description: 'Checkbox input' },
      { type: 'radio', name: 'Radio', icon: CircleDot, description: 'Radio buttons' },
      { type: 'switch',       name: 'Switch', icon: Settings, description: 'Toggle switch' },
      { type: 'slider', name: 'Slider', icon: Settings, description: 'Range slider' }
    ]
  },
  {
    id: 'navigation',
    name: 'Navigation',
    icon: Menu,
    components: [
      { type: 'nav', name: 'Navigation', icon: Menu, description: 'Main navigation' },
      { type: 'breadcrumb', name: 'Breadcrumb', icon: ChevronRight, description: 'Breadcrumb navigation' },
      { type: 'tabs', name: 'Tabs', icon: FileText, description: 'Tabbed interface' },
      { type: 'accordion', name: 'Accordion', icon: ChevronRight, description: 'Collapsible content' },
      { type: 'dropdown', name: 'Dropdown', icon: ChevronRight, description: 'Dropdown menu' }
    ]
  },
  {
    id: 'feedback',
    name: 'Feedback',
    icon: MessageCircle,
    components: [
      { type: 'modal', name: 'Modal', icon: Eye, description: 'Modal dialog' },
      { type: 'tooltip', name: 'Tooltip', icon: MessageCircle, description: 'Tooltip overlays' },
      { type: 'alert', name: 'Alert', icon: Bell, description: 'Alert messages' },
      { type: 'notification', name: 'Notification', icon: Bell, description: 'Toast notifications' }
    ]
  },
  {
    id: 'data',
    name: 'Data Display',
    icon: Table,
    components: [
      { type: 'card', name: 'Card', icon: CreditCard, description: 'Content card' },
      { type: 'table', name: 'Table', icon: Table, description: 'Data table' },
      { type: 'list', name: 'List', icon: FileText, description: 'Item list' },
      { type: 'chart', name: 'Chart', icon: BarChart3, description: 'Data visualization' },
      { type: 'statistic', name: 'Statistic', icon: TrendingUp, description: 'Number display' },
      { type: 'progress', name: 'Progress', icon: Settings, description: ' прогресс-бар' }
    ]
  },
  {
    id: 'layout-blocks',
    name: 'Layout Blocks',
    icon: Square,
    components: [
      { type: 'hero', name: 'Hero', icon: Eye, description: 'Hero section' },
      { type: 'feature', name: 'Feature', icon: Star, description: 'Feature highlight' },
      { type: 'testimonial', name: 'Testimonial', icon: Quote, description: 'Customer testimonial' },
      { type: 'pricing', name: 'Pricing', icon: CreditCard, description: 'Pricing cards' },
      { type: 'faq', name: 'FAQ', icon: MessageCircle, description: 'Frequently asked questions' },
      { type: 'contact', name: 'Contact', icon: Mail, description: 'Contact form' },
      { type: 'newsletter', name: 'Newsletter', icon: Mail, description: 'Newsletter signup' }
    ]
  },
  {
    id: 'products',
    name: 'Products',
    icon: Package,
    components: [
      { type: 'product-grid', name: 'Product Grid', icon: Package, description: 'Product catalog grid' },
      { type: 'product-card', name: 'Product Card', icon: CreditCard, description: 'Single product card' },
      { type: 'product-filters', name: 'Product Filters', icon: Filter, description: 'Product filtering' },
      { type: 'product-comparison', name: 'Product Comparison', icon: GitCompare, description: 'Compare products' },
      { type: 'product-detail', name: 'Product Detail', icon: Eye, description: 'Product details page' },
      { type: 'product-gallery', name: 'Product Gallery', icon: Image, description: 'Product image gallery' },
      { type: 'product-reviews', name: 'Product Reviews', icon: StarIcon, description: 'Product reviews' },
      { type: 'product-recommendations', name: 'Recommendations', icon: Heart, description: 'Suggested products' }
    ]
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    icon: ShoppingCart,
    components: [
      { type: 'shopping-cart', name: 'Shopping Cart', icon: ShoppingCart, description: 'Cart functionality' },
      { type: 'checkout-form', name: 'Checkout', icon: CreditCard, description: 'Checkout form' },
      { type: 'wishlist', name: 'Wishlist', icon: Heart, description: 'Wishlist functionality' },
      { type: 'recommendation-engine', name: 'Recommend Engine', icon: TrendingUp, description: 'Product recommendations' }
    ]
  }
]

export default function ComponentLibrary({ onAddElement }: ComponentLibraryProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['layout', 'content', 'products']))
  const [searchTerm, setSearchTerm] = useState('')

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const filteredGroups = COMPONENT_GROUPS.map(group => ({
    ...group,
    components: group.components.filter(component =>
      component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.components.length > 0)

  const handleAddElement = (elementType: ElementType) => {
    onAddElement(elementType)
  }

  return (
    <div className="h-full overflow-hidden">
      
      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search components..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Component Groups */}
      <div className="overflow-y-auto h-full">
        {filteredGroups.map(group => (
          <div key={group.id} className="border-b border-gray-100">
            
            {/* Group Header */}
            <div
              onClick={() => toggleGroup(group.id)}
              className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <group.icon className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-sm text-gray-700">{group.name}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {group.components.length}
                </span>
              </div>
              {expandedGroups.has(group.id) ? 
                <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                <ChevronRight className="w-4 h-4 text-gray-500" />
              }
            </div>

            {/* Group Components */}
            {expandedGroups.has(group.id) && (
              <div className="space-y-1 pb-2">
                {group.components.map(component => (
                  <div
                    key={component.type}
                    onClick={() => handleAddElement(component.type)}
                    className="flex items-center space-x-3 px-3 py-2 mx-2 rounded-md hover:bg-blue-50 cursor-pointer transition-colors group"
                    title={component.description}
                  >
                    <component.icon className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                        {component.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {component.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 mb-2">Quick Actions</div>
        <div className="space-y-1">
          <button className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-white rounded">
            Import from Design Tools
          </button>
          <button className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-white rounded">
            Save as Template
          </button>
          <button className="w-full text-left px-2 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-white rounded">
            Export Code
          </button>
        </div>
      </div>
    </div>
  )
}
