'use client';

import React, { useState, useCallback } from 'react';
import { Button, Card, Input, Dialog, DialogContent, DialogHeader, DialogTitle, Badge } from '../../../components/ui';
import { Edit, Save, X, CheckCircle, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  base_price: number;
  stock_quantity: number;
  brand?: string;
  model?: string;
  properties_data: string | Record<string, any>;
}

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSave: (updates: Array<{ id: string; updates: Partial<Product> }>) => Promise<void>;
}

interface BulkEditField {
  key: keyof Product;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
}

const BULK_EDIT_FIELDS: BulkEditField[] = [
  { key: 'name', label: 'Название', type: 'text' },
  { key: 'base_price', label: 'Цена', type: 'number' },
  { key: 'stock_quantity', label: 'Количество на складе', type: 'number' },
  { key: 'brand', label: 'Бренд', type: 'text' },
  { key: 'model', label: 'Модель', type: 'text' },
];

export default function BulkEditDialog({ isOpen, onClose, products, onSave }: BulkEditDialogProps) {
  const [selectedField, setSelectedField] = useState<keyof Product>('name');
  const [updateValue, setUpdateValue] = useState<string>('');
  const [updateMode, setUpdateMode] = useState<'replace' | 'append' | 'prepend'>('replace');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedFieldConfig = BULK_EDIT_FIELDS.find(field => field.key === selectedField);

  const handleSave = useCallback(async () => {
    if (!updateValue.trim()) {
      setError('Введите значение для обновления');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updates = products.map(product => {
        let newValue: any = updateValue;

        // Преобразуем значение в зависимости от типа поля
        if (selectedFieldConfig?.type === 'number') {
          newValue = parseFloat(updateValue);
          if (isNaN(newValue)) {
            throw new Error(`Некорректное числовое значение: ${updateValue}`);
          }
        }

        // Применяем режим обновления
        if (updateMode === 'append' && selectedFieldConfig?.type === 'text') {
          newValue = `${product[selectedField] || ''}${updateValue}`;
        } else if (updateMode === 'prepend' && selectedFieldConfig?.type === 'text') {
          newValue = `${updateValue}${product[selectedField] || ''}`;
        }

        return {
          id: product.id,
          updates: {
            [selectedField]: newValue
          }
        };
      });

      await onSave(updates);
      onClose();
      setUpdateValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при обновлении товаров');
    } finally {
      setLoading(false);
    }
  }, [products, selectedField, updateValue, updateMode, selectedFieldConfig, onSave, onClose]);

  const handleClose = useCallback(() => {
    setUpdateValue('');
    setError(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Массовое редактирование товаров</span>
            <Badge variant="secondary">{products.length} товаров</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Информация о выбранных товарах */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Выбранные товары:</h3>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {products.slice(0, 10).map(product => (
                <div key={product.id} className="text-sm text-blue-800">
                  {product.sku} - {product.name}
                </div>
              ))}
              {products.length > 10 && (
                <div className="text-sm text-blue-600 font-medium">
                  ... и еще {products.length - 10} товаров
                </div>
              )}
            </div>
          </div>

          {/* Выбор поля для редактирования */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Поле для редактирования:
            </label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value as keyof Product)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {BULK_EDIT_FIELDS.map(field => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>
          </div>

          {/* Режим обновления */}
          {selectedFieldConfig?.type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Режим обновления:
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="replace"
                    checked={updateMode === 'replace'}
                    onChange={(e) => setUpdateMode(e.target.value as 'replace')}
                    className="mr-2"
                  />
                  Заменить
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="append"
                    checked={updateMode === 'append'}
                    onChange={(e) => setUpdateMode(e.target.value as 'append')}
                    className="mr-2"
                  />
                  Добавить в конец
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="prepend"
                    checked={updateMode === 'prepend'}
                    onChange={(e) => setUpdateMode(e.target.value as 'prepend')}
                    className="mr-2"
                  />
                  Добавить в начало
                </label>
              </div>
            </div>
          )}

          {/* Значение для обновления */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Новое значение:
            </label>
            <Input
              type={selectedFieldConfig?.type === 'number' ? 'number' : 'text'}
              value={updateValue}
              onChange={(e) => setUpdateValue(e.target.value)}
              placeholder={`Введите ${selectedFieldConfig?.label.toLowerCase()}`}
              className="w-full"
            />
          </div>

          {/* Ошибка */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                <span className="text-sm text-red-800">{error}</span>
              </div>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Отмена
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !updateValue.trim()}
              className="flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить изменения
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
