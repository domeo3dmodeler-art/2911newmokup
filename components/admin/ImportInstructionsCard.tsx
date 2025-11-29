'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { HelpCircle, Upload, Image, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface ImportInstructionsCardProps {
  className?: string;
}

export default function ImportInstructionsCard({ className = '' }: ImportInstructionsCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Блокируем прокрутку страницы при открытом модальном окне
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isModalOpen]);

  return (
    <>
      {/* Кнопка открытия модального окна */}
      <Button
        variant="outline"
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center space-x-2 ${className}`}
      >
        <HelpCircle className="h-5 w-5 text-blue-600" />
        <span className="font-semibold text-gray-900">Инструкция по импорту</span>
      </Button>

      {/* Модальное окно */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <HelpCircle className="h-6 w-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-black">Инструкция по импорту</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl transition-colors p-1 hover:bg-gray-100 rounded"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-4">
              {/* Быстрый обзор */}
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Быстрый старт
                </h4>
                <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                  <li>Выберите категорию каталога</li>
                  <li>Проверьте или создайте шаблон импорта</li>
                  <li>Загрузите файл с данными</li>
                  <li>Проверьте предпросмотр</li>
                  <li>Запустите импорт</li>
                </ol>
              </div>

              {/* Импорт товаров */}
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Upload className="h-4 w-4 mr-2 text-green-600" />
                  Импорт товаров
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div>
                    <strong className="text-gray-900">Формат файла:</strong> Excel (.xlsx, .xls) или CSV (.csv)
                  </div>
                  <div>
                    <strong className="text-gray-900">Подготовка:</strong>
                    <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                      <li>Первая строка - заголовки столбцов</li>
                      <li>Данные со второй строки</li>
                      <li>Кодировка: UTF-8 (автоматически исправляется)</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-2">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-yellow-900">Важно:</strong>
                        <ul className="list-disc list-inside ml-2 mt-1 text-yellow-800 text-xs space-y-0.5">
                          <li><strong>SKU внутреннее</strong> заполнено → товар обновляется (требуется только SKU)</li>
                          <li><strong>SKU внутреннее</strong> пустое → создается новый товар (требуются все поля из шаблона)</li>
                          <li>Обрабатываются только поля из шаблона категории</li>
                          <li>Пустые поля не изменяют существующие данные</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-red-900">Ограничения:</strong>
                        <ul className="list-disc list-inside ml-2 mt-1 text-red-800 text-xs space-y-0.5">
                          <li>SKU должны быть уникальными во всей БД</li>
                          <li>Импорт товара из другой категории запрещен</li>
                          <li>При ошибке импорт будет прерван</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Импорт фотографий */}
              <div className="bg-white rounded-lg p-4 border border-purple-100">
                <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Image className="h-4 w-4 mr-2 text-purple-600" aria-label="Иконка импорта фотографий" />
                  Импорт фотографий
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div>
                    <strong className="text-gray-900">Форматы:</strong> JPG, JPEG, PNG, WebP
                  </div>
                  <div>
                    <strong className="text-gray-900">Типы загрузки:</strong>
                    <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                      <li><strong>Фото товаров</strong> - привязка к properties_data товара</li>
                      <li><strong>Фото свойств</strong> - привязка к property_photos (например, цвета)</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                    <div className="flex items-start space-x-2">
                      <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-blue-900">Правила именования:</strong>
                        <ul className="list-disc list-inside ml-2 mt-1 text-blue-800 text-xs space-y-0.5">
                          <li><code>model_name.png</code> → обложка товара</li>
                          <li><code>model_name_1.png</code> → фото галереи #1</li>
                          <li><code>model_name_2.png</code> → фото галереи #2</li>
                          <li>Имя файла должно совпадать со значением свойства привязки</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div>
                    <strong className="text-gray-900">Процесс:</strong>
                    <ol className="list-decimal list-inside ml-2 mt-1 space-y-0.5">
                      <li>Выберите категорию</li>
                      <li>Выберите тип загрузки (товары/свойства)</li>
                      <li>Выберите свойство для привязки</li>
                      <li>Загрузите фотографии</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Поддержка */}
              <div className="bg-white rounded-lg p-4 border border-gray-100 text-center">
                <p className="text-xs text-gray-600">
                  Нужна помощь? Обратитесь к администратору системы
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
