'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2,
  Database,
  Zap,
  ArrowRight
} from 'lucide-react';
import SimplifiedImportDialog from '../../../../components/import/SimplifiedImportDialog';
import { clientLogger } from '@/lib/logging/client-logger';

interface CatalogCategory {
  id: string;
  name: string;
  level: number;
  parent_id?: string;
  products_count?: number;
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

export default function SimplifiedCatalogImportPage() {
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [lastImportResult, setLastImportResult] = useState<ImportResult | null>(null);

  // Загрузка категорий каталога
  const loadCatalogCategories = async () => {
    try {
      const response = await fetch('/api/catalog/categories');
      if (response.ok) {
        const data = await response.json();
        // apiSuccess возвращает { success: true, data: { categories: ..., total_count: ... } }
        const { parseApiResponse } = await import('@/lib/utils/parse-api-response');
        const responseData = parseApiResponse<{ categories: CatalogCategory[]; total_count: number }>(data);
        setCatalogCategories(responseData?.categories || []);
      }
    } catch (error) {
      clientLogger.error('Error loading catalog categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogCategories();
  }, []);

  const handleImportComplete = (result: ImportResult) => {
    setLastImportResult(result);
    setImportDialogOpen(false);
    // Обновляем список категорий для обновления счетчиков
    loadCatalogCategories();
  };

  const getCategoryDisplayName = (category: CatalogCategory) => {
    const indent = '  '.repeat(category.level);
    return `${indent}${category.name}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка категорий...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Упрощенный импорт каталога</h1>
          <p className="text-gray-600 mt-1">
            Импорт товаров с упрощенной системой маппинга
          </p>
        </div>
        <Button onClick={() => setImportDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Импортировать товары
        </Button>
      </div>

      {/* Информация об упрощенной системе */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Zap className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Упрощенная система импорта
            </h2>
            <p className="text-gray-600 mb-4">
              Новая система импорта без промежуточного маппинга. Заголовки Excel используются напрямую как поля шаблона.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Прямое соответствие</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Нет маппинга</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Быстрый импорт</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Результат последнего импорта */}
      {lastImportResult && (
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${
              lastImportResult.success ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {lastImportResult.success ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <XCircle className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Результат последнего импорта
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Файл</p>
                  <p className="font-medium">{lastImportResult.data.filename}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Категория</p>
                  <p className="font-medium">{lastImportResult.data.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Импортировано</p>
                  <p className="font-medium">{lastImportResult.data.saved_rows} товаров</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Заголовков</p>
                  <p className="font-medium">{lastImportResult.data.headers.length}</p>
                </div>
              </div>
              
              {lastImportResult.data.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Предупреждения</p>
                      <div className="mt-1 space-y-1">
                        {lastImportResult.data.errors.slice(0, 3).map((error, index) => (
                          <p key={index} className="text-sm text-yellow-700">{error}</p>
                        ))}
                        {lastImportResult.data.errors.length > 3 && (
                          <p className="text-sm text-yellow-700">
                            ... и еще {lastImportResult.data.errors.length - 3} предупреждений
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Категории каталога */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Категории каталога</h2>
          <Badge variant="secondary">
            {catalogCategories.length} категорий
          </Badge>
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {catalogCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {getCategoryDisplayName(category)}
                </span>
                <Badge variant="outline" className="text-xs">
                  L{category.level}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {category.products_count || 0} товаров
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setImportDialogOpen(true)}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Импорт
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Диалог импорта */}
      <SimplifiedImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        catalogCategories={catalogCategories}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
