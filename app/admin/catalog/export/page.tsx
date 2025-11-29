'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Badge, Input, Dialog, DialogContent, DialogHeader, DialogTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox } from '../../../../components/ui';
import { Download, Settings, FileText, Receipt, ShoppingCart, Plus, Trash2, Edit } from 'lucide-react';
import { CatalogCategory } from '@/lib/types/catalog';
import { clientLogger } from '@/lib/logging/client-logger';

interface ExportConfig {
  export_type: 'quote' | 'invoice' | 'supplier_order';
  fields_config: Array<{
    field: string;
    label: string;
    width: number;
    format?: string;
    required: boolean;
  }>;
  display_config: {
    title: string;
    company_name: string;
    company_address: string;
    company_phone: string;
    company_email: string;
    logo_url?: string;
    show_totals: boolean;
    show_tax: boolean;
    tax_rate: number;
    currency: string;
    date_format: string;
    number_format: string;
  };
}

const exportTypeLabels = {
  quote: 'Коммерческое предложение',
  invoice: 'Счет на оплату',
  supplier_order: 'Заказ поставщику'
};

const exportTypeIcons = {
  quote: FileText,
  invoice: Receipt,
  supplier_order: ShoppingCart
};

export default function ExportSettingsPage() {
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [exportConfigs, setExportConfigs] = useState<ExportConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<'quote' | 'invoice' | 'supplier_order' | null>(null);
  const [currentConfig, setCurrentConfig] = useState<ExportConfig | null>(null);

  useEffect(() => {
    loadCatalogCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadExportConfigs(selectedCategory);
    }
  }, [selectedCategory]);

  const loadCatalogCategories = async () => {
    try {
      const response = await fetch('/api/catalog/categories');
      const data = await response.json();
      setCatalogCategories(data.categories || []);
    } catch (error) {
      clientLogger.error('Error loading catalog categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExportConfigs = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/catalog/export/configs?catalogCategoryId=${categoryId}`);
      const configs = await response.json();
      setExportConfigs(configs);
    } catch (error) {
      clientLogger.error('Error loading export configs:', error);
    }
  };

  const handleExport = async (exportType: 'quote' | 'invoice' | 'supplier_order') => {
    if (!selectedCategory) {
      alert('Выберите категорию каталога');
      return;
    }

    try {
      const response = await fetch('/api/catalog/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalogCategoryId: selectedCategory,
          exportType
        })
      });

      const result = await response.json();

      if (result.success && result.file_url) {
        // Создаем ссылку для скачивания
        const link = document.createElement('a');
        link.href = result.file_url;
        link.download = result.file_name || 'export.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(`Ошибка экспорта: ${result.message}`);
      }
    } catch (error) {
      clientLogger.error('Error exporting:', error);
      alert('Ошибка при экспорте');
    }
  };

  const handleCreateConfig = (exportType: 'quote' | 'invoice' | 'supplier_order') => {
    setSelectedExportType(exportType);
    setCurrentConfig(null);
    setConfigDialogOpen(true);
  };

  const handleEditConfig = (config: ExportConfig) => {
    setSelectedExportType(config.export_type);
    setCurrentConfig(config);
    setConfigDialogOpen(true);
  };

  const handleDeleteConfig = async (exportType: 'quote' | 'invoice' | 'supplier_order') => {
    if (!selectedCategory) return;

    if (!confirm(`Удалить настройки экспорта для "${exportTypeLabels[exportType]}"?`)) return;

    try {
      const response = await fetch('/api/catalog/export/config', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalogCategoryId: selectedCategory,
          exportType
        })
      });

      if (response.ok) {
        await loadExportConfigs(selectedCategory);
      }
    } catch (error) {
      clientLogger.error('Error deleting config:', error);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = catalogCategories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Выбор категории */}
      <Card className="p-4">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Категория каталога</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-1/2">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {catalogCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} (L{category.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {selectedCategory && (
        <>
          {/* Быстрый экспорт */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Быстрый экспорт</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['quote', 'invoice', 'supplier_order'] as const).map(exportType => {
                const Icon = exportTypeIcons[exportType];
                return (
                  <div key={exportType} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Icon className="h-6 w-6 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{exportTypeLabels[exportType]}</h4>
                        <p className="text-sm text-gray-500">Экспорт с настройками по умолчанию</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleExport(exportType)}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Экспортировать
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Настройки экспорта */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Настройки экспорта</h3>
              <div className="flex space-x-2">
                {(['quote', 'invoice', 'supplier_order'] as const).map(exportType => (
                  <Button
                    key={exportType}
                    onClick={() => handleCreateConfig(exportType)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {exportTypeLabels[exportType]}
                  </Button>
                ))}
              </div>
            </div>

            {exportConfigs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                Настройки экспорта не созданы
              </div>
            ) : (
              <div className="space-y-4">
                {exportConfigs.map(config => {
                  const Icon = exportTypeIcons[config.export_type];
                  return (
                    <div key={config.export_type} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Icon className="h-5 w-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium">{exportTypeLabels[config.export_type]}</h4>
                            <p className="text-sm text-gray-500">
                              {config.fields_config.length} полей, {config.display_config.company_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => handleExport(config.export_type)}
                            size="sm"
                            variant="outline"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleEditConfig(config)}
                            size="sm"
                            variant="outline"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteConfig(config.export_type)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Диалог настройки экспорта */}
      <ExportConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        exportType={selectedExportType}
        config={currentConfig}
        catalogCategoryId={selectedCategory}
        onSave={() => {
          setConfigDialogOpen(false);
          if (selectedCategory) {
            loadExportConfigs(selectedCategory);
          }
        }}
      />
    </div>
  );
}

// Компонент диалога настройки экспорта
function ExportConfigDialog({
  open,
  onOpenChange,
  exportType,
  config,
  catalogCategoryId,
  onSave
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportType: 'quote' | 'invoice' | 'supplier_order' | null;
  config: ExportConfig | null;
  catalogCategoryId: string;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState<ExportConfig | null>(null);

  useEffect(() => {
    if (config) {
      setFormData(config);
    } else if (exportType) {
      // Создаем конфигурацию по умолчанию
      setFormData({
        export_type: exportType,
        fields_config: [
          { field: 'sku', label: 'Артикул', width: 15, required: true },
          { field: 'name', label: 'Название', width: 30, required: true },
          { field: 'quantity', label: 'Количество', width: 12, format: 'number', required: true },
          { field: 'unit_price', label: 'Цена за ед.', width: 15, format: 'currency', required: true },
          { field: 'total_price', label: 'Сумма', width: 15, format: 'currency', required: true }
        ],
        display_config: {
          title: exportType === 'quote' ? 'Коммерческое предложение' : 
                exportType === 'invoice' ? 'Счет на оплату' : 'Заказ поставщику',
          company_name: 'ООО "Компания"',
          company_address: 'г. Москва, ул. Примерная, д. 1',
          company_phone: '+7 (495) 123-45-67',
          company_email: 'info@company.ru',
          show_totals: true,
          show_tax: true,
          tax_rate: 20,
          currency: 'RUB',
          date_format: 'DD.MM.YYYY',
          number_format: '#,##0.00'
        }
      });
    }
  }, [config, exportType]);

  const handleSave = async () => {
    if (!formData || !catalogCategoryId) return;

    try {
      const response = await fetch('/api/catalog/export/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catalogCategoryId,
          exportType: formData.export_type,
          config: formData
        })
      });

      if (response.ok) {
        onSave();
      }
    } catch (error) {
      clientLogger.error('Error saving config:', error);
    }
  };

  if (!formData || !exportType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Настройки экспорта: {exportTypeLabels[exportType]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Настройки отображения */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Настройки отображения</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Заголовок документа</label>
                <Input
                  value={formData.display_config.title}
                  onChange={(e) => setFormData({
                    ...formData,
                    display_config: { ...formData.display_config, title: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Название компании</label>
                <Input
                  value={formData.display_config.company_name}
                  onChange={(e) => setFormData({
                    ...formData,
                    display_config: { ...formData.display_config, company_name: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Адрес компании</label>
                <Input
                  value={formData.display_config.company_address}
                  onChange={(e) => setFormData({
                    ...formData,
                    display_config: { ...formData.display_config, company_address: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Телефон</label>
                <Input
                  value={formData.display_config.company_phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    display_config: { ...formData.display_config, company_phone: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  value={formData.display_config.company_email}
                  onChange={(e) => setFormData({
                    ...formData,
                    display_config: { ...formData.display_config, company_email: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Валюта</label>
                <Select
                  value={formData.display_config.currency}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    display_config: { ...formData.display_config, currency: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RUB">RUB</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show_totals"
                  checked={formData.display_config.show_totals}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    display_config: { ...formData.display_config, show_totals: !!checked }
                  })}
                />
                <label htmlFor="show_totals" className="text-sm font-medium">Показывать итоги</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show_tax"
                  checked={formData.display_config.show_tax}
                  onCheckedChange={(checked) => setFormData({
                    ...formData,
                    display_config: { ...formData.display_config, show_tax: !!checked }
                  })}
                />
                <label htmlFor="show_tax" className="text-sm font-medium">Показывать налог</label>
              </div>
            </div>
          </div>

          {/* Настройки полей */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Поля экспорта</h3>
            <div className="space-y-2">
              {formData.fields_config.map((field, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                  <div className="flex-1">
                    <Input
                      value={field.label}
                      onChange={(e) => {
                        const newFields = [...formData.fields_config];
                        newFields[index].label = e.target.value;
                        setFormData({ ...formData, fields_config: newFields });
                      }}
                      placeholder="Название поля"
                    />
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      value={field.width}
                      onChange={(e) => {
                        const newFields = [...formData.fields_config];
                        newFields[index].width = parseInt(e.target.value) || 15;
                        setFormData({ ...formData, fields_config: newFields });
                      }}
                      placeholder="Ширина"
                    />
                  </div>
                  <div className="w-24">
                    <Select
                      value={field.format || ''}
                      onValueChange={(value) => {
                        const newFields = [...formData.fields_config];
                        newFields[index].format = value || undefined;
                        setFormData({ ...formData, fields_config: newFields });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Формат" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Текст</SelectItem>
                        <SelectItem value="number">Число</SelectItem>
                        <SelectItem value="currency">Валюта</SelectItem>
                        <SelectItem value="date">Дата</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Checkbox
                    checked={field.required}
                    onCheckedChange={(checked) => {
                      const newFields = [...formData.fields_config];
                      newFields[index].required = !!checked;
                      setFormData({ ...formData, fields_config: newFields });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave}>
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
