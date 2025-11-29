// Компонент блока детального просмотра товара с увеличенным фото

import React from 'react';
import { Button, Input, Select } from '../ui';
import { ZoomIn, Eye, Info, Package } from 'lucide-react';
import ImagePreviewSettings from './ImagePreviewSettings';
import { ProfessionalBlock } from './professionalTypes';

interface ProductDetailBlockProps {
  block: ProfessionalBlock;
  onUpdate: (updates: Partial<ProfessionalBlock>) => void;
}

export default function ProductDetailBlock({ block, onUpdate }: ProductDetailBlockProps) {
  const settings = block.detailSettings || {
    showMainImage: true,
    showThumbnailGallery: true,
    showZoom: true,
    imageSettings: {
      size: 'large',
      aspectRatio: 'square',
      borderRadius: 8,
      shadow: true,
      captionField: 'name',
      placeholderImage: '/placeholder.jpg',
      showOnHover: false
    },
    showProductInfo: true,
    showPrice: true,
    showDescription: true,
    showSpecifications: true,
    showRelatedProducts: true
  };

  const handleSettingsUpdate = (field: string, value: any) => {
    onUpdate({
      detailSettings: {
        ...settings,
        [field]: value
      }
    });
  };

  const handleImageSettingsUpdate = (imageSettings: any) => {
    onUpdate({
      detailSettings: {
        ...settings,
        imageSettings
      }
    });
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold flex items-center">
        <Package className="h-4 w-4 mr-2" />
        Детальный просмотр товара
      </h4>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Категория товаров</label>
          <Select
            value={settings.categoryId || ''}
            onValueChange={(value) => handleSettingsUpdate('categoryId', value)}
          >
            <option value="">Выберите категорию</option>
            <option value="doors">Межкомнатные двери</option>
            <option value="handles">Дверные ручки</option>
            <option value="hardware">Комплекты фурнитуры</option>
          </Select>
        </div>

        {/* Настройки главного изображения */}
        <div className="space-y-2">
          <h5 className="font-medium flex items-center">
            <ZoomIn className="h-4 w-4 mr-2" />
            Главное изображение
          </h5>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showMainImage"
                checked={settings.showMainImage}
                onChange={(e) => handleSettingsUpdate('showMainImage', e.target.checked)}
              />
              <label htmlFor="showMainImage" className="text-sm">Показывать главное изображение</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showZoom"
                checked={settings.showZoom}
                onChange={(e) => handleSettingsUpdate('showZoom', e.target.checked)}
              />
              <label htmlFor="showZoom" className="text-sm">Включить зум при клике</label>
            </div>
          </div>

          {settings.showMainImage && (
            <ImagePreviewSettings
              settings={settings.imageSettings}
              onUpdate={handleImageSettingsUpdate}
              title="Настройки главного изображения"
            />
          )}
        </div>

        {/* Настройки галереи миниатюр */}
        <div className="space-y-2">
          <h5 className="font-medium flex items-center">
            <Eye className="h-4 w-4 mr-2" />
            Галерея миниатюр
          </h5>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showThumbnailGallery"
              checked={settings.showThumbnailGallery}
              onChange={(e) => handleSettingsUpdate('showThumbnailGallery', e.target.checked)}
            />
            <label htmlFor="showThumbnailGallery" className="text-sm">Показывать галерею миниатюр</label>
          </div>

          {settings.showThumbnailGallery && (
            <div className="ml-6 space-y-2">
              <div>
                <label className="block text-sm font-medium mb-1">Количество миниатюр в ряду</label>
                <Input
                  type="number"
                  value={settings.thumbnailColumns || 4}
                  onChange={(e) => handleSettingsUpdate('thumbnailColumns', parseInt(e.target.value))}
                  min={2}
                  max={8}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showThumbnailCaptions"
                  checked={settings.showThumbnailCaptions || false}
                  onChange={(e) => handleSettingsUpdate('showThumbnailCaptions', e.target.checked)}
                />
                <label htmlFor="showThumbnailCaptions" className="text-sm">Подписи к миниатюрам</label>
              </div>
            </div>
          )}
        </div>

        {/* Настройки информации о товаре */}
        <div className="space-y-2">
          <h5 className="font-medium flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Информация о товаре
          </h5>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showProductInfo"
                checked={settings.showProductInfo}
                onChange={(e) => handleSettingsUpdate('showProductInfo', e.target.checked)}
              />
              <label htmlFor="showProductInfo" className="text-sm">Показывать основную информацию</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showPrice"
                checked={settings.showPrice}
                onChange={(e) => handleSettingsUpdate('showPrice', e.target.checked)}
              />
              <label htmlFor="showPrice" className="text-sm">Показывать цену</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showDescription"
                checked={settings.showDescription}
                onChange={(e) => handleSettingsUpdate('showDescription', e.target.checked)}
              />
              <label htmlFor="showDescription" className="text-sm">Показывать описание</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showSpecifications"
                checked={settings.showSpecifications}
                onChange={(e) => handleSettingsUpdate('showSpecifications', e.target.checked)}
              />
              <label htmlFor="showSpecifications" className="text-sm">Показывать характеристики</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showRelatedProducts"
                checked={settings.showRelatedProducts}
                onChange={(e) => handleSettingsUpdate('showRelatedProducts', e.target.checked)}
              />
              <label htmlFor="showRelatedProducts" className="text-sm">Показывать похожие товары</label>
            </div>
          </div>
        </div>

        {/* Превью блока */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h6 className="text-sm font-medium mb-2">Превью блока:</h6>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.showMainImage && (
              <div className="bg-white p-4 rounded border">
                <div className="text-sm font-medium mb-2">Главное изображение</div>
                <div 
                  className="bg-gray-200 rounded border flex items-center justify-center"
                  style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: `${settings.imageSettings.borderRadius}px`,
                    boxShadow: settings.imageSettings.shadow ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  <ZoomIn className="h-8 w-8 text-gray-400" />
                </div>
                {settings.showZoom && (
                  <div className="text-xs text-gray-500 mt-1">Клик для увеличения</div>
                )}
              </div>
            )}
            
            <div className="bg-white p-4 rounded border">
              <div className="text-sm font-medium mb-2">Информация о товаре</div>
              <div className="space-y-2 text-sm">
                {settings.showProductInfo && <div className="bg-gray-100 p-2 rounded">Название товара</div>}
                {settings.showPrice && <div className="bg-gray-100 p-2 rounded">Цена: 15,000 ₽</div>}
                {settings.showDescription && <div className="bg-gray-100 p-2 rounded">Описание товара...</div>}
                {settings.showSpecifications && <div className="bg-gray-100 p-2 rounded">Характеристики</div>}
              </div>
            </div>
          </div>
          
          {settings.showThumbnailGallery && (
            <div className="mt-4 bg-white p-4 rounded border">
              <div className="text-sm font-medium mb-2">Галерея миниатюр</div>
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-12 h-12 bg-gray-200 rounded border"></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
