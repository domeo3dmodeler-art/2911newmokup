'use client';

import React from 'react';
import { 
  Save, Download, Undo, Redo, Copy, Paste, Trash2, Eye, EyeOff,
  Smartphone, Tablet, Monitor, Play, Settings, Share, FolderOpen, Folder,
  ZoomIn, ZoomOut, Maximize2, Layout, Layers, Hash
} from 'lucide-react';
import { DocumentData, Page } from '../ProfessionalPageBuilder';
import { Project } from '../projects/ProjectManager';

interface ToolbarProps {
  document: DocumentData
  selectedPage: Page
  zoom: number
  viewMode: 'design' | 'prototype' | 'inspect' | 'present'
  onZoomChange: (zoom: number) => void
  onViewModeChange: (mode: 'design' | 'prototype' | 'inspect' | 'present') => void
  onSave: () => void
  onExport?: (type: 'html' | 'react' | 'png' | 'svg') => void
  readOnly?: boolean
  onOpenProjectManager?: () => void
  onOpenSaveDialog?: () => void
  currentProject?: Project | null
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
}

export default function Toolbar({
  document,
  selectedPage,
  zoom,
  viewMode,
  onZoomChange,
  onViewModeChange,
  onSave,
  onExport,
  readOnly = false,
  onOpenProjectManager,
  onOpenSaveDialog,
  currentProject,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false
}: ToolbarProps) {
  
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
      
      {/* Left Side - Document Info */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <FolderOpen className="w-5 h-5 text-blue-600" />
          <div>
            <div className="text-sm font-medium text-gray-900">
              {currentProject ? currentProject.name : document.name}
            </div>
            <div className="text-xs text-gray-500">{selectedPage.name}</div>
          </div>
        </div>
        
        {/* Project Actions */}
        <div className="flex items-center space-x-2">
          {onOpenProjectManager && (
            <button
              onClick={onOpenProjectManager}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Мои проекты"
            >
              <Folder className="w-4 h-4 text-gray-600" />
            </button>
          )}
          
          {/* Undo/Redo Controls */}
          {!readOnly && onUndo && onRedo && (
            <>
              <button 
                onClick={onUndo}
                disabled={!canUndo}
                className={`p-2 rounded-md transition-colors ${
                  canUndo 
                    ? 'hover:bg-gray-100 text-gray-600' 
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                title="Отменить (Ctrl+Z)"
              >
                <Undo className="w-4 h-4" />
              </button>
              <button 
                onClick={onRedo}
                disabled={!canRedo}
                className={`p-2 rounded-md transition-colors ${
                  canRedo 
                    ? 'hover:bg-gray-100 text-gray-600' 
                    : 'text-gray-300 cursor-not-allowed'
                }`}
                title="Повторить (Ctrl+Shift+Z)"
              >
                <Redo className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-300 mx-1" />
            </>
          )}
          
          {onOpenSaveDialog && (
            <button
              onClick={onOpenSaveDialog}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title={currentProject ? 'Сохранить изменения' : 'Сохранить проект'}
            >
              <Save className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Center - Main Tools */}
      <div className="flex items-center space-x-2">
        
        {/* Zoom Controls */}
        <div className="flex items-center bg-gray-100 rounded-lg">
          <button 
            onClick={() => onZoomChange(zoom * 0.8)}
            className="p-2 hover:bg-gray-200 rounded-l-lg"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="px-3 py-2 text-sm font-medium min-w-[80px] text-center">
            {Math.round(zoom * 100)}%
          </div>
          <button 
            onClick={() => onZoomChange(zoom * 1.25)}
            className="p-2 hover:bg-gray-200 rounded-r-lg"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Device Preview */}
        <div className="flex items-center bg-gray-100 rounded-lg ml-4">
          <button className="flex items-center space-x-1 px-3 py-2 hover:bg-gray-200 rounded-l-lg">
            <Monitor className="w-4 h-4" />
            <span className="text-sm">Desktop</span>
          </button>
          <button className="flex items-center space-x-1 px-3 py-2 hover:bg-gray-200">
            <Tablet className="w-4 h-4" />
            <span className="text-sm">Tablet</span>
          </button>
          <button className="flex items-center space-x-1 px-3 py-2 hover:bg-gray-200 rounded-r-lg">
            <Smartphone className="w-4 h-4" />
            <span className="text-sm">Mobile</span>
          </button>
        </div>

        {/* View Mode */}
        <div className="flex items-center bg-gray-100 rounded-lg ml-4">
          <button 
            onClick={() => onViewModeChange('design')}
            className={`p-2 rounded-l-lg ${viewMode === 'design' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
            title="Design Mode"
          >
            <Layout className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onViewModeChange('prototype')}
            className={`p-2 ${viewMode === 'prototype' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
            title="Prototype Mode"
          >
            <Play className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onViewModeChange('inspect')}
            className={`p-2 ${viewMode === 'inspect' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
            title="Inspect Mode"
          >
            <Hash className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onViewModeChange('present')}
            className={`p-2 rounded-r-lg ${viewMode === 'present' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
            title="Present Mode"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center space-x-2">
        
        {/* Undo/Redo */}
        <div className="flex items-center bg-gray-100 rounded-lg">
          <button className="p-2 rounded-l-lg hover:bg-gray-200" title="Undo">
            <Undo className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-r-lg hover:bg-gray-200" title="Redo">
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Save/Export */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={onSave}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
          
          <div className="relative group">
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            
            {/* Export Dropdown */}
            <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <div className="py-1">
                <button 
                  onClick={() => onExport?.('html')}
                  className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                >
                  Export HTML
                </button>
                <button 
                  onClick={() => onExport?.('react')}
                  className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                >
                  Export React
                </button>
                <button 
                  className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                >
                  Export PNG
                </button>
                <button 
                  className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
                >
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <button className="p-2 text-gray-500 hover:text-gray-700" title="Settings">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
