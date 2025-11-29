// Компонент настроек превью изображений

import React from 'react';
import { Button, Input, Select } from '../ui';
import { Image, Eye, EyeOff } from 'lucide-react';
import { ImagePreviewSettings as ImagePreviewSettingsType } from './professionalTypes';

interface ImagePreviewSettingsProps {
  settings: ImagePreviewSettingsType;
  onUpdate: (settings: ImagePreviewSettingsType) => void;
  title?: string;
}

export default function ImagePreviewSettings({ 
  settings, 
  onUpdate, 
  title = "Настройки изображений" 
}: ImagePreviewSettingsProps) {
  
  const handleFieldChange = (field: keyof ImagePreviewSettingsType, value: any) => {
    onUpdate({ ...settings, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h5 className="font-medium flex items-center">
        <Image className="h-4 w-4 mr-2" />
        {title}
      </h5>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Размер изображения</label>
          <Select
            value={settings.size}
            onValueChange={(value: any) => handleFieldChange('size', value)}
          >
            <option value="thumbnail">Миниатюра (64px)</option>
            <option value="small">Маленький (128px)</option>
            <option value="medium">Средний (256px)</option>
            <option value="large">Большой (512px)</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Пропорции</label>
          <Select
            value={settings.aspectRatio}
            onValueChange={(value: any) => handleFieldChange('aspectRatio', value)}
          >
            <option value="square">Квадрат (1:1)</option>
            <option value="landscape">Горизонтальный (16:9)</option>
            <option value="portrait">Вертикальный (9:16)</option>
            <option value="auto">Автоматически</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Скругление углов</label>
          <Input
            type="number"
            value={settings.borderRadius}
            onChange={(e) => handleFieldChange('borderRadius', parseInt(e.target.value))}
            min={0}
            max={50}
            placeholder="8"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Поле для подписи</label>
          <Select
            value={settings.captionField}
            onValueChange={(value) => handleFieldChange('captionField', value)}
          >
            <option value="name">Название товара</option>
            <option value="description">Описание</option>
            <option value="category">Категория</option>
            <option value="price">Цена</option>
            <option value="material">Материал</option>
            <option value="color">Цвет</option>
            <option value="size">Размер</option>
            <option value="brand">Бренд</option>
            <option value="none">Без подписи</option>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Заглушка для изображений</label>
        <Input
          value={settings.placeholderImage}
          onChange={(e) => handleFieldChange('placeholderImage', e.target.value)}
          placeholder="/placeholder.jpg"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="shadow"
            checked={settings.shadow}
            onChange={(e) => handleFieldChange('shadow', e.target.checked)}
          />
          <label htmlFor="shadow" className="text-sm">Добавить тень</label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showOnHover"
            checked={settings.showOnHover}
            onChange={(e) => handleFieldChange('showOnHover', e.target.checked)}
          />
          <label htmlFor="showOnHover" className="text-sm">Показывать при наведении</label>
        </div>
      </div>

      {/* Превью изображения */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <h6 className="text-sm font-medium mb-2">Превью:</h6>
        <div className="flex items-center space-x-4">
          <div 
            className="bg-gray-200 rounded border flex items-center justify-center"
            style={{
              width: settings.size === 'thumbnail' ? '64px' : 
                     settings.size === 'small' ? '128px' :
                     settings.size === 'medium' ? '256px' : '512px',
              height: settings.aspectRatio === 'square' ? 
                        (settings.size === 'thumbnail' ? '64px' : 
                         settings.size === 'small' ? '128px' :
                         settings.size === 'medium' ? '256px' : '512px') :
                      settings.aspectRatio === 'landscape' ?
                        (settings.size === 'thumbnail' ? '36px' : 
                         settings.size === 'small' ? '72px' :
                         settings.size === 'medium' ? '144px' : '288px') :
                      settings.aspectRatio === 'portrait' ?
                        (settings.size === 'thumbnail' ? '114px' : 
                         settings.size === 'small' ? '228px' :
                         settings.size === 'medium' ? '456px' : '912px') :
                        'auto',
              borderRadius: `${settings.borderRadius}px`,
              boxShadow: settings.shadow ? '0 4px 8px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {settings.placeholderImage ? (
              <img 
                src={settings.placeholderImage} 
                alt="Превью"
                className="w-full h-full object-cover rounded"
                style={{ borderRadius: `${settings.borderRadius}px` }}
              />
            ) : (
              <Image className="h-6 w-6 text-gray-400" />
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            <p><strong>Размер:</strong> {settings.size}</p>
            <p><strong>Пропорции:</strong> {settings.aspectRatio}</p>
            <p><strong>Подпись:</strong> {settings.captionField}</p>
            {settings.shadow && <p><strong>Тень:</strong> Да</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
