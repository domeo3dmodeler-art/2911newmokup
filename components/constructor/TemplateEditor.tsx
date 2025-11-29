'use client';

import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Select, Checkbox, Textarea, Badge } from '../ui';
import { Plus, Trash2, Save, Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { clientLogger } from '@/lib/logging/client-logger';

interface TemplateField {
  id: string;
  fieldName: string;
  displayName: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'date';
  isRequired: boolean;
  isForCalculator: boolean;
  isForExport: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface TemplateEditorProps {
  categoryId: string;
  categoryName: string;
  template?: any;
  onSave: (template: any) => void;
  onClose: () => void;
}

export default function TemplateEditor({
  categoryId,
  categoryName,
  template,
  onSave,
  onClose
}: TemplateEditorProps) {
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    requiredFields: [] as TemplateField[],
    calculatorFields: [] as TemplateField[],
    exportFields: [] as TemplateField[],
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Инициализация данных шаблона
  useEffect(() => {
    if (template) {
      setTemplateData({
        name: template.name || '',
        description: template.description || '',
        requiredFields: template.requiredFields ? JSON.parse(template.requiredFields) : [],
        calculatorFields: template.calculatorFields ? JSON.parse(template.calculatorFields) : [],
        exportFields: template.exportFields ? JSON.parse(template.exportFields) : [],
        isActive: template.isActive !== false
      });
    } else {
      // Создаем новый шаблон с базовыми полями
      setTemplateData({
        name: `Шаблон для ${categoryName}`,
        description: `Шаблон импорта для категории ${categoryName}`,
        requiredFields: [
          {
            id: 'name',
            fieldName: 'name',
            displayName: 'Название',
            type: 'text',
            isRequired: true,
            isForCalculator: false,
            isForExport: true
          },
          {
            id: 'price',
            fieldName: 'price',
            displayName: 'Цена',
            type: 'number',
            isRequired: true,
            isForCalculator: true,
            isForExport: true,
            validation: { min: 0 }
          }
        ],
        calculatorFields: [],
        exportFields: [],
        isActive: true
      });
    }
  }, [template, categoryId, categoryName]);

  // Добавление нового поля
  const addField = (type: 'required' | 'calculator' | 'export') => {
    const newField: TemplateField = {
      id: `field_${Date.now()}`,
      fieldName: `field_${templateData.requiredFields.length + 1}`,
      displayName: `Поле ${templateData.requiredFields.length + 1}`,
      type: 'text',
      isRequired: type === 'required',
      isForCalculator: type === 'calculator',
      isForExport: type === 'export'
    };

    setTemplateData(prev => ({
      ...prev,
      [`${type}Fields`]: [...prev[`${type}Fields`], newField]
    }));
  };

  // Обновление поля
  const updateField = (type: 'required' | 'calculator' | 'export', fieldId: string, updates: Partial<TemplateField>) => {
    setTemplateData(prev => ({
      ...prev,
      [`${type}Fields`]: prev[`${type}Fields`].map((field: TemplateField) =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  // Удаление поля
  const removeField = (type: 'required' | 'calculator' | 'export', fieldId: string) => {
    setTemplateData(prev => ({
      ...prev,
      [`${type}Fields`]: prev[`${type}Fields`].filter((field: TemplateField) => field.id !== fieldId)
    }));
  };

  // Перемещение поля между категориями
  const moveField = (fromType: 'required' | 'calculator' | 'export', toType: 'required' | 'calculator' | 'export', fieldId: string) => {
    const field = templateData[`${fromType}Fields`].find((f: TemplateField) => f.id === fieldId);
    if (!field) return;

    // Удаляем из исходной категории
    setTemplateData(prev => ({
      ...prev,
      [`${fromType}Fields`]: prev[`${fromType}Fields`].filter((f: TemplateField) => f.id !== fieldId)
    }));

    // Добавляем в целевую категорию
    const updatedField = {
      ...field,
      isRequired: toType === 'required',
      isForCalculator: toType === 'calculator',
      isForExport: toType === 'export'
    };

    setTemplateData(prev => ({
      ...prev,
      [`${toType}Fields`]: [...prev[`${toType}Fields`], updatedField]
    }));
  };

  // Валидация шаблона
  const validateTemplate = () => {
    const newErrors: string[] = [];

    if (!templateData.name.trim()) {
      newErrors.push('Название шаблона обязательно');
    }

    if (templateData.requiredFields.length === 0) {
      newErrors.push('Должно быть хотя бы одно обязательное поле');
    }

    // Проверяем уникальность fieldName
    const allFields = [...templateData.requiredFields, ...templateData.calculatorFields, ...templateData.exportFields];
    const fieldNames = allFields.map(f => f.fieldName);
    const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      newErrors.push(`Дублирующиеся имена полей: ${[...new Set(duplicates)].join(', ')}`);
    }

    // Проверяем, что все обязательные поля имеют displayName
    const fieldsWithoutDisplayName = templateData.requiredFields.filter(f => !f.displayName.trim());
    if (fieldsWithoutDisplayName.length > 0) {
      newErrors.push('Все поля должны иметь отображаемое название');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Сохранение шаблона
  const handleSave = async () => {
    if (!validateTemplate()) {
      return;
    }

    setSaving(true);
    try {
      const templateToSave = {
        name: templateData.name,
        description: templateData.description,
        catalog_category_id: categoryId,
        required_fields: JSON.stringify(templateData.requiredFields),
        calculator_fields: JSON.stringify(templateData.calculatorFields),
        export_fields: JSON.stringify(templateData.exportFields),
        is_active: templateData.isActive
      };

      const response = await fetch('/api/admin/import-templates', {
        method: template ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...templateToSave,
          ...(template && { id: template.id })
        })
      });

      if (response.ok) {
        const result = await response.json();
        onSave(result.template);
      } else {
        const error = await response.json();
        setErrors([error.error || 'Ошибка при сохранении шаблона']);
      }
    } catch (error) {
      clientLogger.error('Error saving template:', error);
      setErrors(['Ошибка при сохранении шаблона']);
    } finally {
      setSaving(false);
    }
  };

  // Скачивание шаблона в Excel
  const downloadTemplate = () => {
    try {
      const allFields = [...templateData.requiredFields, ...templateData.calculatorFields, ...templateData.exportFields];
      const headers = allFields.map(field => field.displayName || field.fieldName);
      
      // Создаем данные для Excel
      const worksheetData = [
        headers, // Заголовки
        ...Array(5).fill(null).map(() => headers.map(() => '')) // 5 пустых строк для примера
      ];
      
      // Создаем рабочую книгу
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Настраиваем ширину колонок
      const columnWidths = headers.map(() => ({ wch: 20 }));
      worksheet['!cols'] = columnWidths;
      
      // Добавляем лист в книгу
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Шаблон');
      
      // Генерируем Excel файл
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      
      // Создаем Blob и скачиваем
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `template_${templateData.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      clientLogger.error('Ошибка при создании шаблона:', error);
      setErrors(['Ошибка при создании файла шаблона']);
    }
  };

  // Рендер поля
  const renderField = (field: TemplateField, type: 'required' | 'calculator' | 'export') => {
    const typeColors = {
      required: 'bg-red-50 border-red-200',
      calculator: 'bg-blue-50 border-blue-200',
      export: 'bg-green-50 border-green-200'
    };

    const typeLabels = {
      required: 'Обязательное',
      calculator: 'Калькулятор',
      export: 'Экспорт'
    };

    return (
      <div key={field.id} className={`border rounded-lg p-4 ${typeColors[type]}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {typeLabels[type]}
            </Badge>
            <span className="text-sm font-medium text-gray-700">
              {field.displayName || field.fieldName}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {type !== 'required' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveField(type, 'required', field.id)}
                title="Переместить в обязательные"
              >
                В обязательные
              </Button>
            )}
            {type !== 'calculator' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveField(type, 'calculator', field.id)}
                title="Переместить в калькулятор"
              >
                В калькулятор
              </Button>
            )}
            {type !== 'export' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => moveField(type, 'export', field.id)}
                title="Переместить в экспорт"
              >
                В экспорт
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => removeField(type, field.id)}
              title="Удалить поле"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Имя поля</label>
            <Input
              value={field.fieldName}
              onChange={(e) => updateField(type, field.id, { fieldName: e.target.value })}
              className="text-sm"
              placeholder="field_name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Отображаемое название</label>
            <Input
              value={field.displayName}
              onChange={(e) => updateField(type, field.id, { displayName: e.target.value })}
              className="text-sm"
              placeholder="Название поля"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Тип</label>
            <Select
              value={field.type}
              onChange={(value) => updateField(type, field.id, { type: value as any })}
            >
              <option value="text">Текст</option>
              <option value="number">Число</option>
              <option value="select">Список</option>
              <option value="boolean">Да/Нет</option>
              <option value="date">Дата</option>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Значение по умолчанию</label>
            <Input
              value={field.defaultValue || ''}
              onChange={(e) => updateField(type, field.id, { defaultValue: e.target.value })}
              className="text-sm"
              placeholder="По умолчанию"
            />
          </div>
        </div>

        {field.type === 'select' && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Варианты выбора</label>
            <Input
              value={field.options?.join(', ') || ''}
              onChange={(e) => updateField(type, field.id, { 
                options: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
              })}
              className="text-sm"
              placeholder="Вариант1, Вариант2, Вариант3"
            />
          </div>
        )}

        {field.type === 'number' && (
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Минимальное значение</label>
              <Input
                type="number"
                value={field.validation?.min || ''}
                onChange={(e) => updateField(type, field.id, { 
                  validation: { ...field.validation, min: parseFloat(e.target.value) || undefined }
                })}
                className="text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Максимальное значение</label>
              <Input
                type="number"
                value={field.validation?.max || ''}
                onChange={(e) => updateField(type, field.id, { 
                  validation: { ...field.validation, max: parseFloat(e.target.value) || undefined }
                })}
                className="text-sm"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {template ? 'Редактирование шаблона' : 'Создание шаблона'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Категория: {categoryName}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            disabled={templateData.requiredFields.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Скачать Excel
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || errors.length > 0}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>

      {/* Ошибки */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-medium text-red-900">Ошибки валидации</h3>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Основная информация */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Основная информация</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название шаблона</label>
            <Input
              value={templateData.name}
              onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Введите название шаблона"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
            <Select
              value={templateData.isActive ? 'active' : 'inactive'}
              onChange={(value) => setTemplateData(prev => ({ ...prev, isActive: value === 'active' }))}
            >
              <option value="active">Активен</option>
              <option value="inactive">Неактивен</option>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
          <Textarea
            value={templateData.description}
            onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Введите описание шаблона"
            rows={3}
          />
        </div>
      </Card>

      {/* Обязательные поля */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Обязательные поля</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addField('required')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Добавить поле
          </Button>
        </div>
        
        {templateData.requiredFields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Нет обязательных полей</p>
            <p className="text-sm">Добавьте поля, которые должны быть заполнены при импорте</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templateData.requiredFields.map(field => renderField(field, 'required'))}
          </div>
        )}
      </Card>

      {/* Поля калькулятора */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Поля калькулятора</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addField('calculator')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Добавить поле
          </Button>
        </div>
        
        {templateData.calculatorFields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Нет полей для калькулятора</p>
            <p className="text-sm">Добавьте поля, которые будут использоваться в расчетах цен</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templateData.calculatorFields.map(field => renderField(field, 'calculator'))}
          </div>
        )}
      </Card>

      {/* Поля экспорта */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Поля экспорта</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addField('export')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Добавить поле
          </Button>
        </div>
        
        {templateData.exportFields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Нет полей для экспорта</p>
            <p className="text-sm">Добавьте поля, которые будут включены в экспорт данных</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templateData.exportFields.map(field => renderField(field, 'export'))}
          </div>
        )}
      </Card>

      {/* Статистика */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Статистика шаблона</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-red-600">{templateData.requiredFields.length}</div>
            <div className="text-sm text-gray-600">Обязательных</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{templateData.calculatorFields.length}</div>
            <div className="text-sm text-gray-600">Калькулятор</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{templateData.exportFields.length}</div>
            <div className="text-sm text-gray-600">Экспорт</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">
              {templateData.requiredFields.length + templateData.calculatorFields.length + templateData.exportFields.length}
            </div>
            <div className="text-sm text-gray-600">Всего полей</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
