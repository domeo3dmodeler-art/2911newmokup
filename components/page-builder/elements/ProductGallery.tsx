'use client';

import React, { useState } from 'react';
import { BaseElement } from '../types';

interface ProductGalleryProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

export function ProductGallery({ element, onUpdate }: ProductGalleryProps) {
  const {
    images = [
      '/uploads/products/default/1759160720296_58vgf7nva1s.png',
      '/uploads/products/default/1759160720302_20wn1106mud.png',
      '/uploads/products/default/1759160720308_712ncg4yus6.png'
    ],
    showThumbnails = true,
    showNavigation = true,
    layout = 'grid'
  } = element.props;

  const [selectedImage, setSelectedImage] = useState(0);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = '/uploads/products/default/1759160720296_58vgf7nva1s.png';
  };

  if (layout === 'carousel') {
    return (
      <div className="w-full max-w-2xl mx-auto">
        {/* Основное изображение */}
        <div className="relative">
          <img
            src={images[selectedImage]}
            alt={`Изображение ${selectedImage + 1}`}
            className="w-full h-96 object-cover rounded-lg"
            onError={handleImageError}
          />
          
          {showNavigation && images.length > 1 && (
            <>
              <button
                onClick={() => setSelectedImage(Math.max(0, selectedImage - 1))}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                disabled={selectedImage === 0}
              >
                ←
              </button>
              <button
                onClick={() => setSelectedImage(Math.min(images.length - 1, selectedImage + 1))}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                disabled={selectedImage === images.length - 1}
              >
                →
              </button>
            </>
          )}
        </div>

        {/* Миниатюры */}
        {showThumbnails && images.length > 1 && (
          <div className="flex space-x-2 mt-4 overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                  selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                <img
                  src={image}
                  alt={`Миниатюра ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Grid layout
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {images.map((image, index) => (
        <div key={index} className="aspect-square">
          <img
            src={image}
            alt={`Изображение ${index + 1}`}
            className="w-full h-full object-cover rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
            onError={handleImageError}
          />
        </div>
      ))}
    </div>
  );
}
