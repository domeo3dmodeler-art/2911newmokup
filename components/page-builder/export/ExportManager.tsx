'use client';

import React, { useState } from 'react';
import { DocumentData, ExportOptions, ExportResult } from '../types';
import { clientLogger } from '@/lib/logging/client-logger';

interface ExportManagerProps {
  document: DocumentData;
  onExport: (options: ExportOptions) => Promise<ExportResult>;
}

export function ExportManager({ document, onExport }: ExportManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'html',
    includeCSS: true,
    includeJS: true,
    minify: false,
    optimizeImages: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportResult(null);

      const result = await onExport(exportOptions);
      setExportResult(result);

      if (result.success && result.data) {
        // Автоматическое скачивание файла
        downloadFile(result.data, result.filename || 'export', result.mimeType);
      }
    } catch (error) {
      clientLogger.error('Export error', error instanceof Error ? error : new Error(String(error)));
      setExportResult({
        success: false,
        error: 'Ошибка экспорта'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (data: string | Buffer, filename: string, mimeType?: string) => {
    if (typeof document === 'undefined') return;

    const blob = new Blob([data], { type: mimeType || 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatOptions = [
    { value: 'html', label: 'HTML', description: 'Статический HTML с CSS' },
    { value: 'pdf', label: 'PDF', description: 'PDF документ для печати' },
    { value: 'xlsx', label: 'Excel', description: 'Таблица Excel с данными' },
    { value: 'csv', label: 'CSV', description: 'CSV файл с данными' }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Экспорт проекта
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Экспорт проекта</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Document Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Информация о проекте</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Название: {document.name}</div>
              <div>Страниц: {document.pages.length}</div>
              <div>Элементов: {document.pages.reduce((total, page) => total + page.elements.length, 0)}</div>
              <div>Создан: {new Date(document.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Формат экспорта
            </label>
            <div className="grid grid-cols-2 gap-3">
              {formatOptions.map((option) => (
                <label
                  key={option.value}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    exportOptions.format === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={option.value}
                    checked={exportOptions.format === option.value}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                    className="sr-only"
                  />
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.description}</div>
                </label>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Дополнительные опции</h3>
            
            {exportOptions.format === 'html' && (
              <>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeCSS}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeCSS: e.target.checked }))}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900">Включить CSS стили</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeJS}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeJS: e.target.checked }))}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900">Включить JavaScript</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.minify}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, minify: e.target.checked }))}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-900">Минифицировать код</span>
                </label>
              </>
            )}

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.optimizeImages}
                onChange={(e) => setExportOptions(prev => ({ ...prev, optimizeImages: e.target.checked }))}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-900">Оптимизировать изображения</span>
            </label>
          </div>

          {/* Export Result */}
          {exportResult && (
            <div className={`p-4 rounded-lg ${
              exportResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {exportResult.success ? (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-700">
                    Экспорт успешно завершен! Файл загружен.
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-700">
                    {exportResult.error || 'Ошибка экспорта'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Отмена
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Экспорт...</span>
              </div>
            ) : (
              'Экспортировать'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
