'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertTriangle, History, RefreshCw, Plus } from 'lucide-react';
import { FrontendCategory, CatalogCategory } from '@/lib/types/catalog';
import { clientLogger } from '@/lib/logging/client-logger';

interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
  warnings: string[];
  products?: Array<{
    name: string;
    sku: string;
    category?: string;
  }>;
}

interface ImportHistory {
  id: string;
  filename: string;
  imported_at: string;
  total_products: number;
  success_count: number;
  error_count: number;
  status: 'success' | 'partial' | 'error';
  category_name?: string;
}

export default function ConfiguratorImportPage() {
  const [frontendCategories, setFrontendCategories] = useState<FrontendCategory[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([]);
  const [selectedFrontendCategory, setSelectedFrontendCategory] = useState<string>('');
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadCategories();
    loadImportHistory();
  }, []);

  const loadCategories = async () => {
    try {
      const [frontendRes, catalogRes] = await Promise.all([
        fetch('/api/frontend-categories'),
        fetch('/api/catalog/categories')
      ]);

      const frontendData = await frontendRes.json();
      const catalogData = await catalogRes.json();

      setFrontendCategories(frontendData);
      setCatalogCategories(catalogData.categories || []);
    } catch (error) {
      clientLogger.error('Error loading categories:', error);
    }
  };

  const loadImportHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch('/api/admin/import/history');
      const data = await response.json();
      setImportHistory(data.history || []);
    } catch (error) {
      clientLogger.error('Error loading import history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const categoryId = selectedCatalogCategory || selectedFrontendCategory;
      const response = await fetch(`/api/admin/templates/download?catalogCategoryId=${categoryId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `template-products-${categoryId}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      clientLogger.error('Error downloading template:', error);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      setFile(selectedFile);
      setImportResult(null);
    } else {
      alert('Пожалуйста, выберите файл Excel (.xlsx)');
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
    if (!file || (!selectedFrontendCategory && !selectedCatalogCategory)) {
      alert('Выберите файл и категорию');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('catalogCategoryId', selectedCatalogCategory || selectedFrontendCategory);

      const response = await fetch('/api/admin/import/unified', {
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
      clientLogger.error('Error importing products:', error);
      setImportResult({
        success: false,
        message: 'Ошибка при импорте товаров',
        imported: 0,
        errors: ['Произошла ошибка сети'],
        warnings: []
      });
    } finally {
      setUploading(false);
    }
  };

  const getAvailableCatalogCategories = () => {
    if (!selectedFrontendCategory) return catalogCategories;
    
    const frontendCategory = frontendCategories.find(c => c.id === selectedFrontendCategory);
    if (!frontendCategory) return catalogCategories;
    
    return catalogCategories.filter(c => 
      frontendCategory.catalog_category_ids.includes(c.id)
    );
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
      {/* Выбор категории */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Выбор категории для импорта</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Категория конфигуратора</label>
            <Select value={selectedFrontendCategory} onValueChange={setSelectedFrontendCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию конфигуратора" />
              </SelectTrigger>
              <SelectContent>
                {frontendCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Категория каталога</label>
            <Select 
              value={selectedCatalogCategory} 
              onValueChange={setSelectedCatalogCategory}
              disabled={!selectedFrontendCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию каталога" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableCatalogCategories().map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} (Уровень {category.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {selectedFrontendCategory && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Примечание:</strong> Товары будут импортированы в выбранную категорию каталога 
              и станут доступны в категории конфигуратора "{frontendCategories.find(c => c.id === selectedFrontendCategory)?.name}".
            </p>
          </div>
        )}
      </Card>

      {/* Загрузка файла */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Загрузка товаров</h3>
          <Button
            variant="outline"
            onClick={downloadTemplate}
            disabled={!selectedCatalogCategory}
            className="flex items-center space-x-1"
          >
            <Download className="h-4 w-4" />
            <span>Шаблон Excel</span>
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
            Перетащите файл Excel сюда или нажмите для выбора
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Поддерживается только формат .xlsx
          </p>
          
          <input
            type="file"
            accept=".xlsx"
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
                  disabled={uploading || !selectedCatalogCategory}
                  className="flex items-center space-x-1"
                >
                  {uploading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>{uploading ? 'Импорт...' : 'Импортировать'}</span>
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
                Импортировано: {importResult.imported} товаров
              </Badge>
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
          <h3 className="text-lg font-semibold">История импорта</h3>
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
                    <span>Импортировано: {record.success_count} из {record.total_products}</span>
                    {record.error_count > 0 && (
                      <span className="text-red-600">Ошибок: {record.error_count}</span>
                    )}
                    {record.category_name && (
                      <span>Категория: {record.category_name}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(record.imported_at).toLocaleString()}
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
