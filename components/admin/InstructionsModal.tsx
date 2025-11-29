'use client';

import React from 'react';
import { Card } from '@/components/ui';
import { Download, Upload, Image, TreePine, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstructionsModal({ isOpen, onClose }: InstructionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-black">📚 Подробная инструкция по работе с каталогом</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          
          {/* Загрузка товаров */}
          <Card className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Upload className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold">📦 Загрузка товаров</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Шаг 1: Подготовка файла</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Скачайте шаблон для вашей категории (кнопка "Скачать шаблон")</li>
                  <li>• Заполните шаблон данными о товарах</li>
                  <li>• Обязательные поля должны быть заполнены</li>
                  <li>• Поддерживаются форматы: .xlsx, .xls, .csv</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Шаг 2: Загрузка файла</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Нажмите кнопку "Добавить" в разделе товаров</li>
                  <li>• Выберите "Импорт товаров"</li>
                  <li>• Загрузите подготовленный файл</li>
                  <li>• Дождитесь завершения обработки</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Важные моменты</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• <strong>SKU внутреннее заполнено</strong> → режим обновления товара</li>
                  <li className="ml-4">- Требуется только SKU внутреннее, остальные поля опциональны</li>
                  <li className="ml-4">- Обновляются только поля, указанные в файле</li>
                  <li className="ml-4">- Если название не указано в файле, берется из БД</li>
                  <li className="ml-4">- Товар должен находиться в той же категории, иначе будет ошибка</li>
                  <li>• <strong>SKU внутреннее пустое</strong> → режим создания нового товара</li>
                  <li className="ml-4">- Требуются все обязательные поля из шаблона категории</li>
                  <li className="ml-4">- SKU генерируется автоматически (уникальный во всей БД)</li>
                  <li>• <strong>Пустые поля</strong> не обновляют существующие данные (режим merge)</li>
                  <li>• <strong>Обрабатываются только поля из шаблона категории</strong> - остальные поля игнорируются</li>
                  <li>• <strong>SKU должны быть уникальными</strong> во всей базе данных</li>
                  <li>• <strong>Импорт товаров из других категорий запрещен</strong> - при обнаружении будет ошибка</li>
                  <li>• Кодировка автоматически исправляется при загрузке</li>
                </ul>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-900 mb-2">🚫 Ограничения и ошибки</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Если SKU найден в другой категории → импорт будет прерван с ошибкой</li>
                  <li>• Если файл содержит поля, не указанные в шаблоне → они будут проигнорированы</li>
                  <li>• <strong>При создании нового товара</strong> (SKU внутреннее пустое): все обязательные поля шаблона должны быть заполнены</li>
                  <li>• <strong>При обновлении товара</strong> (SKU внутреннее заполнено): можно указывать только необходимые поля для обновления</li>
                  <li>• В режиме обновления название товара опционально - если не указано, сохраняется текущее из БД</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Загрузка фотографий */}
          <Card className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <Image className="h-6 w-6 text-green-600" aria-label="Иконка загрузки фотографий" />
              <h3 className="text-xl font-semibold">📸 Загрузка фотографий</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Подготовка фотографий</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Имя файла должно соответствовать артикулу товара</li>
                  <li>• Поддерживаются форматы: .jpg, .jpeg, .png, .webp</li>
                  <li>• Рекомендуемый размер: 800x600 пикселей</li>
                  <li>• Максимальный размер файла: 10 МБ</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Правила именования</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• <code>товар.jpg</code> - основное фото</li>
                  <li>• <code>товар_1.jpg</code> - дополнительное фото</li>
                  <li>• <code>товар_2.jpg</code> - еще одно фото</li>
                  <li>• <code>товар_3.jpg</code> - и так далее...</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Процесс загрузки</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Выберите категорию товаров</li>
                  <li>• Выберите тип загрузки: <strong>Фото товаров</strong> или <strong>Фото свойств</strong></li>
                  <li>• Выберите свойство для привязки (например, "Артикул поставщика" или "Цвет")</li>
                  <li>• Загрузите фотографии</li>
                  <li>• Система автоматически привяжет фото к товарам или свойствам</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">📋 Типы загрузки фото</h4>
                <div className="space-y-2 text-sm text-blue-700">
                  <div>
                    <strong>Фото товаров (properties_data):</strong>
                    <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                      <li>Фото сохраняются в properties_data товара</li>
                      <li>Используется для обложки и галереи товара</li>
                      <li>Формат: <code>photos: {`{cover: "url", gallery: ["url1", "url2"]}`}</code></li>
                    </ul>
                  </div>
                  <div>
                    <strong>Фото свойств (property_photos):</strong>
                    <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                      <li>Фото сохраняются в таблице property_photos</li>
                      <li>Используется для фото свойств (например, цветов, вариантов)</li>
                      <li>Привязка по значению свойства</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">🔄 Логика именования и замены</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• <code>model_name.png</code> → обложка товара (cover)</li>
                  <li>• <code>model_name_1.png</code> → фото галереи #1</li>
                  <li>• <code>model_name_2.png</code> → фото галереи #2</li>
                  <li>• Имя файла должно совпадать со значением свойства привязки</li>
                  <li>• Фото с одинаковым именем заменяют существующие</li>
                  <li>• Можно загружать фотографии по одной или массово</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Загрузка дерева каталога */}
          <Card className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <TreePine className="h-6 w-6 text-purple-600" />
              <h3 className="text-xl font-semibold">🌳 Загрузка дерева каталога</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Структура файла</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Каждая строка = одна категория</li>
                  <li>• Каждый столбец = уровень вложенности</li>
                  <li>• Пустые ячейки в начале строки = подкатегория</li>
                  <li>• Поддерживаются форматы: .xlsx, .xls, .csv</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Пример структуры</h4>
                <div className="bg-white p-3 rounded text-xs font-mono border">
                  <div>Мебель</div>
                  <div>Мебель → Кухня</div>
                  <div>Мебель → Кухня → Столы</div>
                  <div>Мебель → Кухня → Стулья</div>
                  <div>Мебель → Спальня</div>
                  <div>Мебель → Спальня → Кровати</div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Внимание</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Импорт дерева каталога удалит существующую структуру</li>
                  <li>• Сделайте резервную копию перед импортом</li>
                  <li>• Товары останутся, но могут потерять привязку к категориям</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Полезные советы */}
          <Card className="p-4">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="h-6 w-6 text-indigo-600" />
              <h3 className="text-xl font-semibold">💡 Полезные советы</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Что делать
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Регулярно делайте резервные копии</li>
                  <li>• Проверяйте данные перед загрузкой</li>
                  <li>• Используйте шаблоны для импорта</li>
                  <li>• Проверяйте кодировку файлов</li>
                </ul>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Чего избегать
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Не загружайте файлы с ошибками</li>
                  <li>• Не используйте специальные символы в именах</li>
                  <li>• Не загружайте слишком большие файлы</li>
                  <li>• Не прерывайте процесс загрузки</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Контакты поддержки */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">🆘 Нужна помощь?</h3>
              <p className="text-sm text-blue-700 mb-3">
                Если у вас возникли вопросы или проблемы, обратитесь к администратору системы.
              </p>
              <div className="text-xs text-blue-600">
                Версия системы: 1.0 | Последнее обновление: {new Date().toLocaleDateString('ru-RU')}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
