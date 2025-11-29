'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui';
import { Save, Plus, Trash2, Settings, Download } from 'lucide-react';

interface ExportField {
  key: string;
  label: string;
  source: 'product' | 'properties';
  propertyKey?: string;
  format: 'text' | 'number' | 'currency' | 'date';
  required: boolean;
}

interface ExportConfig {
  id?: string;
  exportType: string;
  fields: ExportField[];
  display: {
    title: string;
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    show_totals: boolean;
    show_tax: boolean;
    tax_rate: number;
    currency: string;
    date_format: string;
    number_format: string;
  };
}

interface ExportConfigEditorProps {
  catalogCategoryId: string;
  exportType: string;
  onSave: (config: ExportConfig) => void;
  onCancel: () => void;
}

const ExportConfigEditor: React.FC<ExportConfigEditorProps> = ({
  catalogCategoryId,
  exportType,
  onSave,
  onCancel
}) => {
  const [config, setConfig] = useState<ExportConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/export/config?catalogCategoryId=${catalogCategoryId}&exportType=${exportType}`);
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки настроек экспорта');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
      } else {
        throw new Error(data.error || 'Настройки не найдены');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [catalogCategoryId, exportType]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const addField = () => {
    if (!config) return;
    
    const newField: ExportField = {
      key: `field_${Date.now()}`,
      label: '',
      source: 'properties',
      format: 'text',
      required: false
    };
    
    setConfig({
      ...config,
      fields: [...config.fields, newField]
    });
  };

  const removeField = (index: number) => {
    if (!config) return;
    
    setConfig({
      ...config,
      fields: config.fields.filter((_, i) => i !== index)
    });
  };

  const updateField = (index: number, updates: Partial<ExportField>) => {
    if (!config) return;
    
    const newFields = [...config.fields];
    newFields[index] = { ...newFields[index], ...updates };
    
    setConfig({
      ...config,
      fields: newFields
    });
  };

  const updateDisplay = (updates: Partial<ExportConfig['display']>) => {
    if (!config) return;
    
    setConfig({
      ...config,
      display: { ...config.display, ...updates }
    });
  };

  const saveConfig = async () => {
    if (!config) return;
    
    try {
      setSaving(true);
      setError(null);

      // Валидируем поля
      const validFields = config.fields.filter(field => field.key.trim() !== '' && field.label.trim() !== '');
      if (validFields.length === 0) {
        throw new Error('Добавьте хотя бы одно поле');
      }

      // Проверяем уникальность ключей
      const fieldKeys = validFields.map(field => field.key);
      const uniqueKeys = new Set(fieldKeys);
      if (uniqueKeys.size !== fieldKeys.length) {
        throw new Error('Ключи полей должны быть уникальными');
      }

      const response = await fetch('/api/admin/export/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          catalogCategoryId,
          exportType,
          fields: validFields,
          display: config.display
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка сохранения настроек');
      }

      const result = await response.json();
      onSave(result.config);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>Настройки не найдены</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Заголовок */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Настройки экспорта
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Тип: {exportType === 'price_list' ? 'Прайс-лист' : exportType}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={onCancel}
                variant="outline"
                disabled={saving}
              >
                Отмена
              </Button>
              <Button
                onClick={saveConfig}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </div>
        </div>

        {/* Ошибки */}
        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <div className="text-red-600 text-sm">{error}</div>
          </div>
        )}

        {/* Содержимое */}
        <div className="p-6 space-y-6">
          {/* Поля экспорта */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Поля экспорта</h3>
              <Button
                onClick={addField}
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Добавить поле
              </Button>
            </div>

            <div className="space-y-3">
              {config.fields.map((field, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ключ поля
                      </label>
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => updateField(index, { key: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="field_key"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Название
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Название поля"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Источник
                      </label>
                      <select
                        value={field.source}
                        onChange={(e) => updateField(index, { 
                          source: e.target.value as 'product' | 'properties',
                          propertyKey: e.target.value === 'product' ? undefined : field.propertyKey
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="product">Основные поля</option>
                        <option value="properties">Свойства товара</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Формат
                      </label>
                      <select
                        value={field.format}
                        onChange={(e) => updateField(index, { format: e.target.value as ExportField['format'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="text">Текст</option>
                        <option value="number">Число</option>
                        <option value="currency">Валюта</option>
                        <option value="date">Дата</option>
                      </select>
                    </div>
                  </div>

                  {/* Ключ свойства для properties */}
                  {field.source === 'properties' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ключ свойства товара
                      </label>
                      <input
                        type="text"
                        value={field.propertyKey || ''}
                        onChange={(e) => updateField(index, { propertyKey: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Артикул поставщика"
                      />
                    </div>
                  )}

                  {/* Настройки поля */}
                  <div className="mt-3 flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Обязательное поле</span>
                    </label>
                    
                    <Button
                      onClick={() => removeField(index)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Настройки отображения */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Настройки отображения</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Заголовок документа
                </label>
                <input
                  type="text"
                  value={config.display.title}
                  onChange={(e) => updateDisplay({ title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название компании
                </label>
                <input
                  type="text"
                  value={config.display.company_name}
                  onChange={(e) => updateDisplay({ company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Адрес компании
                </label>
                <input
                  type="text"
                  value={config.display.company_address}
                  onChange={(e) => updateDisplay({ company_address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон
                </label>
                <input
                  type="text"
                  value={config.display.company_phone}
                  onChange={(e) => updateDisplay({ company_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={config.display.company_email}
                  onChange={(e) => updateDisplay({ company_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Валюта
                </label>
                <select
                  value={config.display.currency}
                  onChange={(e) => updateDisplay({ currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RUB">RUB</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.display.show_totals}
                  onChange={(e) => updateDisplay({ show_totals: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Показывать итоги</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.display.show_tax}
                  onChange={(e) => updateDisplay({ show_tax: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Показывать налоги</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportConfigEditor;
