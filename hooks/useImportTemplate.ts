import { useState, useEffect } from 'react';

interface TemplateField {
  fieldName: string;
  displayName: string;
  dataType: string;
  isRequired: boolean;
  isCalculator?: boolean;
  isExport?: boolean;
}

interface ImportTemplate {
  id: string;
  name: string;
  description?: string;
  fieldMappings: TemplateField[];
  requiredFields: TemplateField[];
  catalogCategoryId: string;
  createdAt: string;
  updatedAt: string;
}

interface UseImportTemplateResult {
  template: ImportTemplate | null;
  loading: boolean;
  error: string | null;
  loadTemplate: (categoryId: string) => Promise<void>;
  createTemplate: (categoryId: string, fields: TemplateField[]) => Promise<ImportTemplate>;
  updateTemplate: (templateId: string, fields: TemplateField[]) => Promise<ImportTemplate>;
}

export function useImportTemplate(): UseImportTemplateResult {
  const [template, setTemplate] = useState<ImportTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplate = async (categoryId: string) => {
    if (!categoryId) {
      setTemplate(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/import-templates?catalog_category_id=${categoryId}`);
      const data = await response.json();

      if (data.success && data.templates && data.templates.length > 0) {
        // Берем последний созданный шаблон
        const latestTemplate = data.templates[0];
        
        // Парсим JSON поля если они строки
        const parsedTemplate: ImportTemplate = {
          ...latestTemplate,
          fieldMappings: typeof latestTemplate.fieldMappings === 'string' 
            ? JSON.parse(latestTemplate.fieldMappings) 
            : latestTemplate.fieldMappings || [],
          requiredFields: typeof latestTemplate.requiredFields === 'string'
            ? JSON.parse(latestTemplate.requiredFields)
            : latestTemplate.requiredFields || []
        };

        setTemplate(parsedTemplate);
      } else {
        setTemplate(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки шаблона');
      setTemplate(null);
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (categoryId: string, fields: TemplateField[]): Promise<ImportTemplate> => {
    setLoading(true);
    setError(null);

    try {
      const templateData = {
        name: `Шаблон импорта ${new Date().toLocaleString('ru-RU')}`,
        description: 'Автоматически созданный шаблон импорта',
        catalog_category_id: categoryId,
        field_mappings: fields,
        required_fields: fields.filter(f => f.isRequired),
        calculator_fields: fields.filter(f => f.isCalculator),
        export_fields: fields.filter(f => f.isExport !== false),
        template_config: {
          version: '1.0',
          created_at: new Date().toISOString(),
          auto_generated: true
        },
        validation_rules: {
          strict_mode: true,
          require_all_fields: true
        }
      };

      const response = await fetch('/api/admin/import-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка создания шаблона');
      }

      const newTemplate: ImportTemplate = {
        id: data.template.id,
        name: data.template.name,
        description: data.template.description,
        fieldMappings: fields,
        requiredFields: fields.filter(f => f.isRequired),
        catalogCategoryId: categoryId,
        createdAt: data.template.createdAt,
        updatedAt: data.template.updatedAt
      };

      setTemplate(newTemplate);
      return newTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка создания шаблона';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async (templateId: string, fields: TemplateField[]): Promise<ImportTemplate> => {
    setLoading(true);
    setError(null);

    try {
      const updateData = {
        field_mappings: fields,
        required_fields: fields.filter(f => f.isRequired),
        calculator_fields: fields.filter(f => f.isCalculator),
        export_fields: fields.filter(f => f.isExport !== false)
      };

      const response = await fetch(`/api/admin/import-templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка обновления шаблона');
      }

      const updatedTemplate: ImportTemplate = {
        ...template!,
        fieldMappings: fields,
        requiredFields: fields.filter(f => f.isRequired),
        updatedAt: new Date().toISOString()
      };

      setTemplate(updatedTemplate);
      return updatedTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка обновления шаблона';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    template,
    loading,
    error,
    loadTemplate,
    createTemplate,
    updateTemplate
  };
}

// Хук для анализа файла и извлечения заголовков с примерами
export function useFileAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeFile = async (file: File) => {
    setAnalyzing(true);
    
    try {
      // Читаем файл
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('Файл пустой');
      }

      // Определяем разделитель
      const delimiter = detectDelimiter(lines[0]);
      
      // Парсим заголовки
      const headers = parseCSVLine(lines[0], delimiter);
      
      // Извлекаем примеры значений (первые 10 строк)
      const sampleRows = lines.slice(1, 11).map(line => parseCSVLine(line, delimiter));
      
      // Создаем структуру заголовков с примерами
      const fileHeaders = headers.map((header, index) => {
        const allValues = sampleRows.map(row => row[index] || '').filter(value => value.trim());
        
        // Берем уникальные значения для лучшего представления
        const uniqueValues = [...new Set(allValues)];
        
        return {
          name: header.trim(),
          index,
          sampleValues: uniqueValues.slice(0, 5) // Берем первые 5 уникальных значений
        };
      });

      return {
        headers: fileHeaders,
        totalRows: lines.length - 1,
        delimiter
      };
    } catch (error) {
      throw new Error(`Ошибка анализа файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  return { analyzeFile, analyzing };
}

// Вспомогательные функции
function detectDelimiter(line: string): string {
  const delimiters = [',', ';', '\t', '|'];
  let maxCount = 0;
  let bestDelimiter = ',';

  for (const delimiter of delimiters) {
    const count = line.split(delimiter).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Экранированная кавычка
        current += '"';
        i++; // Пропускаем следующую кавычку
      } else {
        // Переключаем режим кавычек
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // Разделитель вне кавычек
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
