'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, Button, Progress } from '../ui';
import { clientLogger } from '@/lib/logging/client-logger';

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface BulkPhotoUploaderProps {
  category: string;
  mappingProperty: string;
  onUploadComplete: (result: any) => void;
  onBack: () => void;
}

export default function BulkPhotoUploader({ 
  category, 
  mappingProperty, 
  onUploadComplete, 
  onBack 
}: BulkPhotoUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState({
    total: 0,
    completed: 0,
    errors: 0,
    linked: 0
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Фильтруем только изображения
    const imageFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/') && 
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
    );
    
    setFiles(imageFiles);
    
    // Инициализируем прогресс для каждого файла
    const progress: UploadProgress[] = imageFiles.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'pending'
    }));
    
    setUploadProgress(progress);
    setUploadStats({
      total: imageFiles.length,
      completed: 0,
      errors: 0,
      linked: 0
    });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const imageFiles = droppedFiles.filter(file => 
      file.type.startsWith('image/') && 
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
    );
    
    setFiles(imageFiles);
    
    const progress: UploadProgress[] = imageFiles.map(file => ({
      fileName: file.name,
      progress: 0,
      status: 'pending'
    }));
    
    setUploadProgress(progress);
    setUploadStats({
      total: imageFiles.length,
      completed: 0,
      errors: 0,
      linked: 0
    });
  }, []);

  const uploadFile = async (file: File, index: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Обновляем прогресс загрузки
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(prev => prev.map((item, i) => 
            i === index ? { ...item, progress, status: 'uploading' } : item
          ));
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          setUploadProgress(prev => prev.map((item, i) => 
            i === index ? { ...item, progress: 100, status: 'completed' } : item
          ));
          resolve();
        } else {
          const error = `HTTP ${xhr.status}: ${xhr.statusText}`;
          setUploadProgress(prev => prev.map((item, i) => 
            i === index ? { ...item, status: 'error', error } : item
          ));
          reject(new Error(error));
        }
      });
      
      xhr.addEventListener('error', () => {
        const error = 'Ошибка сети';
        setUploadProgress(prev => prev.map((item, i) => 
          i === index ? { ...item, status: 'error', error } : item
          ));
        reject(new Error(error));
      });
      
      xhr.addEventListener('abort', () => {
        setUploadProgress(prev => prev.map((item, i) => 
          i === index ? { ...item, status: 'error', error: 'Загрузка отменена' } : item
        ));
        reject(new Error('Загрузка отменена'));
      });
      
      // Подготавливаем FormData
      const formData = new FormData();
      formData.append('photos', file);
      formData.append('category', category);
      formData.append('mapping_property', mappingProperty);
      formData.append('auto_link', 'true'); // Включаем автопривязку
      
      // Настраиваем запрос
      xhr.open('POST', '/api/admin/import/photos-bulk');
      
      // Сохраняем ссылку на xhr для возможности отмены
      (file as any).xhr = xhr;
      
      xhr.send(formData);
    });
  };

  const startUpload = async () => {
    if (files.length === 0) return;
    
    setIsUploading(true);
    setOverallProgress(0);
    
    // Создаем AbortController для возможности отмены
    abortControllerRef.current = new AbortController();
    
    let completed = 0;
    let errors = 0;
    
    try {
      // Загружаем файлы параллельно (максимум 3 одновременно)
      const batchSize = 3;
      const batches = [];
      
      for (let i = 0; i < files.length; i += batchSize) {
        batches.push(files.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        const promises = batch.map((file, batchIndex) => {
          const globalIndex = batches.indexOf(batch) * batchSize + batchIndex;
          return uploadFile(file, globalIndex);
        });
        
        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            completed++;
          } else {
            errors++;
          }
        });
        
        // Обновляем общий прогресс
        const totalProcessed = completed + errors;
        setOverallProgress(Math.round((totalProcessed / files.length) * 100));
        setUploadStats(prev => ({
          ...prev,
          completed,
          errors
        }));
      }
      
      // Получаем финальный результат
      const finalResult = {
        success: errors === 0,
        uploaded: completed,
        errors: errors,
        total: files.length,
        message: errors === 0 ? 
          `Успешно загружено ${completed} файлов` : 
          `Загружено ${completed} файлов, ошибок: ${errors}`
      };
      
      onUploadComplete(finalResult);
      
    } catch (error) {
      clientLogger.error('Ошибка при загрузке файлов', error instanceof Error ? error : new Error(String(error)));
      onUploadComplete({
        success: false,
        uploaded: completed,
        errors: errors + 1,
        total: files.length,
        message: 'Произошла ошибка при загрузке файлов'
      });
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Отменяем все активные xhr запросы
    files.forEach(file => {
      if ((file as any).xhr) {
        (file as any).xhr.abort();
      }
    });
    
    setIsUploading(false);
    setUploadProgress(prev => prev.map(item => 
      item.status === 'uploading' ? { ...item, status: 'error', error: 'Загрузка отменена' } : item
    ));
  };

  const resetUpload = () => {
    setFiles([]);
    setUploadProgress([]);
    setOverallProgress(0);
    setUploadStats({
      total: 0,
      completed: 0,
      errors: 0,
      linked: 0
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = (status: UploadProgress['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'uploading':
        return '📤';
      case 'completed':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status: UploadProgress['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'uploading':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Массовая загрузка фото</h2>
        
        {/* Drag & Drop область */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            files.length > 0 ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="text-4xl">📸</div>
            <div>
              <p className="text-lg font-medium">
                {files.length > 0 ? `${files.length} файлов выбрано` : 'Перетащите фото сюда или нажмите для выбора'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Поддерживаются: JPG, PNG, WebP
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-6"
            >
              {files.length > 0 ? 'Выбрать другие файлы' : 'Выбрать файлы'}
            </Button>
          </div>
        </div>

        {/* Общий прогресс */}
        {isUploading && (
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Общий прогресс</span>
              <span className="text-sm text-gray-500">
                {uploadStats.completed + uploadStats.errors} / {uploadStats.total}
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>✅ Загружено: {uploadStats.completed}</span>
              <span>❌ Ошибок: {uploadStats.errors}</span>
            </div>
          </div>
        )}

        {/* Детальный прогресс файлов */}
        {uploadProgress.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-medium">Детали загрузки:</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadProgress.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                  <span className="text-lg">{getStatusIcon(item.status)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate">{item.fileName}</span>
                      <span className={`text-sm ${getStatusColor(item.status)}`}>
                        {item.status === 'uploading' ? `${item.progress}%` : 
                         item.status === 'completed' ? 'Готово' :
                         item.status === 'error' ? 'Ошибка' : 'Ожидание'}
                      </span>
                    </div>
                    {item.status === 'uploading' && (
                      <Progress value={item.progress} className="h-1 mt-1" />
                    )}
                    {item.status === 'error' && item.error && (
                      <p className="text-xs text-red-500 mt-1">{item.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Кнопки управления */}
        <div className="flex justify-between mt-6">
          <Button
            onClick={onBack}
            variant="outline"
            disabled={isUploading}
          >
            Назад
          </Button>
          
          <div className="space-x-3">
            {files.length > 0 && !isUploading && (
              <Button
                onClick={resetUpload}
                variant="outline"
              >
                Очистить
              </Button>
            )}
            
            {isUploading ? (
              <Button
                onClick={cancelUpload}
                variant="danger"
              >
                Отменить загрузку
              </Button>
            ) : (
              <Button
                onClick={startUpload}
                disabled={files.length === 0}
                className="px-8"
              >
                Начать загрузку ({files.length})
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
