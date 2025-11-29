'use client';

import React, { useState } from 'react';
import { BaseElement } from '../types';

interface GalleryProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

export function Gallery({ element, onUpdate }: GalleryProps) {
  // Получаем изображения из props или используем демо-данные
  const [images, setImages] = useState<GalleryImage[]>(
    element.props.images || [
      {
        id: '1',
        src: 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Изображение+1',
        alt: 'Изображение 1',
        caption: 'Пример изображения 1'
      },
      {
        id: '2',
        src: 'https://via.placeholder.com/400x300/EF4444/FFFFFF?text=Изображение+2',
        alt: 'Изображение 2',
        caption: 'Пример изображения 2'
      },
      {
        id: '3',
        src: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Изображение+3',
        alt: 'Изображение 3',
        caption: 'Пример изображения 3'
      },
      {
        id: '4',
        src: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Изображение+4',
        alt: 'Изображение 4',
        caption: 'Пример изображения 4'
      }
    ]
  );

  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = (image: GalleryImage, index: number) => {
    setSelectedImage(image);
    setCurrentIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    setSelectedImage(images[nextIndex]);
  };

  const prevImage = () => {
    const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    setSelectedImage(images[prevIndex]);
  };

  const getGridClass = () => {
    const columns = element.props.columns || 3;
    switch (columns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-3';
      case 4: return 'grid-cols-4';
      case 5: return 'grid-cols-5';
      case 6: return 'grid-cols-6';
      default: return 'grid-cols-3';
    }
  };

  return (
    <div className="w-full h-full bg-white p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок галереи */}
        {element.props.title && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {element.props.title}
            </h2>
            {element.props.subtitle && (
              <p className="text-gray-600">{element.props.subtitle}</p>
            )}
          </div>
        )}

        {/* Сетка изображений */}
        {images.length > 0 ? (
          <div className={`grid ${getGridClass()} gap-4`}>
            {images.map((image, index) => (
              <div
                key={image.id}
                className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow"
                onClick={() => openLightbox(image, index)}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>

                {/* Caption */}
                {element.props.showCaptions && image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                    <p className="text-white text-sm font-medium">{image.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🖼️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет изображений
            </h3>
            <p className="text-gray-500">
              Добавьте изображения через панель свойств
            </p>
          </div>
        )}

        {/* Lightbox */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
            <div className="relative max-w-4xl max-h-full">
              {/* Close button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Navigation buttons */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {/* Image */}
              <img
                src={selectedImage.src}
                alt={selectedImage.alt}
                className="max-w-full max-h-full object-contain"
              />

              {/* Caption */}
              {element.props.showCaptions && selectedImage.caption && (
                <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded">
                  <p className="text-center">{selectedImage.caption}</p>
                </div>
              )}

              {/* Image counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm">
                  {currentIndex + 1} / {images.length}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
