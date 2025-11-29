'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Badge, Input } from '../../../../components/ui';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertTriangle, History, RefreshCw, TreePine } from 'lucide-react';
import { clientLogger } from '@/lib/logging/client-logger';

interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
  warnings: string[];
  categories?: Array<{
    name: string;
    level: number;
    path: string;
    parent?: string;
    fullPath: string;
  }>;
}

interface ImportHistory {
  id: string;
  filename: string;
  imported_count: number;
  error_count: number;
  status: string;
  created_at: string;
}

export default function CatalogTreeImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadImportHistory();
  }, []);

  const loadImportHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch('/api/catalog/import?action=history');
      const data = await response.json();
      setImportHistory(data || []);
    } catch (error) {
      clientLogger.error('Error loading import history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const downloadTemplate = () => {
    // Создаем шаблон Excel с примером структуры дерева каталогов
    const templateData = [
      ['Категория 1', '', '', ''],
      ['', 'Подкатегория 1.1', '', ''],
      ['', 'Подкатегория 1.2', '', ''],
      ['', '', 'Подподкатегория 1.2.1', ''],
      ['Категория 2', '', '', ''],
      ['', 'Подкатегория 2.1', '', '']
    ];

    // Конвертируем в CSV
    const csvContent = templateData.map(row => row.join(',')).join('\n');
    
    // Создаем и скачиваем файл
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template-catalog-tree.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls') || selectedFile.name.endsWith('.csv'))) {
      setFile(selectedFile);
      setImportResult(null);
    } else {
      alert('Пожалуйста, выберите файл Excel (.xlsx, .xls) или CSV (.csv)');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('Выберите файл');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/catalog/import', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setImportResult(result);
      
      if (result.success) {
        await loadImportHistory();
        setFile(null);
      }
    } catch (error) {
      clientLogger.error('Error importing catalog tree:', error);
      setImportResult({
        success: false,
        message: 'Ошибка при импорте дерева каталогов',
        imported: 0,
        errors: ['Произошла ошибка сети'],
        warnings: []
      });
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Успешно</Badge>;
      case 'partial':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Частично</Badge>;
      case 'error':
        return <Badge variant="error">Ошибка</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Инструкции */}
      <Card className="p-4">
        <div className="flex items-center space-x-3 mb-4">
          <TreePine className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-semibold">Как подготовить файл</h2>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Каждая строка = одна категория</li>
            <li>• Каждый столбец = уровень вложенности</li>
            <li>• Пустые ячейки в начале строки = подкатегория</li>
            <li>• Поддерживаются форматы: .xlsx, .xls, .csv</li>
          </ul>
          <div className="mt-3">
            <h4 className="font-medium text-blue-900 mb-1">Пример структуры:</h4>
            <div className="bg-white p-2 rounded text-xs font-mono">
              <div>Категория 1,,,</div>
              <div>,Подкатегория 1.1,,</div>
              <div>,Подкатегория 1.2,,</div>
              <div>,,Подподкатегория 1.2.1,</div>
              <div>Категория 2,,,</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Загрузка файла */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Загрузка файла</h3>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="flex items-center space-x-1"
          >
            <Download className="h-4 w-4" />
            <span>Скачать шаблон</span>
          </Button>
        </div>

        {/* Drag & Drop область */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Перетащите файл с деревом каталогов сюда или нажмите для выбора
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Поддерживаются форматы: .xlsx, .xls, .csv
          </p>
          
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            <Upload className="h-4 w-4 mr-2" />
            Выбрать файл
          </label>
        </div>

        {/* Выбранный файл */}
        {file && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleImport}
                  disabled={uploading}
                  className="flex items-center space-x-1"
                >
                  {uploading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>{uploading ? 'Импорт...' : 'Импортировать дерево'}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFile(null)}
                  disabled={uploading}
                >
                  Отменить
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Результат импорта */}
      {importResult && (
        <Card className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            {importResult.success ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <h3 className="text-lg font-semibold">
              {importResult.success ? 'Импорт завершен' : 'Ошибка импорта'}
            </h3>
          </div>
          
          <p className="text-gray-700 mb-4">{importResult.message}</p>
          
          {importResult.imported > 0 && (
            <div className="mb-4">
              <Badge variant="default" className="bg-green-100 text-green-800">
                Импортировано: {importResult.imported} категорий
              </Badge>
            </div>
          )}

          {importResult.categories && importResult.categories.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Созданные категории:</h4>
              <div className="bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                {importResult.categories.map((category, index) => (
                  <div key={index} className="text-sm text-gray-700 mb-1">
                    {'  '.repeat(category.level - 1)}• {category.name}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {importResult.warnings.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-yellow-700 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Предупреждения ({importResult.warnings.length})
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {importResult.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          {importResult.errors.length > 0 && (
            <div>
              <h4 className="font-medium text-red-700 mb-2 flex items-center">
                <XCircle className="h-4 w-4 mr-1" />
                Ошибки ({importResult.errors.length})
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {importResult.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* История импорта */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">История импорта дерева каталогов</h3>
          <Button
            variant="outline"
            onClick={loadImportHistory}
            disabled={loadingHistory}
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`h-4 w-4 ${loadingHistory ? 'animate-spin' : ''}`} />
            <span>Обновить</span>
          </Button>
        </div>

        {importHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-8">История импорта пуста</p>
        ) : (
          <div className="space-y-3">
            {importHistory.map(record => (
              <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="font-medium">{record.filename}</span>
                    {getStatusBadge(record.status)}
                  </div>
                  <div className="text-sm text-gray-600 space-x-4">
                    <span>Импортировано: {record.imported_count} категорий</span>
                    {record.error_count > 0 && (
                      <span className="text-red-600">Ошибок: {record.error_count}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(record.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}



