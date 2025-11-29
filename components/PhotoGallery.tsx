"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PhotoStructure {
  cover: string | null;
  gallery: string[];
}

interface PhotoGalleryProps {
  photos: PhotoStructure;
  productName?: string;
  className?: string;
  showModal?: boolean; // Новый параметр для управления модальным окном
  showArrows?: boolean; // Новый параметр для отображения стрелок
}

export function PhotoGallery({ photos, productName = '', className = '', showModal = true, showArrows = false }: PhotoGalleryProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Получаем все фото в правильном порядке (обложка + галерея)
  const allPhotos = photos.cover ? [photos.cover, ...photos.gallery] : photos.gallery;
  
  if (allPhotos.length === 0) {
    return (
      <div className={`aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="text-sm">Нет фото</div>
        </div>
      </div>
    );
  }

  const openModal = (index: number) => {
    if (!showModal) return; // Не открываем модалку если showModal = false
    setCurrentIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % allPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  const handleArrowClick = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      prevPhoto();
    } else {
      nextPhoto();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowRight') nextPhoto();
    if (e.key === 'ArrowLeft') prevPhoto();
  };

  return (
    <div className={className}>
      {/* Основное фото (обложка) с стрелками */}
      <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${showModal ? 'aspect-square cursor-pointer group' : 'h-full w-full'}`}>
        <img
          src={allPhotos[currentIndex]}
          alt={productName}
          className={`w-full h-full ${showModal ? 'object-contain' : 'object-cover'} transition-all duration-500 ease-in-out ${showModal ? 'group-hover:scale-105' : ''}`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        
        {/* Стрелки навигации - показываем только если есть больше одного фото и включены стрелки */}
        {showArrows && allPhotos.length > 1 && (
          <>
            {/* Левая стрелка */}
            <div
              onClick={(e) => { e.stopPropagation(); handleArrowClick('left'); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-75 cursor-pointer z-10"
              role="button"
              tabIndex={0}
              aria-label="Предыдущее фото"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleArrowClick('left');
                }
              }}
            >
              <ChevronLeftIcon className="h-6 w-6 scale-100 group-hover:scale-110 transition-transform duration-200" />
            </div>
            
            {/* Правая стрелка */}
            <div
              onClick={(e) => { e.stopPropagation(); handleArrowClick('right'); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 backdrop-blur-sm text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-75 cursor-pointer z-10"
              role="button"
              tabIndex={0}
              aria-label="Следующее фото"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleArrowClick('right');
                }
              }}
            >
              <ChevronRightIcon className="h-6 w-6 scale-100 group-hover:scale-110 transition-transform duration-200" />
            </div>
          </>
        )}
        
        {/* Индикатор количества фото - показываем только если есть модалка */}
        {showModal && allPhotos.length > 1 && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            {allPhotos.length} фото
          </div>
        )}
        
        {/* Точки-индикаторы */}
        {allPhotos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {allPhotos.map((_, index) => (
              <span
                key={index}
                className={`block w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'bg-white scale-125' : 'bg-gray-400 bg-opacity-75'
                } cursor-pointer`}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
              ></span>
            ))}
          </div>
        )}
        
        <div className="hidden w-full h-full flex items-center justify-center text-gray-400">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-sm">Ошибка загрузки</div>
          </div>
        </div>
      </div>

      {/* Превью остальных фото - показываем только если НЕ включены стрелки */}
      {!showArrows && allPhotos.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto">
          {allPhotos.map((photo, index) => (
            <div
              key={index}
              className={`w-16 h-16 bg-gray-100 rounded overflow-hidden cursor-pointer flex-shrink-0 border-2 transition-all duration-200 ${
                index === currentIndex ? 'border-blue-500' : 'border-transparent'
              }`}
              onClick={() => setCurrentIndex(index)}
            >
              <img
                src={photo}
                alt={`${productName} ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно галереи */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={closeModal}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="relative max-w-4xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            {/* Кнопка закрытия */}
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-white text-2xl z-10 hover:text-gray-300"
            >
              ×
            </button>

            {/* Основное фото */}
            <div className="relative">
              <img
                src={allPhotos[currentIndex]}
                alt={`${productName} ${currentIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-full h-64 flex items-center justify-center text-white">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>Ошибка загрузки фото</div>
                </div>
              </div>

              {/* Навигация */}
              {allPhotos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-2xl hover:text-gray-300"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-2xl hover:text-gray-300"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Счетчик фото */}
            {allPhotos.length > 1 && (
              <div className="text-center text-white mt-4">
                {currentIndex + 1} из {allPhotos.length}
              </div>
            )}

            {/* Миниатюры внизу */}
            {allPhotos.length > 1 && (
              <div className="flex justify-center gap-2 mt-4 overflow-x-auto max-w-full">
                {allPhotos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-16 h-16 rounded overflow-hidden flex-shrink-0 ${
                      index === currentIndex ? 'ring-2 ring-white' : ''
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`${productName} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
