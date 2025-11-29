'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Badge } from '../../../../components/ui';
import { Upload, Download, FileText, CheckCircle, XCircle, AlertTriangle, History, RefreshCw, Trash2, Database, Upload as UploadIcon, ArrowRight, ArrowLeft, Settings } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useImportTemplate, useFileAnalysis } from '../../../../hooks/useImportTemplate';
import CatalogTree from '../../../../components/admin/CatalogTree';
import TemplateManager from '../../../../components/admin/TemplateManager';
import TemplateEditor from '../../../../components/admin/TemplateEditor';
import ImportInstructionsCard from '../../../../components/admin/ImportInstructionsCard';
import DoorsTemplateImporter from '../../../../components/admin/DoorsTemplateImporter';
import { checkAndFixFileEncoding, checkFileEncoding } from '../../../../lib/file-encoding-fixer';
import { clientLogger } from '@/lib/logging/client-logger';

interface ImportHistoryItem {
  id: string;
  filename: string;
  imported_count: number;
  error_count: number;
  status: string;
  created_at: string;
}

interface PriceListData {
  headers: string[];
  rows: any[][];
  totalRows: number;
}

interface PhotoData {
  files: File[];
  totalCount: number;
}

interface PropertyMapping {
  fieldName: string;
  displayName: string;
  dataType: 'text' | 'number' | 'select' | 'boolean' | 'image';
  isRequired: boolean;
  isFilterable: boolean;
  isVisible: boolean;
  options?: string[];
  unit?: string;
}

interface CatalogCategory {
  id: string;
  name: string;
  level: number;
  parent_id?: string;
  product_count?: number;
  displayName?: string;
}

type ImportStep = 'catalog' | 'template' | 'upload' | 'validation' | 'import' | 'complete';
type PhotoStep = 'photo-catalog' | 'photo-mapping' | 'photo-upload' | 'photo-complete';
type TabType = 'products' | 'photos' | 'templates';
type ImportType = 'standard' | 'doors-template'; // Тип импорта: обычный или шаблон дверей

export default function CatalogImportPage() {
  // Основные состояния
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [importType, setImportType] = useState<ImportType>('standard'); // Новое состояние для типа импорта
  const [currentStep, setCurrentStep] = useState<ImportStep>('catalog');
  const [currentPhotoStep, setCurrentPhotoStep] = useState<PhotoStep>('photo-catalog');
  const [priceListData, setPriceListData] = useState<PriceListData | null>(null);
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [propertyMappings, setPropertyMappings] = useState<PropertyMapping[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [encodingCheckResult, setEncodingCheckResult] = useState<any>(null);
  const [showEncodingDetails, setShowEncodingDetails] = useState(false);
  const [selectedCatalogCategoryId, setSelectedCatalogCategoryId] = useState<string>('');
  const [selectedPhotoCategoryId, setSelectedPhotoCategoryId] = useState<string>('');
  const [requiredFields, setRequiredFields] = useState<any[]>([]);
  const [completedSteps, setCompletedSteps] = useState<ImportStep[]>([]);
  const [completedPhotoSteps, setCompletedPhotoSteps] = useState<PhotoStep[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  
  // Состояния для редактирования шаблонов
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [templateToEdit, setTemplateToEdit] = useState<any>(null);
  
  // Новые состояния для маппинга
  const [fileHeaders, setFileHeaders] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<any[]>([]);
  
  // Хуки для работы с шаблонами
  const { template, loading: templateLoading, loadTemplate, createTemplate } = useImportTemplate();
  const { analyzeFile, analyzing } = useFileAnalysis();
  
  // Состояния для истории и результатов
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [originalFile, setOriginalFile] = useState<File | null>(null); // Сохраняем оригинальный файл
  const [photoCategorySearchTerm, setPhotoCategorySearchTerm] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoMappingProperty, setPhotoMappingProperty] = useState<string>('Артикул товаров');
  const [photoUploadType, setPhotoUploadType] = useState<'product' | 'property'>('property'); // Новое состояние
  const [existingProductProperties, setExistingProductProperties] = useState<string[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [fieldSettings, setFieldSettings] = useState<Record<string, {
    displayName: string;
    isRequired: boolean;
    dataType: 'text' | 'number' | 'select' | 'boolean' | 'image';
  }>>({});

  useEffect(() => {
    loadImportHistory();
    loadCatalogCategories();
    
    // Проверяем URL параметры для предварительного выбора категории
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      setSelectedCatalogCategoryId(categoryParam);
    }
  }, []);

  // Загружаем свойства существующих товаров при выборе категории
  useEffect(() => {
    if (selectedCatalogCategoryId) {
      loadExistingProductProperties(selectedCatalogCategoryId);
    }
  }, [selectedCatalogCategoryId]);

  // Загружаем свойства существующих товаров при выборе категории для фото
  useEffect(() => {
    if (selectedPhotoCategoryId) {
      loadExistingProductProperties(selectedPhotoCategoryId);
    }
  }, [selectedPhotoCategoryId]);

  const loadImportHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch('/api/catalog/import?action=history');
      const data = await response.json();
      setImportHistory(data);
    } catch (error) {
      clientLogger.error('Error loading import history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadExistingProductProperties = async (categoryId: string) => {
    if (!categoryId) {
      setExistingProductProperties([]);
      return;
    }

    setLoadingProperties(true);
    try {
      const response = await fetch(`/api/catalog/products?categoryId=${categoryId}&limit=10`);
      const data = await response.json();
      
      
      if (data.success && data.products && data.products.length > 0) {
        // Собираем все уникальные свойства из товаров
        const allProperties = new Set<string>();
        
        data.products.forEach((product: any) => {
          if (product.properties_data) {
            try {
              const properties = typeof product.properties_data === 'string' 
                ? JSON.parse(product.properties_data) 
                : product.properties_data;
              
              Object.keys(properties).forEach(key => {
                // Исключаем служебные поля
                if (!['photos', 'id', 'created_at', 'updated_at'].includes(key)) {
                  allProperties.add(key);
                }
              });
            } catch (error) {
              clientLogger.error('Error parsing properties_data:', error);
            }
          }
        });
        
        setExistingProductProperties(Array.from(allProperties).sort());
      } else {
        setExistingProductProperties([]);
      }
    } catch (error) {
      clientLogger.error('Error loading existing product properties:', error);
      setExistingProductProperties([]);
    } finally {
      setLoadingProperties(false);
    }
  };

  const loadCatalogCategories = async () => {
    try {
      const response = await fetch('/api/catalog/categories-flat');
      const data = await response.json();
      
      
      // Используем данные напрямую из нового API
      const categories = data.categories || [];
      
      
      // Просто устанавливаем категории без дополнительной обработки
      setCatalogCategories(categories);
      
      
    } catch (error) {
      clientLogger.error('Error loading catalog categories:', error);
    }
  };

  // Функция для создания CSV из данных прайса
  function createCSVFromPriceListData(rows: any[][], headers: string[]): string {
    let csvContent = '';
    csvContent += headers.map(header => `"${header.replace(/"/g, '""')}"`).join(',') + '\n';
    rows.forEach(row => {
      const csvRow = row.map(cell => {
        if (cell === null || cell === undefined) return '""';
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',');
      csvContent += csvRow + '\n';
    });
    return csvContent;
  }

  const handleCatalogCategorySelect = (categoryId: string) => {
    setSelectedCatalogCategoryId(categoryId);
  };

  const handleCatalogComplete = async () => {
    setCompletedSteps(prev => [...prev, 'catalog']);
    // Если выбран тип импорта "шаблон дверей", переходим сразу к импорту
    if (importType === 'doors-template') {
      setCurrentStep('upload');
      setCompletedSteps(prev => [...prev, 'template']);
    } else {
      setCurrentStep('template');
    }
  };

  const handleTemplateComplete = () => {
    setCompletedSteps(prev => [...prev, 'template']);
    setCurrentStep('upload');
  };

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    setEncodingCheckResult(null);
    
    try {
      
      // Сначала проверяем кодировку файла
      const encodingResult = await checkFileEncoding(file);
      setEncodingCheckResult(encodingResult);
      
      if (encodingResult.hasEncodingIssues) {
        clientLogger.debug('⚠️ Проблемы с кодировкой:', {
          issuesCount: encodingResult.encodingIssues.length,
          sampleIssues: encodingResult.encodingIssues.slice(0, 3)
        });
        
        // Показываем предупреждение пользователю
        const shouldFix = confirm(
          `Обнаружены проблемы с кодировкой в файле (${encodingResult.encodingIssues.length} полей).\n\n` +
          `Примеры проблем:\n${encodingResult.encodingIssues.slice(0, 3).join('\n')}\n\n` +
          `Хотите автоматически исправить кодировку?`
        );
        
        if (shouldFix) {
          const { fixedFile } = await checkAndFixFileEncoding(file);
          
          // Используем исправленный файл для дальнейшей обработки
          await processFile(fixedFile);
        } else {
          await processFile(file);
        }
      } else {
        await processFile(file);
      }
      
    } catch (error) {
      clientLogger.error('❌ Ошибка при обработке файла:', error);
      alert(`Ошибка при обработке файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processFile = async (file: File) => {
    try {
      // Проверяем наличие выбранной категории
      if (!selectedCatalogCategoryId) {
        const errorMsg = 'Пожалуйста, выберите категорию перед загрузкой файла.\n\nВернитесь на шаг "Выбор категории" и выберите категорию для импорта.';
        alert(errorMsg);
        setCurrentStep('catalog');
        return;
      }

      // Сохраняем оригинальный файл для дальнейшего использования при импорте
      setOriginalFile(file);

      clientLogger.debug('📤 Отправка файла на preview:', {
        filename: file.name,
        categoryId: selectedCatalogCategoryId,
        fileSize: file.size,
        fileType: file.type
      });

      // Отправляем файл на preview для проверки SKU
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', selectedCatalogCategoryId);
      formData.append('mode', 'preview');

      const response = await fetch('/api/admin/import/unified', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorData.details?.message || errorMessage;
          
          // Детальная информация об ошибке
          if (errorData.details) {
            if (errorData.details.missingFields) {
              errorMessage += `\n\nОтсутствуют обязательные поля: ${errorData.details.missingFields.join(', ')}`;
            }
            if (errorData.details.availableFields) {
              errorMessage += `\n\nДоступные поля в файле: ${errorData.details.availableFields.slice(0, 10).join(', ')}`;
            }
            if (errorData.details.suggestion) {
              errorMessage += `\n\n${errorData.details.suggestion}`;
            }
          }
        } catch (e) {
          // Если не удалось распарсить JSON, используем базовое сообщение
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // ПЕРВОНАЧАЛЬНАЯ ПРОВЕРКА: SKU из других категорий - КРИТИЧЕСКАЯ ОШИБКА
      if (result.skuCheck && result.skuCheck.crossCategoryWarning) {
        const crossCategorySkus = result.skuCheck.crossCategorySkus || [];
        const sampleSkus = crossCategorySkus.slice(0, 10).map((item: any) => 
          `  • Строка ${item.row}: SKU "${item.sku}" (товар "${item.existingProductName}") в категории "${item.existingCategoryName}"`
        ).join('\n');
        
        const errorMessage = `❌ ОШИБКА: Обнаружены SKU из других категорий!\n\n` +
          `${result.skuCheck.crossCategoryWarning}\n\n` +
          (crossCategorySkus.length > 0 ? `Примеры:\n${sampleSkus}\n\n` : '') +
          `Исправьте SKU в файле и попробуйте снова.\n` +
          `Импорт товаров из других категорий запрещен.`;

        alert(errorMessage);

        // Отменяем импорт
        setPriceListData(null);
        setCurrentStep('upload');
        setCompletedSteps(prev => prev.filter(s => s !== 'upload'));
        return;
      }

      // Проверяем наличие несуществующих SKU (только если нет ошибок с другими категориями)
      if (result.skuCheck && result.skuCheck.notFound > 0) {
        const notFoundCount = result.skuCheck.notFound;
        const notFoundSkus = result.skuCheck.notFoundSkus || [];
        const sampleSkus = notFoundSkus.slice(0, 10).map((item: any) => `  • Строка ${item.row}: ${item.sku}`).join('\n');
        
        const warningMessage = `⚠️ ПРЕДУПРЕЖДЕНИЕ: Обнаружено несуществующих SKU: ${notFoundCount}\n\n` +
          `Эти товары будут созданы как новые при импорте.\n\n` +
          (notFoundSkus.length > 0 ? `Примеры:\n${sampleSkus}\n\n` : '') +
          `Продолжить импорт?\n\n` +
          `• Нажмите "OK" - продолжить импорт (товары будут созданы)\n` +
          `• Нажмите "Отмена" - отменить импорт`;

        const shouldContinue = confirm(warningMessage);

        if (!shouldContinue) {
          // Отменяем импорт
          setPriceListData(null);
          setCurrentStep('upload');
          setCompletedSteps(prev => prev.filter(s => s !== 'upload'));
          return;
        }
      }

      // Парсим файл для отображения
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        alert('Файл должен содержать заголовки и хотя бы одну строку данных');
        return;
      }

      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];
      
      clientLogger.debug('📄 Файл загружен:', {
        filename: file.name,
        headers: headers.length,
        rows: rows.length,
        sampleHeaders: headers.slice(0, 5),
        skuCheck: result.skuCheck
      });

      setPriceListData({
        headers,
        rows,
        totalRows: rows.length
      });

      setCompletedSteps(prev => [...prev, 'upload']);
      setCurrentStep('validation');
    } catch (error) {
      clientLogger.error('❌ Ошибка при обработке файла:', error);
      alert(`Ошибка при обработке файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      throw error;
    }
  };

  const handleValidationComplete = () => {
    setCompletedSteps(prev => [...prev, 'validation']);
    setCurrentStep('import');
  };

  const handlePhotosComplete = async (photoFiles: File[]) => {
    const photoData: PhotoData = {
      files: photoFiles,
      totalCount: photoFiles.length
    };
    
    setPhotoData(photoData);
    
    try {
      setUploadingPhotos(true);
      const formData = new FormData();
      
      photoFiles.forEach((photo) => {
        formData.append('photos', photo);
      });
      
      formData.append('category', selectedPhotoCategoryId);
      formData.append('mapping_property', photoMappingProperty);
      formData.append('upload_type', photoUploadType); // Добавляем тип загрузки

      
      const response = await fetch('/api/admin/import/photos', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
          // Создаем детальный отчет
          let reportMessage = `📸 ЗАГРУЗКА ФОТО ЗАВЕРШЕНА!\n\n`;
          reportMessage += `📁 Загружено файлов: ${result.uploaded || 0}\n`;
          reportMessage += `🔗 Привязано к ${photoUploadType === 'property' ? 'свойствам' : 'товарам'}: ${result.linked || 0}\n`;
          reportMessage += `❌ Ошибок: ${result.errors || 0}\n\n`;
          reportMessage += `⚙️ Настройки:\n`;
          reportMessage += `   • Привязка по: ${photoMappingProperty}\n`;
          reportMessage += `   • Тип загрузки: ${photoUploadType === 'property' ? 'Фото свойств (property_photos)' : 'Фото товаров (properties_data)'}\n\n`;
      
      if (result.uploaded > 0) {
        reportMessage += `✅ Успешно обработано ${result.uploaded} фотографий\n`;
      }
      
      if (result.linked > 0) {
        reportMessage += `🎯 ${result.linked} ${photoUploadType === 'property' ? 'свойств получили новые фото' : 'товаров получили новые фото'}\n`;
      }
      
      if (result.errors > 0) {
        reportMessage += `⚠️ ${result.errors} файлов не удалось обработать\n`;
      }
      
      if (result.details && result.details.length > 0) {
        reportMessage += `\n📋 Детали:\n`;
        result.details.forEach((detail: any) => {
          reportMessage += `• ${detail.fileName}: ${detail.message}\n`;
        });
      }
      
      alert(reportMessage);
      
      setCompletedPhotoSteps(prev => [...prev, 'photo-upload']);
      setCurrentPhotoStep('photo-complete');
      
    } catch (error) {
      clientLogger.error('Error uploading photos:', error);
      alert('Ошибка при загрузке фотографий: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    } finally {
      setUploadingPhotos(false);
    }
  };

  const getStepTitle = () => {
    if (activeTab === 'products') {
      switch (currentStep) {
        case 'catalog': return 'Выбор категории каталога';
        case 'template': return 'Просмотр шаблона';
        case 'upload': return 'Загрузка файла';
        case 'validation': return 'Проверка соответствия';
        case 'import': return 'Импорт товаров';
        case 'complete': return 'Завершение импорта';
        default: return 'Импорт товаров';
      }
    } else if (activeTab === 'photos') {
      switch (currentPhotoStep) {
        case 'photo-catalog': return 'Выбор категории для фото';
        case 'photo-mapping': return 'Настройка привязки';
        case 'photo-upload': return 'Загрузка фотографий';
        case 'photo-complete': return 'Завершение загрузки фото';
        default: return 'Импорт фотографий';
      }
    } else if (activeTab === 'templates') {
      return 'Управление шаблонами';
    }
    return 'Импорт';
  };

  const getStepDescription = () => {
    if (activeTab === 'products') {
      switch (currentStep) {
        case 'catalog': return 'Выберите категорию каталога для привязки товаров';
        case 'template': return 'Просмотрите и скачайте шаблон для выбранной категории';
        case 'upload': return 'Загрузите файл с данными о товарах';
        case 'validation': return 'Проверьте соответствие полей файла шаблону';
        case 'import': return 'Выполните импорт товаров в систему';
        case 'complete': return 'Все данные загружены и настроены';
        default: return '';
      }
    } else if (activeTab === 'photos') {
      switch (currentPhotoStep) {
        case 'photo-catalog': return 'Выберите категорию для загрузки фотографий';
        case 'photo-mapping': return 'Настройте свойство для привязки фотографий к товарам';
        case 'photo-upload': return 'Загрузите фотографии товаров';
        case 'photo-complete': return 'Фотографии успешно загружены';
        default: return '';
      }
    } else if (activeTab === 'templates') {
      return 'Создание, редактирование и управление шаблонами импорта';
    }
    return '';
  };

  const renderStepContent = () => {
    if (activeTab === 'products') {
      return renderProductStepContent();
    } else if (activeTab === 'photos') {
      return renderPhotoStepContent();
    } else if (activeTab === 'templates') {
      // Если редактируем шаблон
      if (editingTemplate) {
        return (
          <TemplateEditor
            templateId={editingTemplate}
            catalogCategoryId={selectedCatalogCategoryId}
            onSave={(template) => {
              setTemplateToEdit(template);
              setEditingTemplate(null);
              // Обновляем шаблон в состоянии
              if (template) {
                setTemplate(template);
              }
            }}
            onCancel={() => {
              setEditingTemplate(null);
              setTemplateToEdit(null);
            }}
          />
        );
      }

      return (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Управление шаблонами</h4>
            <p className="text-gray-700 text-sm">
              Создание, редактирование и управление шаблонами импорта для различных категорий
            </p>
          </div>

          {/* Выбор категории */}
          <div className="bg-white p-4 rounded-lg border">
            <h5 className="font-medium text-gray-900 mb-3">Выберите категорию</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {catalogCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCatalogCategoryId(category.id)}
                  className={`p-3 text-left rounded-lg border transition-colors ${
                    selectedCatalogCategoryId === category.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{category.displayName}</div>
                  <div className="text-sm text-gray-500">
                    {category.product_count} товаров
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Управление шаблоном */}
          {selectedCatalogCategoryId && (
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-medium text-gray-900">
                  Шаблон для категории: {catalogCategories.find(c => c.id === selectedCatalogCategoryId)?.displayName}
                </h5>
                <div className="flex space-x-2">
                  <TemplateManager 
                    catalogCategoryId={selectedCatalogCategoryId}
                    catalogCategoryName={catalogCategories.find(c => c.id === selectedCatalogCategoryId)?.displayName}
                  />
                  <Button
                    onClick={() => setEditingTemplate('edit')}
                    variant="outline"
                    size="sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Редактировать
                  </Button>
                </div>
              </div>

              {/* Информация о шаблоне */}
              {template && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Обязательные поля</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {template.requiredFields?.length || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Поля для калькулятора</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {template.calculatorFields?.length || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700">Поля для экспорта</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {template.exportFields?.length || 0}
                      </div>
                    </div>
                  </div>

                  {/* Список полей */}
                  {template.requiredFields && template.requiredFields.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Поля шаблона:</div>
                      <div className="flex flex-wrap gap-2">
                        {template.requiredFields.map((field: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!template && (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Шаблон не найден</p>
                  <p className="text-sm">Создайте шаблон для этой категории</p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const renderProductStepContent = () => {
    // Если выбран тип импорта "шаблон дверей", показываем специальный компонент после выбора категории
    if (importType === 'doors-template' && selectedCatalogCategoryId && currentStep !== 'catalog') {
      return (
        <DoorsTemplateImporter
          categoryId={selectedCatalogCategoryId}
          onImportComplete={(result) => {
            clientLogger.info('Импорт шаблона дверей завершен', { result });
            if (result.success) {
              setCurrentStep('complete');
              setCompletedSteps(prev => [...prev, 'import', 'complete']);
            }
          }}
        />
      );
    }

    switch (currentStep) {
      case 'catalog':
        return (
          <div className="space-y-6">
            {/* Переключатель типа импорта */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Тип импорта</h3>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importType"
                    value="standard"
                    checked={importType === 'standard'}
                    onChange={(e) => setImportType(e.target.value as ImportType)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 font-medium">Обычный импорт</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importType"
                    value="doors-template"
                    checked={importType === 'doors-template'}
                    onChange={(e) => setImportType(e.target.value as ImportType)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700 font-medium">Шаблон дверей (newdata.xlsx)</span>
                </label>
              </div>
              {importType === 'doors-template' && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Импорт шаблона дверей:</strong> После выбора категории "Межкомнатные двери" вы сможете загрузить файл newdata.xlsx с 6 листами (Модели, Покрытия, Кромка, Опции, Ручки, Ограничители).
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4">
              <h4 className="text-lg font-medium">Выберите категорию каталога:</h4>
              
              {/* Поиск по категориям */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск по названию категории..."
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <div className="absolute right-3 top-2.5 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Дерево категорий */}
              <div className="border rounded-lg max-h-80 overflow-y-auto">
                <CatalogTree
                  categories={catalogCategories}
                  selectedCategoryId={selectedCatalogCategoryId}
                  onCategorySelect={setSelectedCatalogCategoryId}
                  searchTerm={categorySearchTerm}
                />
              </div>

              {/* Информация о выбранной категории */}
              {selectedCatalogCategoryId && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-900">
                        Выбрана категория: {catalogCategories.find(c => c.id === selectedCatalogCategoryId)?.name}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setCurrentStep('upload')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
              <Button
                onClick={handleCatalogComplete}
                disabled={!selectedCatalogCategoryId}
                className={selectedCatalogCategoryId ? 'bg-black hover:bg-gray-800' : ''}
              >
                Продолжить
                <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
        );

      case 'template':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">
                  Выбрана категория: {catalogCategories.find(c => c.id === selectedCatalogCategoryId)?.name}
                </span>
              </div>
            </div>

            {/* Управление шаблоном */}
            <TemplateManager
              catalogCategoryId={selectedCatalogCategoryId}
              catalogCategoryName={catalogCategories.find(c => c.id === selectedCatalogCategoryId)?.name}
            />

            {/* Кнопка продолжения */}
            <div className="flex justify-end">
              <Button
                onClick={handleTemplateComplete}
                className="bg-black hover:bg-gray-800"
              >
                Продолжить к загрузке файла
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-lg font-semibold text-black mb-2">Загрузка прайс-листа</h3>
                <p className="text-gray-600 mb-4 text-sm">Загрузите файл с данными о товарах</p>
                
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  className="hidden"
                  id="price-list-upload"
                />
                <label
                  htmlFor="price-list-upload"
                  className="inline-flex items-center px-4 py-2 bg-black text-white rounded hover:bg-yellow-400 hover:text-black transition-all duration-200 cursor-pointer text-sm"
                >
                  {isProcessing ? 'Обработка...' : 'Выбрать файл'}
                </label>
                
                <p className="text-xs text-gray-500 mt-2">Форматы: .xlsx, .csv</p>
              </div>
            </div>
          </div>
        );

      case 'validation':
        return priceListData ? (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Проверка соответствия полей</h4>
              <p className="text-gray-700 text-sm">
                Проверьте соответствие заголовков файла шаблону категории
              </p>
            </div>

            {/* Информация о проверке кодировки */}
            {encodingCheckResult && (
              <div className={`p-4 rounded-lg border ${
                encodingCheckResult.hasEncodingIssues 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {encodingCheckResult.hasEncodingIssues ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      encodingCheckResult.hasEncodingIssues 
                        ? 'text-yellow-900' 
                        : 'text-green-900'
                    }`}>
                      {encodingCheckResult.hasEncodingIssues 
                        ? `Обнаружены проблемы с кодировкой (${encodingCheckResult.encodingIssues.length} полей)`
                        : 'Проблем с кодировкой не обнаружено'
                      }
                    </span>
                  </div>
                  
                  {encodingCheckResult.hasEncodingIssues && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEncodingDetails(!showEncodingDetails)}
                      className="text-xs"
                    >
                      {showEncodingDetails ? 'Скрыть' : 'Показать'} детали
                    </Button>
                  )}
                </div>
                
                {showEncodingDetails && encodingCheckResult.hasEncodingIssues && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-yellow-800">
                      Примеры проблем с кодировкой:
                    </p>
                    <div className="bg-white p-3 rounded border max-h-32 overflow-y-auto">
                      {encodingCheckResult.encodingIssues.slice(0, 10).map((issue: string, index: number) => (
                        <div key={index} className="text-xs text-gray-700 font-mono">
                          {issue}
                        </div>
                      ))}
                    </div>
                    {encodingCheckResult.encodingIssues.length > 10 && (
                      <p className="text-xs text-yellow-700">
                        ... и еще {encodingCheckResult.encodingIssues.length - 10} проблем
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Кнопка продолжения */}
            <div className="flex justify-end">
              <Button
                onClick={handleValidationComplete}
                className="bg-black hover:bg-gray-800"
              >
                Продолжить к импорту
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка данных...</p>
          </div>
        );

      case 'import':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Импорт товаров</h4>
              <p className="text-gray-700 text-sm">
                Выполните импорт товаров в систему
              </p>
            </div>

            {/* Логика импорта товаров */}
            <div className="text-center py-8">
              <Button
                onClick={async () => {
                  if (!priceListData || !selectedCatalogCategoryId) {
                    alert('Не выбрана категория или нет данных для импорта');
                    return;
                  }
                  
                  // Используем оригинальный файл, если он сохранен
                  if (!originalFile) {
                    alert('Оригинальный файл не найден. Пожалуйста, загрузите файл заново.');
                    return;
                  }
                  
                  try {
                    setIsProcessing(true);
                    
                    // Используем оригинальный файл вместо конвертации в CSV
                    // Это сохраняет кодировку и правильный формат
                    const formData = new FormData();
                    formData.append('file', originalFile);
                    formData.append('category', selectedCatalogCategoryId);
                    formData.append('mode', 'import');
                     
                     const response = await fetch('/api/admin/import/unified', {
                       method: 'POST',
                       body: formData
                     });
                    
                    if (!response.ok) {
                      throw new Error(`HTTP ${response.status}`);
                    }
                    
                    const result = await response.json();
                    
                    alert(`Импорт завершен! Загружено: ${result.imported || 0} товаров`);
                    
                    setCompletedSteps(prev => [...prev, 'import']);
                    setCurrentStep('complete');
                  } catch (error) {
                    clientLogger.error('Ошибка импорта:', error);
                    alert('Ошибка при импорте товаров: ' + (error as Error).message);
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                className="bg-black hover:bg-gray-800"
                disabled={isProcessing}
              >
                {isProcessing ? 'Загрузка...' : 'Загрузить товары'}
                <Upload className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-green-900 mb-2">Импорт завершен!</h3>
              <p className="text-green-700">
                Все данные успешно загружены и настроены
              </p>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setCurrentStep('catalog');
                  setCompletedSteps([]);
                  setPriceListData(null);
                  setPhotoData(null);
                  setSelectedCatalogCategoryId('');
                }}
                className="bg-black hover:bg-gray-800"
              >
                Начать новый импорт
                <RefreshCw className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderPhotoStepContent = () => {
    switch (currentPhotoStep) {
      case 'photo-catalog':
        return (
          <div className="space-y-6">
            <div className="grid gap-4">
              <h4 className="text-lg font-medium">Выберите категорию для загрузки фотографий:</h4>
              
              {/* Поиск по категориям */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск по названию категории..."
                  value={photoCategorySearchTerm}
                  onChange={(e) => setPhotoCategorySearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <div className="absolute right-3 top-2.5 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Дерево категорий */}
              <div className="border rounded-lg max-h-80 overflow-y-auto">
                <CatalogTree
                  categories={catalogCategories}
                  selectedCategoryId={selectedPhotoCategoryId}
                  onCategorySelect={setSelectedPhotoCategoryId}
                  searchTerm={photoCategorySearchTerm}
                />
              </div>

              {selectedPhotoCategoryId && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-blue-900">
                        Выбрана категория: {catalogCategories.find(c => c.id === selectedPhotoCategoryId)?.name}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setCurrentPhotoStep('photo-upload')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад
              </Button>
              <Button
                onClick={() => {
                  setCompletedPhotoSteps(prev => [...prev, 'photo-catalog']);
                  setCurrentPhotoStep('photo-mapping');
                }}
                disabled={!selectedPhotoCategoryId}
                className={selectedPhotoCategoryId ? 'bg-black hover:bg-gray-800' : ''}
              >
                Продолжить
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      case 'photo-mapping':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">
                  Выбрана категория: {catalogCategories.find(c => c.id === selectedPhotoCategoryId)?.name}
                </span>
              </div>
            </div>

            {/* Выбор свойства для привязки */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Свойство для привязки фото к товарам
                </label>
                <select
                  value={photoMappingProperty}
                  onChange={(e) => setPhotoMappingProperty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Выберите свойство...</option>
                  {existingProductProperties.map(prop => (
                    <option key={prop} value={prop}>{prop}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Название файла должно совпадать со значением выбранного свойства
                </p>
              </div>

              {/* Выбор типа загрузки */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип загрузки фото
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="property"
                      checked={photoUploadType === 'property'}
                      onChange={(e) => setPhotoUploadType(e.target.value as 'product' | 'property')}
                      className="mr-2"
                    />
                    <div>
                      <div className="font-medium">Фото свойств товаров (property_photos)</div>
                      <div className="text-xs text-gray-500">Одно фото для всех товаров с одинаковым значением свойства</div>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="product"
                      checked={photoUploadType === 'product'}
                      onChange={(e) => setPhotoUploadType(e.target.value as 'product' | 'property')}
                      className="mr-2"
                    />
                    <div>
                      <div className="font-medium">Фото товаров (properties_data)</div>
                      <div className="text-xs text-gray-500">Индивидуальные фото для каждого товара</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Кнопка продолжения */}
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setCompletedPhotoSteps(prev => [...prev, 'photo-mapping']);
                    setCurrentPhotoStep('photo-upload');
                  }}
                  disabled={!photoMappingProperty}
                  className={photoMappingProperty ? 'bg-black hover:bg-gray-800' : ''}
                >
                  Продолжить к загрузке
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        );

      case 'photo-upload':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Загрузка фотографий</h4>
              <p className="text-gray-700 text-sm">
                Загрузите фотографии товаров. Фото будут привязаны по свойству "{photoMappingProperty}" и сохранены в {photoUploadType === 'property' ? 'архитектуру property_photos' : 'свойства товаров'}
              </p>
            </div>

            {/* Загрузка файлов */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  handlePhotosComplete(files);
                }}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <div className="text-4xl">📸</div>
                <div className="text-lg font-medium text-gray-900">
                  {uploadingPhotos ? 'Загрузка...' : 'Выберите фотографии'}
                </div>
                <div className="text-sm text-gray-500">
                  Поддерживаются форматы: JPG, PNG, GIF, WebP
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Примеры имен: d5.png, d5_1.png, d5_2.png (где d5 - значение свойства "{photoMappingProperty}")
                </div>
              </label>
            </div>

            {/* Кнопка пропуска */}
            <div className="text-center">
              <Button
                variant="secondary"
                onClick={() => {
                  setCompletedPhotoSteps(prev => [...prev, 'photo-upload']);
                  setCurrentPhotoStep('photo-complete');
                }}
                disabled={uploadingPhotos}
              >
                Пропустить загрузку фото
              </Button>
            </div>
          </div>
        );

      case 'photo-complete':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-green-900 mb-2">Загрузка фотографий завершена!</h3>
              <p className="text-green-700">
                Фотографии успешно загружены и привязаны к товарам
              </p>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setCurrentPhotoStep('photo-catalog');
                  setCompletedPhotoSteps([]);
                  setPhotoData(null);
                  setSelectedPhotoCategoryId('');
                }}
                className="bg-black hover:bg-gray-800"
              >
                Начать новую загрузку фото
                <RefreshCw className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Импорт данных</h1>
              <p className="mt-2 text-gray-600">Загрузка и настройка товаров и фотографий в каталог</p>
            </div>
            {/* Инструкция в правом верхнем углу */}
            <div className="flex-shrink-0 ml-6">
              <ImportInstructionsCard />
            </div>
          </div>
        </div>

        {/* Вкладки */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'products'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📦 Импорт товаров
              </button>
              <button
                onClick={() => setActiveTab('photos')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'photos'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📸 Импорт фотографий
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'templates'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 Управление шаблонами
              </button>
            </nav>
          </div>
        </div>

        {/* Основной контент */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Заголовок шага */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-black">{getStepTitle()}</h2>
                <p className="text-gray-600">{getStepDescription()}</p>
              </div>
              {(activeTab === 'products' && currentStep !== 'catalog') || 
               (activeTab === 'photos' && currentPhotoStep !== 'photo-catalog') ? (
                <Button variant="secondary" onClick={() => {
                  if (activeTab === 'products') {
                    setCurrentStep('catalog');
                    setCompletedSteps([]);
                    setPriceListData(null);
                    setSelectedCatalogCategoryId('');
                  } else if (activeTab === 'photos') {
                    setCurrentPhotoStep('photo-catalog');
                    setCompletedPhotoSteps([]);
                    setPhotoData(null);
                    setSelectedPhotoCategoryId('');
                  }
                }}>
                  Начать заново
                </Button>
              ) : null}
            </div>

            {/* Прогресс бар */}
            <div className="flex items-center space-x-4 mb-8">
              {(activeTab === 'products' ? [
                { key: 'catalog', label: 'Категория', icon: '📁' },
                { key: 'template', label: 'Шаблон', icon: '📋' },
                { key: 'upload', label: 'Файл', icon: '📊' },
                { key: 'validation', label: 'Проверка', icon: '🔍' },
                { key: 'import', label: 'Импорт', icon: '⬆️' },
                { key: 'complete', label: 'Готово', icon: '✅' }
              ] : activeTab === 'photos' ? [
                { key: 'photo-catalog', label: 'Категория', icon: '📁' },
                { key: 'photo-mapping', label: 'Привязка', icon: '🔗' },
                { key: 'photo-upload', label: 'Загрузка', icon: '📸' },
                { key: 'photo-complete', label: 'Готово', icon: '✅' }
              ] : []).map((step, index) => {
                const isActive = activeTab === 'products' 
                  ? step.key === currentStep 
                  : step.key === currentPhotoStep;
                const isCompleted = activeTab === 'products'
                  ? completedSteps.includes(step.key as ImportStep)
                  : completedPhotoSteps.includes(step.key as PhotoStep);
                
                return (
                  <div key={step.key} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      isActive 
                        ? 'border-black bg-black text-white' 
                        : isCompleted 
                          ? 'border-green-500 bg-green-500 text-white' 
                          : 'border-gray-300 bg-white text-gray-500'
                    }`}>
                      <span className="text-sm font-medium">{step.icon}</span>
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-black' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                    {index < (activeTab === 'products' ? 5 : activeTab === 'photos' ? 3 : 0) && (
                      <div className={`w-8 h-0.5 mx-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Содержимое шага */}
          <div className="p-6">
            {renderStepContent()}
          </div>
        </div>
      </div>
    </div>
  );
}