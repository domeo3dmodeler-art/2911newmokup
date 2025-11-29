'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileCheck, AlertCircle, CheckCircle, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui';
import { clientLogger } from '@/lib/logging/client-logger';

interface ImportResult {
  success: boolean;
  models: { total: number; new: number; updated: number; errors: number };
  coatings: { total: number; new: number; updated: number; errors: number };
  edges: { total: number; new: number; updated: number; errors: number };
  options: { total: number; new: number; updated: number; errors: number };
  handles: { total: number; new: number; updated: number; errors: number };
  limiters: { total: number; new: number; updated: number; errors: number };
  errors: Array<{ sheet: string; row: number; message: string }>;
  warnings: Array<{ sheet: string; row: number; message: string }>;
}

interface DoorsTemplateImporterProps {
  categoryId: string;
  onImportComplete?: (result: ImportResult) => void;
}

export default function DoorsTemplateImporter({
  categoryId,
  onImportComplete
}: DoorsTemplateImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'preview' | 'import'>('preview');
  const [updateMode, setUpdateMode] = useState<'replace' | 'merge' | 'add_new'>('merge');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Проверяем расширение файла
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setError('Пожалуйста, выберите файл Excel (.xlsx или .xls)');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
  }, []);

  const handleImport = useCallback(async () => {
    if (!file) {
      setError('Пожалуйста, выберите файл');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('categoryId', categoryId);
      formData.append('mode', mode);
      formData.append('updateMode', updateMode);

      const response = await fetch('/api/admin/import-templates/import-doors', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data?.result) {
        const importResult = data.data.result as ImportResult;
        setResult(importResult);
        
        if (onImportComplete) {
          onImportComplete(importResult);
        }

        if (mode === 'import') {
          alert(
            `Импорт завершен!\n\n` +
            `Модели: ${importResult.models.new} новых, ${importResult.models.updated} обновлено\n` +
            `Покрытия: ${importResult.coatings.new} новых, ${importResult.coatings.updated} обновлено\n` +
            `Кромка: ${importResult.edges.new} новых, ${importResult.edges.updated} обновлено\n` +
            `Опции: ${importResult.options.new} новых, ${importResult.options.updated} обновлено\n` +
            `Ручки: ${importResult.handles.new} новых, ${importResult.handles.updated} обновлено\n` +
            `Ограничители: ${importResult.limiters.new} новых, ${importResult.limiters.updated} обновлено`
          );
        }
      } else {
        throw new Error(data.error || 'Ошибка при импорте');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      setError(errorMessage);
      clientLogger.error('Ошибка импорта шаблона дверей:', err);
    } finally {
      setImporting(false);
    }
  }, [file, categoryId, mode, updateMode, onImportComplete]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Импорт шаблона дверей (newdata.xlsx)
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Загрузите файл newdata.xlsx с 6 листами: Модели, Покрытия, Кромка, Опции, Ручки, Ограничители
        </p>

        {/* Выбор файла */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Файл Excel
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Выбрать файл</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                disabled={importing}
              />
            </label>
            {file && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileCheck className="w-4 h-4 text-green-600" />
                <span>{file.name}</span>
                <span className="text-gray-400">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Настройки импорта */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Режим
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'preview' | 'import')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={importing}
            >
              <option value="preview">Предпросмотр</option>
              <option value="import">Импорт</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Режим обновления
            </label>
            <select
              value={updateMode}
              onChange={(e) => setUpdateMode(e.target.value as 'replace' | 'merge' | 'add_new')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={importing || mode === 'preview'}
            >
              <option value="replace">Заменить существующие</option>
              <option value="merge">Объединить с существующими</option>
              <option value="add_new">Только новые</option>
            </select>
          </div>
        </div>

        {/* Кнопка импорта */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === 'preview' ? 'Просмотр...' : 'Импорт...'}
              </>
            ) : (
              <>
                {mode === 'preview' ? 'Предпросмотр' : 'Импортировать'}
              </>
            )}
          </Button>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Ошибка</span>
            </div>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Результаты */}
        {result && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span>Результаты {mode === 'preview' ? 'предпросмотра' : 'импорта'}</span>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-600">Модели</div>
                <div className="text-lg font-semibold text-gray-900">
                  {result.models.total}
                </div>
                <div className="text-xs text-gray-500">
                  {result.models.new} новых, {result.models.updated} обновлено
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-600">Покрытия</div>
                <div className="text-lg font-semibold text-gray-900">
                  {result.coatings.total}
                </div>
                <div className="text-xs text-gray-500">
                  {result.coatings.new} новых, {result.coatings.updated} обновлено
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-600">Кромка</div>
                <div className="text-lg font-semibold text-gray-900">
                  {result.edges.total}
                </div>
                <div className="text-xs text-gray-500">
                  {result.edges.new} новых, {result.edges.updated} обновлено
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-600">Опции</div>
                <div className="text-lg font-semibold text-gray-900">
                  {result.options.total}
                </div>
                <div className="text-xs text-gray-500">
                  {result.options.new} новых, {result.options.updated} обновлено
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-600">Ручки</div>
                <div className="text-lg font-semibold text-gray-900">
                  {result.handles.total}
                </div>
                <div className="text-xs text-gray-500">
                  {result.handles.new} новых, {result.handles.updated} обновлено
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <div className="text-sm text-gray-600">Ограничители</div>
                <div className="text-lg font-semibold text-gray-900">
                  {result.limiters.total}
                </div>
                <div className="text-xs text-gray-500">
                  {result.limiters.new} новых, {result.limiters.updated} обновлено
                </div>
              </div>
            </div>

            {/* Ошибки и предупреждения */}
            {(result.errors.length > 0 || result.warnings.length > 0) && (
              <div className="space-y-2">
                {result.errors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="font-medium text-red-800 mb-2">
                      Ошибки ({result.errors.length})
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {result.errors.slice(0, 10).map((err, idx) => (
                        <div key={idx} className="text-sm text-red-700">
                          {err.sheet}, строка {err.row}: {err.message}
                        </div>
                      ))}
                      {result.errors.length > 10 && (
                        <div className="text-sm text-red-600 italic">
                          ... и еще {result.errors.length - 10} ошибок
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {result.warnings.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="font-medium text-yellow-800 mb-2">
                      Предупреждения ({result.warnings.length})
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {result.warnings.slice(0, 10).map((warn, idx) => (
                        <div key={idx} className="text-sm text-yellow-700">
                          {warn.sheet}, строка {warn.row}: {warn.message}
                        </div>
                      ))}
                      {result.warnings.length > 10 && (
                        <div className="text-sm text-yellow-600 italic">
                          ... и еще {result.warnings.length - 10} предупреждений
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

