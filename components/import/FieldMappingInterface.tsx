'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';

interface TemplateField {
  fieldName: string;
  displayName: string;
  dataType: string;
  isRequired: boolean;
  isCalculator?: boolean;
  isExport?: boolean;
}

interface FileHeader {
  name: string;
  index: number;
  sampleValues: string[];
}

interface FieldMapping {
  templateField: TemplateField;
  fileHeader: FileHeader | null;
  confidence: number;
  isManual: boolean;
  status: 'mapped' | 'unmapped' | 'conflict';
}

interface FieldMappingInterfaceProps {
  templateFields: TemplateField[];
  fileHeaders: FileHeader[];
  onMappingComplete: (mappings: FieldMapping[]) => void;
  onCancel: () => void;
}

export default function FieldMappingInterface({
  templateFields,
  fileHeaders,
  onMappingComplete,
  onCancel
}: FieldMappingInterfaceProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [autoMappingInProgress, setAutoMappingInProgress] = useState(false);

  // Инициализация маппингов с автоматическим сопоставлением точных совпадений
  useEffect(() => {
    const initialMappings = templateFields.map(field => {
      // Ищем точное совпадение по названию
      const exactMatch = fileHeaders.find(header => 
        header.name.toLowerCase().trim() === field.displayName.toLowerCase().trim() ||
        header.name.toLowerCase().trim() === field.fieldName.toLowerCase().trim()
      );

      if (exactMatch) {
        return {
          templateField: field,
          fileHeader: exactMatch,
          confidence: 1.0,
          isManual: false,
          status: 'mapped' as const
        };
      }

      return {
        templateField: field,
        fileHeader: null,
        confidence: 0,
        isManual: false,
        status: 'unmapped' as const
      };
    });
    
    setMappings(initialMappings);
  }, [templateFields, fileHeaders]);

  // Автоматическое сопоставление полей
  const performAutoMapping = () => {
    setAutoMappingInProgress(true);
    
    setTimeout(() => {
      const updatedMappings = mappings.map(mapping => {
        const { templateField } = mapping;
        
        // Пропускаем уже сопоставленные поля с высокой уверенностью (точные совпадения)
        if (mapping.confidence === 1.0 && mapping.status === 'mapped') {
          return mapping;
        }
        
        // Пропускаем поля, которые были сопоставлены вручную
        if (mapping.isManual) {
          return mapping;
        }
        
        // Ищем наиболее подходящий заголовок файла
        const bestMatch = findBestMatch(templateField, fileHeaders, mapping);
        
        if (bestMatch) {
          return {
            ...mapping,
            fileHeader: bestMatch.header,
            confidence: bestMatch.confidence,
            isManual: false,
            status: bestMatch.confidence > 0.8 ? 'mapped' : 'conflict' as const
          };
        }
        
        return mapping;
      });
      
      setMappings(updatedMappings);
      setAutoMappingInProgress(false);
    }, 1000);
  };

  // Алгоритм поиска наиболее подходящего заголовка
  const findBestMatch = (templateField: TemplateField, headers: FileHeader[], currentMapping?: FieldMapping) => {
    let bestMatch: { header: FileHeader; confidence: number } | null = null;
    
    for (const header of headers) {
      const confidence = calculateSimilarity(templateField, header);
      
      if (confidence > 0.3 && (!bestMatch || confidence > bestMatch.confidence)) {
        // Проверяем, что этот заголовок еще не используется другими маппингами
        const isAlreadyUsed = mappings.some(m => 
          m.fileHeader?.index === header.index && 
          m.templateField.fieldName !== templateField.fieldName
        );
        
        if (!isAlreadyUsed) {
          bestMatch = { header, confidence };
        }
      }
    }
    
    return bestMatch;
  };

  // Расчет схожести между полем шаблона и заголовком файла
  const calculateSimilarity = (templateField: TemplateField, header: FileHeader): number => {
    const templateDisplayName = templateField.displayName.toLowerCase().trim();
    const templateFieldName = templateField.fieldName.toLowerCase().trim();
    const headerName = header.name.toLowerCase().trim();
    
    // СТРОГОЕ точное совпадение - только полное совпадение названий
    if (headerName === templateDisplayName || headerName === templateFieldName) {
      return 1.0;
    }
    
    // Нормализованное совпадение (убираем пробелы, дефисы, подчеркивания)
    const normalizeString = (str: string) => str.replace(/[\s_-]+/g, '').toLowerCase();
    const normalizedHeader = normalizeString(header.name);
    const normalizedDisplayName = normalizeString(templateField.displayName);
    const normalizedFieldName = normalizeString(templateField.fieldName);
    
    if (normalizedHeader === normalizedDisplayName || normalizedHeader === normalizedFieldName) {
      return 0.9; // Высокая, но не максимальная уверенность
    }
    
    // Частичное совпадение - только если одно полностью содержится в другом
    if ((templateDisplayName.includes(headerName) && headerName.length > 3) ||
        (headerName.includes(templateDisplayName) && templateDisplayName.length > 3) ||
        (templateFieldName.includes(headerName) && headerName.length > 3) ||
        (headerName.includes(templateFieldName) && templateFieldName.length > 3)) {
      return 0.7;
    }
    
    // Совпадение ключевых слов - только значимые слова (длиннее 2 символов)
    const getSignificantWords = (str: string) => 
      str.split(/\s+/).filter(word => word.length > 2);
    
    const templateWords = [
      ...getSignificantWords(templateDisplayName), 
      ...getSignificantWords(templateFieldName)
    ];
    const headerWords = getSignificantWords(headerName);
    
    const commonWords = templateWords.filter(word => 
      headerWords.some(hw => hw === word || (hw.includes(word) && word.length > 3))
    );
    
    if (commonWords.length > 0) {
      const ratio = commonWords.length / Math.max(templateWords.length, headerWords.length);
      return 0.5 + ratio * 0.2; // Максимум 0.7
    }
    
    // Анализ типа данных по примерам значений
    const typeMatch = analyzeDataTypeMatch(templateField.dataType, header.sampleValues);
    if (typeMatch > 0.7) {
      return 0.3 + typeMatch * 0.2; // Максимум 0.5
    }
    
    return 0;
  };

  // Анализ соответствия типа данных
  const analyzeDataTypeMatch = (expectedType: string, sampleValues: string[]): number => {
    if (!sampleValues.length) return 0;
    
    const nonEmptyValues = sampleValues.filter(v => v && v.trim());
    if (!nonEmptyValues.length) return 0;
    
    switch (expectedType) {
      case 'number':
        const numericCount = nonEmptyValues.filter(v => !isNaN(Number(v))).length;
        return numericCount / nonEmptyValues.length;
      
      case 'boolean':
        const booleanCount = nonEmptyValues.filter(v => 
          ['true', 'false', 'да', 'нет', '1', '0', 'yes', 'no'].includes(v.toLowerCase())
        ).length;
        return booleanCount / nonEmptyValues.length;
      
      default:
        return 0.5; // Для текстовых полей возвращаем средний балл
    }
  };

  // Ручное сопоставление поля
  const handleManualMapping = (templateFieldName: string, headerIndex: number | null) => {
    setMappings(prev => prev.map(mapping => {
      if (mapping.templateField.fieldName === templateFieldName) {
        const fileHeader = headerIndex !== null ? fileHeaders[headerIndex] : null;
        return {
          ...mapping,
          fileHeader,
          confidence: fileHeader ? 1.0 : 0,
          isManual: true,
          status: fileHeader ? 'mapped' : 'unmapped' as const
        };
      }
      return mapping;
    }));
  };

  // Получение доступных заголовков для выбора
  const getAvailableHeaders = (currentMapping: FieldMapping) => {
    const usedHeaderIndices = mappings
      .filter(m => m.fileHeader && m !== currentMapping)
      .map(m => m.fileHeader!.index);
    
    return fileHeaders.filter(header => !usedHeaderIndices.includes(header.index));
  };

  // Валидация маппингов
  const validateMappings = () => {
    const requiredFields = mappings.filter(m => m.templateField.isRequired);
    const unmappedRequired = requiredFields.filter(m => !m.fileHeader);
    
    return {
      isValid: unmappedRequired.length === 0,
      errors: unmappedRequired.map(m => `Обязательное поле "${m.templateField.displayName}" не сопоставлено`),
      warnings: mappings.filter(m => m.status === 'conflict').map(m => 
        `Низкая уверенность в сопоставлении поля "${m.templateField.displayName}"`
      )
    };
  };

  const validation = validateMappings();
  const mappedCount = mappings.filter(m => m.fileHeader).length;
  const requiredCount = mappings.filter(m => m.templateField.isRequired).length;
  const mappedRequiredCount = mappings.filter(m => m.templateField.isRequired && m.fileHeader).length;

  return (
    <div className="space-y-6">
      {/* Заголовок и статистика */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Сопоставление полей
          </h3>
          <Button
            onClick={performAutoMapping}
            disabled={autoMappingInProgress}
            variant="outline"
          >
            {autoMappingInProgress ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Автоматическое сопоставление
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{mappedCount}/{templateFields.length}</div>
            <div className="text-gray-600">Сопоставлено полей</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{mappedRequiredCount}/{requiredCount}</div>
            <div className="text-gray-600">Обязательных полей</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{fileHeaders.length}</div>
            <div className="text-gray-600">Полей в файле</div>
          </div>
        </div>
      </div>

      {/* Информация об автоматическом сопоставлении */}
      {mappings.filter(m => m.confidence === 1.0 && !m.isManual).length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700 text-sm">
              Автоматически найдено {mappings.filter(m => m.confidence === 1.0 && !m.isManual).length} точных совпадений
            </span>
          </div>
        </div>
      )}

      {/* Список маппингов */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Сопоставление полей</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showPreview ? 'Скрыть превью' : 'Показать превью'}
          </Button>
        </div>

        {mappings.map((mapping, index) => {
          const availableHeaders = getAvailableHeaders(mapping);
          
          return (
            <div
              key={mapping.templateField.fieldName}
              className={`border rounded-lg p-4 ${
                mapping.templateField.isRequired 
                  ? 'border-gray-300 bg-gray-50' 
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* Поле шаблона */}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {mapping.templateField.displayName}
                    </span>
                    {mapping.templateField.isRequired && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        Обязательное
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {mapping.templateField.dataType} • {mapping.templateField.fieldName}
                  </div>
                </div>

                {/* Стрелка и статус */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-2">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    {mapping.status === 'mapped' && (
                      <CheckCircle className="w-4 h-4 text-gray-600" />
                    )}
                    {mapping.status === 'conflict' && (
                      <AlertTriangle className="w-4 h-4 text-gray-500" />
                    )}
                    {mapping.status === 'unmapped' && (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Выбор поля файла */}
                <div>
                  <select
                    value={mapping.fileHeader?.index ?? ''}
                    onChange={(e) => {
                      const headerIndex = e.target.value ? parseInt(e.target.value) : null;
                      handleManualMapping(mapping.templateField.fieldName, headerIndex);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Выберите поле из файла...</option>
                    {availableHeaders.map(header => (
                      <option key={header.index} value={header.index}>
                        {header.name}
                      </option>
                    ))}
                    {mapping.fileHeader && !availableHeaders.find(h => h.index === mapping.fileHeader!.index) && (
                      <option value={mapping.fileHeader.index}>
                        {mapping.fileHeader.name} (выбрано)
                      </option>
                    )}
                  </select>
                  
                  {mapping.fileHeader && (
                    <div className="text-xs mt-1 text-gray-500">
                      {mapping.confidence === 1.0 ? (
                        <span>✓ Точное совпадение</span>
                      ) : mapping.confidence >= 0.9 ? (
                        <span>≈ Почти точное совпадение ({Math.round(mapping.confidence * 100)}%)</span>
                      ) : (
                        <span>
                          Уверенность: {Math.round(mapping.confidence * 100)}%
                          {mapping.isManual && ' (ручное)'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Превью данных */}
              {showPreview && mapping.fileHeader && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-1">Примеры значений:</div>
                  <div className="flex flex-wrap gap-2">
                    {mapping.fileHeader.sampleValues.slice(0, 5).map((value, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {value || '(пусто)'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ошибки и предупреждения */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <div className="space-y-2">
          {validation.errors.map((error, index) => (
            <div key={index} className="bg-gray-50 border border-gray-300 rounded p-3">
              <div className="flex items-start space-x-2">
                <XCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-800 text-sm">{error}</span>
              </div>
            </div>
          ))}
          
          {validation.warnings.map((warning, index) => (
            <div key={index} className="bg-gray-50 border border-gray-200 rounded p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 text-sm">{warning}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Кнопки действий */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        
        <Button
          onClick={() => onMappingComplete(mappings)}
          disabled={!validation.isValid}
          className={validation.isValid ? 'bg-gray-900 hover:bg-gray-800 text-white' : 'bg-gray-300 text-gray-500'}
        >
          Продолжить импорт
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
