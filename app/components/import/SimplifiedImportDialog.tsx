'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/Badge';
import { Upload, FileText, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { clientLogger } from '@/lib/logging/client-logger';

interface SimplifiedImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogCategories: Array<{
    id: string;
    name: string;
    level: number;
    parent_id?: string;
  }>;
  onImportComplete?: (result: ImportResult) => void;
}

interface ImportResult {
  success: boolean;
  message: string;
  data: {
    filename: string;
    category: string;
    headers: string[];
    total_rows: number;
    processed_rows: number;
    saved_rows: number;
    errors: string[];
    products_preview: Array<{
      id: string;
      sku: string;
      name: string;
      base_price: number;
    }>;
  };
}

export default function SimplifiedImportDialog({
  open,
  onOpenChange,
  catalogCategories,
  onImportComplete
}: SimplifiedImportDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>('');

  const handleFileSelect = (file: File) => {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setError('');
      setImportResult(null);
    } else {
      setError('Поддерживаются только файлы Excel (.xlsx, .xls) и CSV (.csv)');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleImport = async () => {
    if (!selectedFile || !selectedCategory) {
      setError('Выберите файл и категорию');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setError('');
    setImportResult(null);

    try {
      // Симулируем прогресс импорта
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', selectedCategory);

      const response = await fetch('/api/admin/import/simplified', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      const result = await response.json();

      if (response.ok && result.success) {
        setImportResult(result);
        if (onImportComplete) {
          onImportComplete(result);
        }
      } else {
        setError(result.error || 'Ошибка при импорте файла');
      }
    } catch (error) {
      clientLogger.error('Import error:', error);
      setError('Ошибка при импорте файла');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setSelectedFile(null);
      setSelectedCategory('');
      setImportResult(null);
      setError('');
      setImportProgress(0);
      onOpenChange(false);
    }
  };

  const getCategoryDisplayName = (category: any) => {
    const indent = '  '.repeat(category.level);
    return `${indent}${category.name}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Упрощенный импорт товаров
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Информация об упрощенном импорте */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Упрощенная система импорта</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Заголовки Excel = Поля шаблона (прямое соответствие). 
                  Нет промежуточного маппинга - просто загрузите файл и выберите категорию.
                </p>
              </div>
            </div>
          </div>

          {/* Выбор категории */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Категория товаров *
            </label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {catalogCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {getCategoryDisplayName(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Загрузка файла */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Файл для импорта *
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : selectedFile
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 text-green-600 mx-auto" />
                  <p className="text-sm font-medium text-green-900">{selectedFile.name}</p>
                  <p className="text-xs text-green-700">
                    Размер: {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">
                    Перетащите файл сюда или нажмите для выбора
                  </p>
                  <p className="text-xs text-gray-500">
                    Поддерживаются: .xlsx, .xls, .csv
                  </p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="mt-2 block text-center"
            >
              <Button variant="outline" size="sm" asChild>
                <span>Выбрать файл</span>
              </Button>
            </label>
          </div>

          {/* Ошибки */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900">Ошибка</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Прогресс импорта */}
          {isImporting && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Импорт в процессе...</span>
              </div>
              <Progress value={importProgress} className="w-full" />
              <p className="text-xs text-gray-500 text-center">
                {importProgress < 50 && 'Анализ файла...'}
                {importProgress >= 50 && importProgress < 80 && 'Обработка данных...'}
                {importProgress >= 80 && 'Сохранение в базу данных...'}
              </p>
            </div>
          )}

          {/* Результаты импорта */}
          {importResult && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-green-900">Импорт завершен успешно!</h3>
                    <div className="mt-2 space-y-1 text-sm text-green-700">
                      <p><strong>Файл:</strong> {importResult.data.filename}</p>
                      <p><strong>Категория:</strong> {importResult.data.category}</p>
                      <p><strong>Обработано строк:</strong> {importResult.data.processed_rows} из {importResult.data.total_rows}</p>
                      <p><strong>Сохранено товаров:</strong> {importResult.data.saved_rows}</p>
                      <p><strong>Заголовков:</strong> {importResult.data.headers.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Предупреждения */}
              {importResult.data.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-900">Предупреждения</h3>
                      <div className="mt-2 space-y-1">
                        {importResult.data.errors.slice(0, 5).map((error, index) => (
                          <p key={index} className="text-sm text-yellow-700">{error}</p>
                        ))}
                        {importResult.data.errors.length > 5 && (
                          <p className="text-sm text-yellow-700">
                            ... и еще {importResult.data.errors.length - 5} предупреждений
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Предпросмотр товаров */}
              {importResult.data.products_preview.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Предпросмотр импортированных товаров:</h4>
                  <div className="space-y-2">
                    {importResult.data.products_preview.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                        </div>
                        <Badge variant="secondary">
                          {product.base_price.toLocaleString('ru-RU')} ₽
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Заголовки файла */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Заголовки файла (поля шаблона):</h4>
                <div className="flex flex-wrap gap-2">
                  {importResult.data.headers.map((header, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {header}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            {importResult ? 'Закрыть' : 'Отмена'}
          </Button>
          {!importResult && (
            <Button 
              onClick={handleImport} 
              disabled={!selectedFile || !selectedCategory || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Импорт...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Импортировать
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
