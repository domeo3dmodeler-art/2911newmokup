'use client';

import React from 'react';
import { ToolbarProps } from '../types';
import { PageSizeSelector } from '../elements/PageSizeSelector';

export function Toolbar({
  zoom,
  viewMode,
  pageWidth,
  pageHeight,
  onZoomChange,
  onViewModeChange,
  onPageSizeChange,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  showComponentsPanel,
  showPropertiesPanel,
  showPagesPanel,
  showCatalogPanel,
  showSavePanel,
  onToggleComponentsPanel,
  onTogglePropertiesPanel,
  onTogglePagesPanel,
  onToggleCatalogPanel,
  onToggleSavePanel,
  onShowTemplates,
  onCreateTestConnection,
  onTestDataTransfer
}: ToolbarProps) {
  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Logo/Title */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="font-semibold text-gray-900">Domeo Builder</span>
        </div>
        
        {/* Templates Button */}
        <button
          onClick={onShowTemplates}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          title="Выбрать шаблон"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <span>Шаблоны</span>
        </button>

        {/* Page Size Selector */}
        <PageSizeSelector
          currentWidth={pageWidth}
          currentHeight={pageHeight}
          onSizeChange={onPageSizeChange}
        />

        {/* Preview Button */}
        <button
          onClick={() => {
            // Сохраняем текущую страницу в localStorage для предпросмотра
            const currentPageData = {
              id: 'preview-page',
              name: 'Предпросмотр',
              slug: 'preview',
              elements: [], // Будет заполнено из текущего документа
              settings: {
                width: pageWidth,
                height: pageHeight,
                backgroundColor: '#ffffff'
              },
              connections: []
            };
            
            // Сохраняем данные для предпросмотра
            localStorage.setItem('current-page-preview', JSON.stringify(currentPageData));
            
            // Открываем предварительный просмотр в новом окне
            const previewUrl = window.location.origin + '/preview';
            window.open(previewUrl, '_blank');
          }}
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          title="Предварительный просмотр"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span>Просмотр</span>
        </button>

        {/* Undo/Redo */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Отменить (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Повторить (Ctrl+Y)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-gray-300" />

        {/* View Mode */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onViewModeChange('edit')}
            className={`px-3 py-1.5 text-sm rounded ${
              viewMode === 'edit'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Редактировать
          </button>
          <button
            onClick={() => onViewModeChange('preview')}
            className={`px-3 py-1.5 text-sm rounded ${
              viewMode === 'preview'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Предпросмотр
          </button>
        </div>
      </div>

      {/* Center Section - Zoom Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onZoomChange(Math.max(25, zoom - 25))}
          className="p-1.5 rounded hover:bg-gray-100"
          title="Уменьшить масштаб"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>
        
        <select
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={25}>25%</option>
          <option value={50}>50%</option>
          <option value={75}>75%</option>
          <option value={100}>100%</option>
          <option value={125}>125%</option>
          <option value={150}>150%</option>
          <option value={200}>200%</option>
        </select>
        
        <button
          onClick={() => onZoomChange(Math.min(200, zoom + 25))}
          className="p-1.5 rounded hover:bg-gray-100"
          title="Увеличить масштаб"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>

        <button
          onClick={() => onZoomChange(100)}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
          title="Сбросить масштаб"
        >
          По размеру
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* Panel Toggles */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onTogglePagesPanel}
            className={`p-1.5 rounded ${
              showPagesPanel
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Панель страниц"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
          <button
            onClick={onToggleCatalogPanel}
            className={`p-1.5 rounded ${
              showCatalogPanel
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Каталог товаров"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
          <button
            onClick={onToggleSavePanel}
            className={`p-1.5 rounded ${
              showSavePanel
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Сохранение и публикация"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </button>
          <button
            onClick={onToggleComponentsPanel}
            className={`p-1.5 rounded ${
              showComponentsPanel
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Панель компонентов"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
          <button
            onClick={onTogglePropertiesPanel}
            className={`p-1.5 rounded ${
              showPropertiesPanel
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Панель свойств"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-gray-300" />

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onSave}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Сохранить
          </button>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
