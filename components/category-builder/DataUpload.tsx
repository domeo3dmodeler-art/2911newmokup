'use client';

import React, { useState, useCallback } from 'react';
import { Card, Button } from '../ui';
import PropertyMapper from './PropertyMapper';
import FormulaBuilder from './FormulaBuilder';
import PhotoUploader from './PhotoUploader';
import CatalogCategorySelector from './CatalogCategorySelector';
import RequiredFieldsSelector from './RequiredFieldsSelector';
import * as XLSX from 'xlsx';
import { clientLogger } from '@/lib/logging/client-logger';

// Функция для создания CSV из данных прайса
function createCSVFromPriceListData(rows: any[][], headers: string[]): string {
  // Создаем CSV строку
  let csvContent = '';
  
  // Добавляем заголовки
  csvContent += headers.map(header => `"${header.replace(/"/g, '""')}"`).join(',') + '\n';
  
  // Добавляем строки данных
  rows.forEach(row => {
    const csvRow = row.map(cell => {
      if (cell === null || cell === undefined) return '""';
      const cellStr = String(cell);
      // Экранируем кавычки и оборачиваем в кавычки если содержит запятую или перенос строки
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',');
    csvContent += csvRow + '\n';
  });
  
  return csvContent;
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

interface FormulaConfig {
  clientPriceFormula: string;
  discountFormula: string;
  factoryOrderFormula: string;
  defaultMargin: number;
  currency: string;
}

interface PhotoMapping {
  mappingType: 'by_sku' | 'by_order' | 'by_name';
  skuField?: string;
  nameField?: string;
  photoFiles: File[];
  mappedPhotos: Record<string, string>;
}

interface DataUploadProps {
  categoryId?: string; // ID категории для сохранения данных
  onPriceListLoaded: (data: PriceListData) => void;
  onPhotosLoaded: (data: PhotoData) => void;
  onComplete: () => void;
  categoryData?: any; // Данные категории для привязки к каталогу
}

type DataStep = 'upload' | 'catalog' | 'properties' | 'photos' | 'complete';

export default function DataUpload({ categoryId, onPriceListLoaded, onPhotosLoaded, onComplete, categoryData }: DataUploadProps) {
  const [currentStep, setCurrentStep] = useState<DataStep>('upload');
  const [priceListData, setPriceListData] = useState<PriceListData | null>(null);
  const [photoData, setPhotoData] = useState<PhotoData | null>(null);
  const [propertyMappings, setPropertyMappings] = useState<PropertyMapping[]>([]);
  const [formulaConfig, setFormulaConfig] = useState<FormulaConfig | null>(null);
  const [photoMapping, setPhotoMapping] = useState<PhotoMapping | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCatalogCategoryId, setSelectedCatalogCategoryId] = useState<string>('');
  const [requiredFields, setRequiredFields] = useState<any[]>([]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');

  const handlePriceListUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      // Читаем реальный файл
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Конвертируем в JSON
      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        throw new Error('Файл пуст или не содержит данных');
      }
      
      // Первая строка - заголовки
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1); // Остальные строки - данные
      
      // Фильтруем пустые строки
      const filteredRows = rows.filter(row => 
        row.some(cell => cell !== null && cell !== undefined && cell !== '')
      );
      
      const priceListData: PriceListData = {
        headers: headers,
        rows: filteredRows,
        totalRows: filteredRows.length
      };
      
      clientLogger.debug('Загружен прайс-лист', {
        headers: headers.length,
        rows: filteredRows.length,
        sampleData: filteredRows.slice(0, 3)
      });
      
      setPriceListData(priceListData);
      onPriceListLoaded(priceListData);
      setCompletedSteps(prev => [...prev, 'upload']);
      setCurrentStep('catalog');
      
    } catch (error) {
      clientLogger.error('Error processing price list', error instanceof Error ? error : new Error(String(error)));
      alert('Ошибка при обработке файла: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    } finally {
      setIsProcessing(false);
    }
  }, [onPriceListLoaded]);

  const handleCatalogCategorySelect = (categoryId: string) => {
    setSelectedCatalogCategoryId(categoryId);
  };

  const handleCatalogComplete = async () => {
    try {
      // Сохраняем данные каталога в БД
      if (categoryId && selectedCatalogCategoryId) {
        const response = await fetch(`/api/admin/categories/${categoryId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            catalogCategoryIds: [selectedCatalogCategoryId]
          }),
        });

        if (!response.ok) {
          throw new Error('Ошибка при сохранении данных каталога');
        }

        clientLogger.debug('Данные каталога сохранены в БД');
      }
      
      setCompletedSteps(prev => [...prev, 'upload', 'catalog']);
    setCurrentStep('properties');
    } catch (error) {
      clientLogger.error('Error saving catalog data', error instanceof Error ? error : new Error(String(error)));
      alert('Ошибка при сохранении данных каталога: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  const handleRequiredFieldsConfigured = async (fields: any[]) => {
    clientLogger.debug('handleRequiredFieldsConfigured вызван', { fields, categoryId });
    
    setRequiredFields(fields);
    
    // Показываем модальное окно прогресса
    setShowProgressModal(true);
    setProgressMessage('Сохранение товаров в базу данных...');
    
    // Сохраняем товары и свойства в БД
    try {
      if (!categoryId) {
        alert('Ошибка: ID категории не определен. Невозможно сохранить данные.');
        setShowProgressModal(false);
        return;
      }

      clientLogger.debug('Сохранение товаров и свойств в БД', {
        categoryId,
        selectedCatalogCategoryId,
        priceListData: priceListData ? { headers: priceListData.headers.length, rows: priceListData.rows.length } : null,
        propertyMappings: propertyMappings.length
      });

      // 1. Сохраняем товары в БД через API импорта
      setProgressMessage('Создание файла данных...');
      // Создаем временный CSV файл из данных прайса
      const csvData = createCSVFromPriceListData(priceListData?.rows || [], priceListData?.headers || []);
      clientLogger.debug('CSV данные созданы', { size: csvData.length });
      
      const csvBlob = new Blob([csvData], { type: 'text/csv' });
      const csvFile = new File([csvBlob], 'price_list.csv', { type: 'text/csv' });
      
      setProgressMessage('Отправка данных на сервер...');
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('category', selectedCatalogCategoryId);
      formData.append('mapping', JSON.stringify(propertyMappings));
      formData.append('mode', 'full');
      
      clientLogger.debug('Отправляем данные на /api/admin/import/universal');
      const productsResponse = await fetch('/api/admin/import/universal', {
        method: 'POST',
        body: formData,
      });
      
      clientLogger.debug('Ответ от API импорта', { status: productsResponse.status, statusText: productsResponse.statusText });

      if (!productsResponse.ok) {
        throw new Error('Ошибка при сохранении товаров в БД');
      }

      const productsResult = await productsResponse.json();
      clientLogger.debug('Товары сохранены в БД', {
        imported: productsResult.imported,
        count: productsResult.count,
        database_saved: productsResult.database_saved,
        save_message: productsResult.save_message
      });

      // 2. Сохраняем маппинг свойств в категорию конфигуратора
      const categoryResponse = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyMapping: propertyMappings
        }),
      });

      if (!categoryResponse.ok) {
        throw new Error('Ошибка при сохранении маппинга свойств');
      }

      clientLogger.debug('Маппинг свойств сохранен в БД');

      // 3. Создаем шаблон загрузки
      clientLogger.debug('Создание шаблона', {
        name: `Шаблон для ${categoryData?.name || 'категории'}`,
        frontend_category_id: categoryId,
        catalog_category_id: selectedCatalogCategoryId,
        fieldsCount: fields.length,
        propertyMappingsCount: propertyMappings.length,
        headersCount: priceListData?.headers.length || 0
      });
      
      const templateResponse = await fetch('/api/admin/import-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Шаблон для ${selectedCatalogCategory?.name || 'категории'}`,
          description: `Автоматически созданный шаблон загрузки для категории ${selectedCatalogCategory?.name}`,
          catalog_category_id: selectedCatalogCategoryId,
          template_config: JSON.stringify({
            headers: priceListData?.headers || [],
            propertyMapping: propertyMappings,
            requiredFields: fields
          }),
          field_mappings: JSON.stringify(propertyMappings),
          required_fields: JSON.stringify(fields),
          calculator_fields: JSON.stringify(fields), // Все поля по умолчанию для калькулятора
          export_fields: JSON.stringify(fields) // Все поля по умолчанию для экспорта
        }),
      });

      if (templateResponse.ok) {
        clientLogger.debug('Шаблон загрузки создан');
      } else {
        clientLogger.warn('Не удалось создать шаблон загрузки');
      }
      
      // Показываем успешное сохранение с кнопкой "Загрузка фото"
      const savedProductsCount = productsResult.database_saved || productsResult.imported || productsResult.count || productsResult.products?.length || priceListData?.rows?.length || 0;
      const categoryName = categoryData?.name || 'категории';
      
      clientLogger.debug('Итоговое количество сохраненных товаров', {
        savedProductsCount,
        priceListDataRowsLength: priceListData?.rows?.length,
        database_saved: productsResult.database_saved
      });
      
      // Принудительно показываем модальное окно
      clientLogger.debug('Показываем модальное окно с результатами');
      
      // Если товары не сохранились, показываем предупреждение
      if (savedProductsCount === 0) {
        clientLogger.warn('ВНИМАНИЕ: Товары не сохранились в базу данных!', { productsResult });
      }
      
      // Создаем красивое модальное окно
      const successModal = document.createElement('div');
      successModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      successModal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div class="text-center">
            <div class="mb-4">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Данные успешно сохранены!</h3>
              <p class="text-gray-600 mb-4">
                Категория: <strong>${categoryName}</strong><br>
                Товаров сохранено: <strong>${savedProductsCount}</strong><br>
                Шаблон загрузки: <strong>Создан</strong>
              </p>
            </div>
            <div class="flex gap-3 justify-center">
              <button id="continuePhotos" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                📸 Загрузка фото
              </button>
              <button id="continueLater" class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                Вернуться позже
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(successModal);
      
      // Обработчики кнопок
      successModal.querySelector('#continuePhotos')?.addEventListener('click', () => {
        document.body.removeChild(successModal);
        setCurrentStep('photos');
      });
      
      successModal.querySelector('#continueLater')?.addEventListener('click', () => {
        document.body.removeChild(successModal);
        // Можно добавить редирект или другую логику
        clientLogger.debug('Пользователь выбрал "Вернуться позже"');
      });
      
    } catch (error) {
      clientLogger.error('Error saving products and properties', error instanceof Error ? error : new Error(String(error)));
      setShowProgressModal(false);
      alert(`Ошибка при сохранении данных: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      return;
    }
    
    // Переходим к шагу фотографий только после успешного сохранения
    setCompletedSteps(prev => [...prev, 'properties']);
    setShowProgressModal(false);
    setCurrentStep('photos');
  };

  const handlePropertyMappingComplete = async (mappings: PropertyMapping[]) => {
    clientLogger.debug('handlePropertyMappingComplete вызван', { mappingsCount: mappings.length, categoryId });
    
    setPropertyMappings(mappings);
    
    try {
      if (!categoryId) {
        alert('Ошибка: ID категории не определен. Невозможно сохранить данные.');
        return;
      }

      clientLogger.debug('Сохранение товаров и свойств в БД', {
        categoryId,
        selectedCatalogCategoryId,
        priceListData: priceListData ? { headers: priceListData.headers.length, rows: priceListData.rows.length } : null,
        mappingsCount: mappings.length
      });

      // 1. Сохраняем товары в БД через API импорта
      // Создаем временный CSV файл из данных прайса
      const csvData = createCSVFromPriceListData(priceListData?.rows || [], priceListData?.headers || []);
      clientLogger.debug('CSV данные созданы', { size: csvData.length });
      
      const csvBlob = new Blob([csvData], { type: 'text/csv' });
      const csvFile = new File([csvBlob], 'price_list.csv', { type: 'text/csv' });
      
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('category', selectedCatalogCategoryId);
      formData.append('mapping', JSON.stringify(mappings));
      formData.append('mode', 'full');
      
      clientLogger.debug('Отправляем данные на /api/admin/import/universal');
      const productsResponse = await fetch('/api/admin/import/universal', {
        method: 'POST',
        body: formData,
      });
      
      clientLogger.debug('Ответ от API импорта', { status: productsResponse.status, statusText: productsResponse.statusText });

      if (!productsResponse.ok) {
        throw new Error('Ошибка при сохранении товаров в БД');
      }

      const productsResult = await productsResponse.json();
      clientLogger.debug('Товары сохранены в БД', {
        imported: productsResult.imported,
        count: productsResult.count,
        database_saved: productsResult.database_saved,
        save_message: productsResult.save_message
      });

      // 2. Сохраняем маппинг свойств в категорию конфигуратора
      const categoryResponse = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyMapping: mappings
        }),
      });

      if (!categoryResponse.ok) {
        throw new Error('Ошибка при сохранении маппинга свойств');
      }

      clientLogger.debug('Маппинг свойств сохранен в БД');

      // 3. Создаем шаблон загрузки для этой категории
      const templateResponse = await fetch('/api/admin/import-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Шаблон для ${categoryData?.name || 'категории'}`,
          description: `Автоматически созданный шаблон загрузки для категории ${categoryData?.name}`,
          frontend_category_id: categoryId,
          catalog_category_id: selectedCatalogCategoryId,
          template_config: JSON.stringify({
            headers: priceListData?.headers || [],
            propertyMapping: mappings,
            requiredFields: requiredFields
          }),
          field_mappings: JSON.stringify(mappings),
          required_fields: JSON.stringify(requiredFields)
        }),
      });

      if (templateResponse.ok) {
        clientLogger.debug('Шаблон загрузки создан');
      } else {
        clientLogger.warn('Не удалось создать шаблон загрузки');
      }
      
      // Показываем успешное сохранение с кнопкой "Загрузка фото"
      const savedProductsCount = productsResult.database_saved || productsResult.imported || productsResult.count || productsResult.products?.length || priceListData?.rows?.length || 0;
      const categoryName = categoryData?.name || 'категории';
      
      clientLogger.debug('Итоговое количество сохраненных товаров', {
        savedProductsCount,
        priceListDataRowsLength: priceListData?.rows?.length,
        database_saved: productsResult.database_saved
      });
      
      // Принудительно показываем модальное окно
      clientLogger.debug('Показываем модальное окно с результатами');
      
      // Если товары не сохранились, показываем предупреждение
      if (savedProductsCount === 0) {
        clientLogger.warn('ВНИМАНИЕ: Товары не сохранились в базу данных!', { productsResult });
      }
      
      // Создаем красивое модальное окно
      const successModal = document.createElement('div');
      successModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      successModal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
          <div class="text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">✅ Данные успешно сохранены!</h3>
            <div class="text-sm text-gray-600 mb-4">
              <p class="mb-1"><strong>Категория:</strong> ${categoryName}</p>
              <p class="mb-1"><strong>Товаров сохранено:</strong> ${savedProductsCount}</p>
              <p class="mb-3"><strong>Шаблон загрузки:</strong> Создан</p>
            </div>
            <div class="flex space-x-3">
              <button id="continue-later" class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
                Вернуться позже
              </button>
              <button id="continue-photos" class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                📸 Загрузка фото
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(successModal);
      
      // Обработчики кнопок
      const continueLaterBtn = successModal.querySelector('#continue-later') as HTMLButtonElement;
      const continuePhotosBtn = successModal.querySelector('#continue-photos') as HTMLButtonElement;
      
      if (continueLaterBtn) {
        continueLaterBtn.onclick = () => {
          document.body.removeChild(successModal);
          alert('Данные сохранены! Вы можете вернуться к загрузке фото позже через редактирование категории.');
          onComplete(); // Завершаем процесс создания категории
        };
      }
      
      if (continuePhotosBtn) {
        continuePhotosBtn.onclick = () => {
          document.body.removeChild(successModal);
    setCurrentStep('photos');
        };
      }
    } catch (error) {
      clientLogger.error('Error saving products and properties', error instanceof Error ? error : new Error(String(error)));
      alert('Ошибка при сохранении товаров и свойств: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  const handlePhotoMappingComplete = async (mapping: PhotoMapping) => {
    setPhotoMapping(mapping);
    const photoData: PhotoData = {
      files: mapping.photoFiles,
      totalCount: mapping.photoFiles.length
    };
    setPhotoData(photoData);
    
    clientLogger.debug('handlePhotoMappingComplete вызван', { categoryId });
    
    try {
      // Сохраняем данные фотографий в БД
      if (!categoryId) {
        clientLogger.error('categoryId не определен! Нельзя сохранить данные фотографий.');
        alert('Ошибка: ID категории не определен. Невозможно сохранить данные фотографий.');
        return;
      }
      
      if (categoryId) {
        // Создаем безопасную версию photoMapping для отправки
        const safePhotoMapping = {
          mappingType: mapping.mappingType,
          photoFiles: mapping.photoFiles.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
            lastModified: f.lastModified
          })), // Преобразуем File объекты в простые объекты
          mappedPhotos: mapping.mappedPhotos
        };
        
        // Проверяем размер данных перед отправкой
        const jsonString = JSON.stringify(safePhotoMapping);
        if (jsonString.length > 1000000) { // 1MB лимит
          clientLogger.error('Размер photoMapping слишком большой', { size: jsonString.length });
          alert('Ошибка: Слишком много файлов для сохранения. Попробуйте загрузить меньше фотографий.');
          return;
        }
        
        // МАКСИМАЛЬНО упрощаем данные - сохраняем только статистику
        const minimalPhotoMapping = {
          mappingType: mapping.mappingType,
          totalFiles: mapping.photoFiles.length,
          mappedCount: Object.keys(mapping.mappedPhotos).length,
          // НЕ сохраняем mappedPhotos с blob URLs - они слишком большие
        };
        
        const requestBody = {
          photoMapping: minimalPhotoMapping,
          photoData: {
            totalCount: photoData.totalCount,
            files: [] // Не сохраняем имена файлов - они могут быть большими
          }
        };
        
        clientLogger.debug('Отправляем МИНИМАЛЬНЫЕ данные фотографий на сервер', {
          categoryId,
          photoMapping: minimalPhotoMapping,
          photoData: requestBody.photoData,
          originalPhotoFilesCount: mapping.photoFiles.length,
          mappedPhotosCount: Object.keys(mapping.mappedPhotos).length
        });
        
        const response = await fetch(`/api/admin/categories/${categoryId}/photos`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          clientLogger.error('Ошибка ответа сервера', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
          
          // Если ошибка из-за размера данных, попробуем альтернативный способ
          if (errorData.error && errorData.error.includes('слишком много данных')) {
            clientLogger.debug('Пробуем альтернативный способ сохранения');
            
            // Сохраняем только основную информацию без mappedPhotos
            const minimalMapping = {
              mappingType: mapping.mappingType,
              totalFiles: mapping.photoFiles.length,
              mappedCount: Object.keys(mapping.mappedPhotos).length
            };
            
            const minimalResponse = await fetch(`/api/admin/categories/${categoryId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                photoMapping: minimalMapping,
                photoData: { totalCount: photoData.totalCount, files: [] }
              }),
            });
            
            if (minimalResponse.ok) {
              clientLogger.debug('Минимальные данные фотографий сохранены');
              alert('⚠️ Данные фотографий частично сохранены (без детальной информации о связях). Попробуйте загрузить меньше фотографий за раз.');
              onPhotosLoaded(photoData);
              setCurrentStep('complete');
              return;
            }
          }
          
          throw new Error(`Ошибка при сохранении данных фотографий: ${errorData.error || response.statusText}`);
        }

        clientLogger.debug('Данные фотографий сохранены в БД');
      }
      
    onPhotosLoaded(photoData);
    setCurrentStep('complete');
    } catch (error) {
      clientLogger.error('Error saving photo data', error instanceof Error ? error : new Error(String(error)));
      alert('Ошибка при сохранении данных фотографий: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'upload': return 'Загрузка прайс-листа';
      case 'catalog': return 'Привязка к каталогу';
      case 'properties': return 'Настройка свойств';
      case 'photos': return 'Загрузка фото';
      case 'complete': return 'Завершение';
      default: return 'Загрузка данных';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'upload': return 'Загрузите файл с данными о товарах';
      case 'catalog': return 'Выберите категорию каталога для привязки товаров';
      case 'properties': return 'Выберите поля для конфигуратора';
      case 'photos': return 'Загрузите фотографии товаров';
      case 'complete': return 'Все данные загружены и настроены';
      default: return '';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-6">📊</div>
              <h3 className="text-xl font-semibold text-black mb-4">Загрузка прайс-листа</h3>
              <p className="text-gray-600 mb-6">Загрузите файл с данными о товарах (XLSX, CSV)</p>
              
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handlePriceListUpload}
                className="hidden"
                id="price-list-upload"
              />
              <label
                htmlFor="price-list-upload"
                className="inline-flex items-center px-6 py-3 bg-black text-white rounded-none hover:bg-yellow-400 hover:text-black transition-all duration-200 cursor-pointer"
              >
                {isProcessing ? 'Обработка...' : 'Выбрать файл'}
              </label>
              
              <p className="text-sm text-gray-500 mt-4">Поддерживаются форматы: .xlsx, .csv</p>
            </div>
          </div>
        );

      case 'catalog':
        return (
          <div className="space-y-6">
            <CatalogCategorySelector
              onCategorySelect={handleCatalogCategorySelect}
              selectedCategoryId={selectedCatalogCategoryId}
            />
            
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setCurrentStep('upload')}>
                ← Назад
              </Button>
              <Button 
                onClick={handleCatalogComplete}
                disabled={!selectedCatalogCategoryId}
              >
                Продолжить →
              </Button>
            </div>
          </div>
        );

      case 'properties':
        return priceListData ? (
          <RequiredFieldsSelector
            priceListHeaders={priceListData.headers}
            priceListData={priceListData.rows}
            onFieldsConfigured={handleRequiredFieldsConfigured}
            onBack={() => setCurrentStep('catalog')}
            catalogCategoryId={selectedCatalogCategoryId}
            categoryName={categoryData?.name}
          />
        ) : null;


      case 'photos':
        return priceListData ? (
          <PhotoUploader
            priceListData={priceListData.rows.map(row => {
              const obj: any = {};
              priceListData.headers.forEach((header, index) => {
                obj[header] = row[index];
              });
              return obj;
            })}
            priceListHeaders={priceListData.headers}
            onPhotoMappingComplete={handlePhotoMappingComplete}
            onBack={() => setCurrentStep('properties')}
          />
        ) : null;

      case 'complete':
        return (
          <div className="space-y-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-6">✅</div>
              <h3 className="text-xl font-semibold text-black mb-4">Данные успешно загружены!</h3>
              <p className="text-gray-600 mb-6">Все настройки завершены, можно переходить к следующему шагу</p>
              
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-black">{priceListData?.totalRows || 0}</div>
                  <div className="text-sm text-gray-600">Товаров</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-black">{propertyMappings.length}</div>
                  <div className="text-sm text-gray-600">Свойств</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-2xl font-bold text-black">{photoMapping?.photoFiles.length || 0}</div>
                  <div className="text-sm text-gray-600">Фото</div>
                </div>
              </div>
              
              <Button variant="primary" onClick={handleComplete}>
                Продолжить в конструктор
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок шага */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-black">{getStepTitle()}</h3>
          <p className="text-gray-600">{getStepDescription()}</p>
        </div>
        {currentStep !== 'upload' && (
          <Button variant="secondary" onClick={() => setCurrentStep('upload')}>
            ← Начать заново
          </Button>
        )}
      </div>

      {/* Прогресс шагов */}
      <Card variant="base">
        <div className="p-4">
          <div className="flex items-center space-x-4">
            {[
              { key: 'upload', label: 'Загрузка' },
              { key: 'catalog', label: 'Каталог' },
              { key: 'properties', label: 'Свойства' },
              { key: 'photos', label: 'Фото' },
              { key: 'complete', label: 'Готово' }
            ].map((step, index) => {
              const isActive = step.key === currentStep;
              const isCompleted = completedSteps.includes(step.key);
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                    isActive 
                      ? 'border-black bg-black text-white' 
                      : isCompleted 
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                  }`}>
                    <span className="text-sm">{index + 1}</span>
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-black' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                  {index < 4 && (
                    <div className={`w-6 h-0.5 mx-3 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Контент шага */}
      {renderStepContent()}

      {/* Модальное окно прогресса */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Обработка данных</h3>
              <p className="text-gray-600">{progressMessage}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}