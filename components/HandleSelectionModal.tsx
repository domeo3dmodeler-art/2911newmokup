'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui';

type Handle = {
  id: string;
  name: string;
  group: string;
  price: number;
  isBasic: boolean;
  showroom: boolean;
  supplier?: string;
  article?: string;
  factoryName?: string;
  photos?: string[];
};

interface HandleSelectionModalProps {
  handles: Record<string, Handle[]>;
  selectedHandleId?: string;
  onSelect: (handleId: string) => void;
  onClose: () => void;
}

export default function HandleSelectionModal({
  handles,
  selectedHandleId,
  onSelect,
  onClose
}: HandleSelectionModalProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Нормализуем путь к фото (внешние URL оставляем как есть)
  const getNormalizedPhotoUrl = (photoPath: string) => {
    if (!photoPath) return '';
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) return photoPath;
    if (photoPath.startsWith('/api/')) return photoPath;
    if (photoPath.startsWith('products/')) return `/api/uploads/${photoPath}`;
    if (photoPath.startsWith('uploads/')) return `/api/${photoPath}`;
    if (photoPath.startsWith('/uploads/')) return `/api${photoPath}`;
    if (photoPath.startsWith('/')) return `/api${photoPath}`;
    return `/api/uploads/${photoPath}`;
  };
  
  // Получаем все доступные группы из handles в нужном порядке
  const availableGroups = ['Базовый', 'Комфорт', 'Бизнес'].filter(group => 
    handles[group] && handles[group].length > 0
  );
  
  // Устанавливаем первую группу по умолчанию
  useEffect(() => {
    if (availableGroups.length > 0 && !selectedGroup) {
      setSelectedGroup(availableGroups[0]);
    }
  }, [availableGroups, selectedGroup]);
  
  const currentGroupHandles = selectedGroup ? handles[selectedGroup] || [] : [];
  
  // Получаем стоимость группы
  const getGroupPrice = (groupName: string) => {
    const groupHandles = handles[groupName] || [];
    if (groupHandles.length === 0) return 0;
    
    // Берем цену первой ручки в группе как цену группы
    return groupHandles[0]?.price || 0;
  };
  
  // Получаем все фотографии из текущей группы для галереи
  const allPhotosInGroup = currentGroupHandles
    .flatMap(handle => handle.photos || [])
    .filter(photo => photo);
  
  // Получаем название ручки для текущей фотографии
  const getCurrentHandleName = () => {
    if (!zoomPhoto || allPhotosInGroup.length === 0) return '';
    
    const currentPhoto = allPhotosInGroup[currentPhotoIndex];
    if (!currentPhoto) return '';
    
    // Находим ручку, которой принадлежит текущая фотография
    const handle = currentGroupHandles.find(h => 
      h.photos && h.photos.includes(currentPhoto)
    );
    
    return handle ? handle.name : '';
  };
  
  const handlePhotoClick = (photoUrl: string) => {
    const photoIndex = allPhotosInGroup.findIndex(photo => photo === photoUrl);
    setCurrentPhotoIndex(photoIndex >= 0 ? photoIndex : 0);
    setZoomPhoto(photoUrl);
  };
  
  const handlePrevPhoto = () => {
    if (allPhotosInGroup.length > 0) {
      const newIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : allPhotosInGroup.length - 1;
      setCurrentPhotoIndex(newIndex);
      setZoomPhoto(allPhotosInGroup[newIndex]);
    }
  };
  
  const handleNextPhoto = () => {
    if (allPhotosInGroup.length > 0) {
      const newIndex = currentPhotoIndex < allPhotosInGroup.length - 1 ? currentPhotoIndex + 1 : 0;
      setCurrentPhotoIndex(newIndex);
      setZoomPhoto(allPhotosInGroup[newIndex]);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setZoomPhoto(null);
    } else if (e.key === 'ArrowLeft') {
      handlePrevPhoto();
    } else if (e.key === 'ArrowRight') {
      handleNextPhoto();
    }
  };
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-7xl max-h-[95vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-2xl font-bold text-black">Выбор ручки</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1">
            {/* Выбор группы */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-black mb-3">
                Группа ручек
                {selectedGroup && (
                  <span className="text-gray-600 font-normal ml-2">
                    - {getGroupPrice(selectedGroup).toLocaleString('ru-RU')} ₽
                  </span>
                )}
              </h3>
              <div className="flex gap-2 flex-wrap">
                {availableGroups.map((group) => (
                  <Button
                    key={group}
                    onClick={() => setSelectedGroup(group)}
                    variant={selectedGroup === group ? 'default' : 'outline'}
                    className="px-4 py-2"
                  >
                    {group}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Сетка ручек */}
            {selectedGroup && (
              <div>
                <div className="grid grid-cols-4 gap-3">
                  {currentGroupHandles.map((handle) => (
                    <div
                      key={handle.id}
                      onClick={() => onSelect(handle.id)}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        selectedHandleId === handle.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {/* Фото ручки - прямоугольное поле отображения */}
                      <div className="aspect-[4/2.8] mb-3 bg-gray-100 overflow-hidden px-2 py-1">
                        {handle.photos && handle.photos.length > 0 ? (
                          <img
                            src={getNormalizedPhotoUrl(handle.photos[0])}
                            alt={handle.name}
                            className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform duration-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePhotoClick(handle.photos![0]);
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const placeholder = target.nextElementSibling as HTMLElement;
                              if (placeholder) {
                                placeholder.classList.remove('hidden');
                              }
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center text-gray-400 ${handle.photos && handle.photos.length > 0 ? 'hidden' : ''}`}>
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      
                      {/* Информация о ручке - без цены */}
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-2">
                          <h4 className="font-medium text-black text-sm line-clamp-2">
                            {handle.name}
                          </h4>
                          <div 
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              handle.showroom ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            title={handle.showroom ? 'В шоуруме' : 'Нет в шоуруме'}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
            <Button
              onClick={onClose}
              variant="ghost"
              className="px-4 py-2"
            >
              Отмена
            </Button>
            <Button
              onClick={() => {
                onSelect('');
                onClose();
              }}
              variant="destructive"
              className="px-4 py-2"
            >
              Убрать ручку
            </Button>
          </div>
        </div>
      </div>
      
      {/* Модальное окно зума фотографии */}
      {zoomPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4"
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            // Закрытие по клику на пустое поле (фон)
            if (e.target === e.currentTarget) {
              setZoomPhoto(null);
            }
          }}
          tabIndex={0}
        >
          {/* Кнопка закрытия */}
          <button
            onClick={() => setZoomPhoto(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
          >
            ×
          </button>
          
          {/* Контейнер для фотографии с навигацией */}
          <div className="relative max-w-5xl max-h-[90vh] flex items-center justify-center">
            {/* Кнопка предыдущего фото */}
            {allPhotosInGroup.length > 1 && (
              <button
                onClick={handlePrevPhoto}
                className="absolute -left-16 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 text-2xl z-10 bg-black bg-opacity-80 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-90 transition-all"
              >
                ←
              </button>
            )}
            
            {/* Кнопка следующего фото */}
            {allPhotosInGroup.length > 1 && (
              <button
                onClick={handleNextPhoto}
                className="absolute -right-16 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 text-2xl z-10 bg-black bg-opacity-80 rounded-full w-12 h-12 flex items-center justify-center hover:bg-opacity-90 transition-all"
              >
                →
              </button>
            )}
            
            {/* Фотография */}
            <img
              src={getNormalizedPhotoUrl(zoomPhoto || '')}
              alt="Увеличенное фото ручки"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Счетчик фотографий */}
          {allPhotosInGroup.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-70 px-4 py-2 rounded-lg">
              {currentPhotoIndex + 1} / {allPhotosInGroup.length}
            </div>
          )}
          
          {/* Название ручки */}
          {getCurrentHandleName() && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white text-lg font-medium bg-black bg-opacity-70 px-4 py-2 rounded-lg">
              {getCurrentHandleName()}
            </div>
          )}
        </div>
      )}
    </>
  );
}

