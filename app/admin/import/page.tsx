// app/admin/import/page.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { clientLogger } from '@/lib/logging/client-logger';

type Category = { 
  id: string; 
  name: string; 
  description: string; 
  icon: string; 
  properties: FieldMapping[];
  import_mapping: Record<string, string>;
};

type FieldMapping = {
  key: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'url';
  required: boolean;
  unit?: string;
  options?: string[];
};

type PriceSettings = {
  calculatorFields: string[];
  frontendPrice: string;
  exportFields: string[];
};

export default function UniversalImportPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [showManager, setShowManager] = useState(false);
  const [priceSettings, setPriceSettings] = useState<PriceSettings>({
    calculatorFields: [],
    frontendPrice: '',
    exportFields: []
  });
  const [loading, setLoading] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<FileList | null>(null);
  const [photoFolderUrl, setPhotoFolderUrl] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      clientLogger.debug('Fetching categories...');
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      const response = await fetch('/api/categories', {
        headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        clientLogger.error('Error fetching categories', { status: response.status });
        setCategories([]);
        return;
      }
      
      const data = await response.json();
      // apiSuccess возвращает { success: true, data: { categories: ... } }
      const responseData = data && typeof data === 'object' && 'data' in data
        ? (data as { data: { categories?: Category[] } }).data
        : null;
      const categories = responseData && 'categories' in responseData && Array.isArray(responseData.categories)
        ? responseData.categories
        : (data.categories || []);
      
      clientLogger.debug('Categories fetched', { count: categories.length });
      
      setCategories(categories);
      
      // Автоматически выбираем категорию из URL параметра или первую доступную
      if (data.categories?.length > 0) {
        let categoryToSelect = null;
        
        if (categoryParam) {
          // Ищем категорию по параметру из URL
          categoryToSelect = categories.find((cat: Category) => cat.id === categoryParam);
          clientLogger.debug('Category from URL param', { categoryParam, found: categoryToSelect });
        }
        
        if (!categoryToSelect) {
          // Если не найдена по параметру, выбираем первую
          categoryToSelect = categories[0];
          clientLogger.debug('Auto-selecting first category', { category: categoryToSelect });
        }
        
        setSelectedCategory(categoryToSelect);
      }
    } catch (error) {
      clientLogger.error('Error fetching categories:', error);
    }
  }, [categoryParam]);

  useEffect(() => { 
    fetchCategories();
  }, [fetchCategories]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      clientLogger.debug('No file selected');
      return;
    }

    clientLogger.debug('=== FILE UPLOAD START ===');
    clientLogger.debug('File selected:', {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      lastModified: selectedFile.lastModified
    });
    
    setFile(selectedFile);
    setLoading(true);
    
    try {
      // Проверяем, что категория выбрана
      if (!selectedCategory) {
        clientLogger.error('No category selected');
        alert('Сначала выберите категорию');
        setFile(null);
        setLoading(false);
        return;
      }

      // Отправляем файл на сервер для чтения заголовков
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', selectedCategory.id);
      formData.append('mode', 'headers'); // Режим только заголовки
      
      clientLogger.debug('FormData prepared:', {
        file: selectedFile.name,
        category: selectedCategory.id,
        mode: 'headers'
      });
      
      clientLogger.debug('Sending request to', { url: '/api/admin/import/universal' });
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      const response = await fetch('/api/admin/import/universal', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData
      });
      
      clientLogger.debug('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      const data = await response.json();
      clientLogger.debug('Response data:', data);
      
      if (response.ok && data.headers) {
        clientLogger.debug('SUCCESS: Headers received:', data.headers);
        setFileHeaders(data.headers);
        setShowManager(true);
      } else {
        clientLogger.error('ERROR: Failed to get headers:', data);
        alert(`Ошибка чтения файла: ${data.error || 'Неизвестная ошибка'}`);
        setFile(null);
      }
    } catch (error) {
      clientLogger.error('EXCEPTION: Error reading file:', error);
      alert('Ошибка при чтении файла: ' + error);
      setFile(null);
    } finally {
      setLoading(false);
      clientLogger.debug('=== FILE UPLOAD END ===');
    }
  };

  const handleSettingsChange = (type: keyof PriceSettings, value: string[]) => {
    setPriceSettings(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleImport = async () => {
    if (!file || !priceSettings.frontendPrice || !selectedCategory) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', selectedCategory.id);
      formData.append('settings', JSON.stringify(priceSettings));
      
      const response = await fetch('/api/admin/import/universal', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(`Импорт завершен успешно! Импортировано: ${result.imported || 0} товаров`);
        setShowManager(false);
        setFile(null);
        setFileHeaders([]);
      } else {
        alert(`Ошибка импорта: ${result.error}`);
      }
    } catch (error) {
      alert('Ошибка при импорте файла');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableFields = () => {
    if (!selectedCategory) return [];
    clientLogger.debug('getAvailableFields - selectedCategory', { selectedCategory });
    clientLogger.debug('getAvailableFields - fileHeaders', { fileHeaders });
    clientLogger.debug('getAvailableFields - selectedCategory.properties', { properties: selectedCategory.properties });
    
    const availableFields = selectedCategory.properties.filter(field => fileHeaders.includes(field.key));
    clientLogger.debug('getAvailableFields - availableFields', { availableFields });
    return availableFields;
  };

  const getUnmappedHeaders = () => {
    if (!selectedCategory) return fileHeaders;
    return fileHeaders.filter(header => !selectedCategory.properties.some(field => field.key === header));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Domeo</h1>
                <p className="text-xs text-gray-600">Configurators</p>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 mx-2 text-lg">•</span>
                <h2 className="text-lg font-semibold text-gray-800">Импорт прайсов</h2>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link 
                href="/admin"
                className="px-4 py-2 bg-transparent border border-gray-300 text-gray-700 rounded-none hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-medium"
              >
                Назад в админку
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {!showManager ? (
          /* Шаг 1: Выбор категории и загрузка файла */
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Импорт прайса</h1>
              <p className="text-gray-600">Выберите категорию товаров и загрузите файл с прайсом</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Выбор категории */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Категория товаров</h3>
                  <Link
                    href="/admin/categories"
                    className="px-3 py-1 bg-black text-white text-sm rounded-none hover:bg-yellow-400 hover:text-black transition-all duration-200 font-medium"
                  >
                    Управление
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {categories.map(category => (
                    <label key={category.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={selectedCategory?.id === category.id}
                        onChange={() => setSelectedCategory(category)}
                        className="mr-3"
                      />
                      <div>
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{category.icon}</span>
                          <span className="font-medium text-gray-900">{category.name}</span>
                        </div>
                        <p className="text-sm text-gray-600">{category.description}</p>
                        <p className="text-xs text-gray-500">
                          {category.properties.length} свойств
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Загрузка файла */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Загрузить файлы</h3>
                <div className="space-y-4">
                  {/* Загрузка прайса */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Файл прайса
                    </label>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload}
                      disabled={!selectedCategory}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  
                  {/* Загрузка фото */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Фото товаров
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setPhotoFiles(e.target.files)}
                      disabled={!selectedCategory}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {photoFiles && (
                      <p className="mt-2 text-sm text-gray-600">
                        Выбрано файлов: {photoFiles.length}
                      </p>
                    )}
                  </div>
                  
                  {/* Ссылка на папку с фото */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Или ссылка на папку с фото
                    </label>
                    <input
                      type="url"
                      value={photoFolderUrl}
                      onChange={(e) => setPhotoFolderUrl(e.target.value)}
                      placeholder="https://example.com/photos/"
                      disabled={!selectedCategory}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {file && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-600">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setFile(null);
                            setFileHeaders([]);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
          </div>
        </div>
      )}

                  <div className="text-sm text-gray-600">
                    <p>Поддерживаемые форматы: Excel (.xlsx, .xls), CSV (.csv)</p>
                    {!selectedCategory && (
                      <p className="text-yellow-600 mt-1">⚠️ Сначала выберите категорию</p>
                    )}
        </div>
        </div>
        </div>
      </div>

          </div>
        ) : (
          /* Шаг 2: Менеджер загрузки прайса */
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Менеджер загрузки прайса</h1>
              <p className="text-gray-600">
                Настройте параметры импорта для категории "{selectedCategory?.name}" и файла: {file?.name}
              </p>
              
              {/* Отладочная информация */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Отладочная информация:</h4>
                <p className="text-sm text-gray-600">
                  <strong>Заголовки файла:</strong> {fileHeaders.length > 0 ? fileHeaders.join(', ') : 'Не загружены'}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Доступные поля:</strong> {getAvailableFields().length} из {selectedCategory?.properties.length || 0}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Неиспользуемые поля:</strong> {getUnmappedHeaders().length}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1. Поля для калькулятора */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Поля для калькулятора</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Выберите поля, которые будут использоваться для расчета цен в калькуляторе
                </p>
                
                <div className="space-y-2">
                  {fileHeaders.length > 0 ? (
                    fileHeaders.map(header => (
                      <label key={header} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={priceSettings.calculatorFields.includes(header)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleSettingsChange('calculatorFields', [...priceSettings.calculatorFields, header]);
                            } else {
                              handleSettingsChange('calculatorFields', priceSettings.calculatorFields.filter(f => f !== header));
                            }
                          }}
                          className="mr-3"
                        />
                        <span className="text-sm text-gray-700">{header}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Заголовки файла не загружены</p>
            )}
          </div>
          </div>
          
              {/* 2. Цена для фронта */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Цена для корзины</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Выберите поле, которое будет отображаться как цена в корзине
                </p>
                
                <div className="space-y-2">
                  {fileHeaders.length > 0 ? (
                    fileHeaders.map(header => (
                      <label key={header} className="flex items-center">
                        <input
                          type="radio"
                          name="frontendPrice"
                          value={header}
                          checked={priceSettings.frontendPrice === header}
                          onChange={(e) => handleSettingsChange('frontendPrice', [e.target.value])}
                          className="mr-3"
                        />
                        <span className="text-sm text-gray-700">{header}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Заголовки файла не загружены</p>
                  )}
                </div>
                    </div>

              {/* 3. Поля для экспорта */}
              <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">3. Поля для экспорта</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Выберите поля, которые будут включены в экспорт "Заказ поставщику"
                </p>
                
                <div className="space-y-2">
                  {fileHeaders.length > 0 ? (
                    fileHeaders.map(header => (
                      <label key={header} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={priceSettings.exportFields.includes(header)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleSettingsChange('exportFields', [...priceSettings.exportFields, header]);
                            } else {
                              handleSettingsChange('exportFields', priceSettings.exportFields.filter(f => f !== header));
                            }
                          }}
                          className="mr-3"
                        />
                        <span className="text-sm text-gray-700">{header}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Заголовки файла не загружены</p>
                  )}
                </div>
              </div>
            </div>

            {/* Неиспользованные поля */}
            {getUnmappedHeaders().length > 0 && (
              <div className="bg-yellow-50 rounded-xl shadow-md p-6 border border-yellow-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Неиспользованные поля</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Эти поля найдены в файле, но не соответствуют схеме категории "{selectedCategory?.name}":
                </p>
                <div className="flex flex-wrap gap-2">
                  {getUnmappedHeaders().map(header => (
                    <span key={header} className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full">
                      {header}
                    </span>
                  ))}
                </div>
        </div>
      )}

            {/* Кнопки действий */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setShowManager(false);
                  setFile(null);
                  setFileHeaders([]);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-none hover:bg-gray-300 transition-all duration-200 font-medium"
              >
                Назад
              </button>
              
              <button
                onClick={handleImport}
                disabled={loading || !priceSettings.frontendPrice}
                className="px-6 py-3 bg-black text-white rounded-none hover:bg-yellow-400 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                {loading ? 'Импортируем...' : 'Загрузить прайс'}
              </button>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}