'use client';

import React, { useState } from 'react';
import { Button } from '../ui';
import { useConstructor } from './ConstructorContext';
import { 
  Undo, 
  Redo, 
  Save, 
  Download, 
  Upload, 
  Eye, 
  Smartphone, 
  Tablet, 
  Monitor,
  Settings,
  Palette,
  Sparkles
} from 'lucide-react';
import { clientLogger } from '@/lib/logging/client-logger';

interface ConstructorToolbarProps {
  onToggleSmartSuggestions?: () => void;
  showSmartSuggestions?: boolean;
}

export default function ConstructorToolbar({ onToggleSmartSuggestions, showSmartSuggestions }: ConstructorToolbarProps) {
  const { 
    canUndo, 
    canRedo, 
    undo, 
    redo, 
    saveToHistory,
    loadState,
    resetState,
    state
  } = useConstructor();

  const [currentDevice, setCurrentDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async () => {
    try {
      saveToHistory();
      
      // Здесь будет сохранение в базу данных
      const response = await fetch('/api/admin/constructor/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configuration: state,
          device: currentDevice
        })
      });

      if (response.ok) {
        clientLogger.debug('Конфигурация сохранена');
      }
    } catch (error) {
      clientLogger.error('Ошибка сохранения:', error);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'constructor-config.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          loadState(config);
        } catch (error) {
          clientLogger.error('Ошибка импорта:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      {/* Левая часть - основные действия */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo}
          className="flex items-center space-x-1"
        >
          <Undo className="h-4 w-4" />
          <span>Отменить</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo}
          className="flex items-center space-x-1"
        >
          <Redo className="h-4 w-4" />
          <span>Повторить</span>
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          className="flex items-center space-x-1"
        >
          <Save className="h-4 w-4" />
          <span>Сохранить</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="flex items-center space-x-1"
        >
          <Download className="h-4 w-4" />
          <span>Экспорт</span>
        </Button>

        <label className="cursor-pointer">
          <Button
            variant="outline"
            size="sm"
            as="div"
            className="flex items-center space-x-1"
          >
            <Upload className="h-4 w-4" />
            <span>Импорт</span>
          </Button>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {/* Центральная часть - переключатель устройств */}
      <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
        <Button
          variant={currentDevice === 'desktop' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCurrentDevice('desktop')}
          className="flex items-center space-x-1"
        >
          <Monitor className="h-4 w-4" />
          <span className="hidden sm:inline">Desktop</span>
        </Button>
        
        <Button
          variant={currentDevice === 'tablet' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCurrentDevice('tablet')}
          className="flex items-center space-x-1"
        >
          <Tablet className="h-4 w-4" />
          <span className="hidden sm:inline">Tablet</span>
        </Button>
        
        <Button
          variant={currentDevice === 'mobile' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setCurrentDevice('mobile')}
          className="flex items-center space-x-1"
        >
          <Smartphone className="h-4 w-4" />
          <span className="hidden sm:inline">Mobile</span>
        </Button>
      </div>

      {/* Правая часть - дополнительные действия */}
      <div className="flex items-center space-x-2">
        <Button
          variant={showSmartSuggestions ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleSmartSuggestions}
          className="flex items-center space-x-1"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">AI</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center space-x-1"
        >
          <Eye className="h-4 w-4" />
          <span className="hidden sm:inline">
            {showPreview ? 'Редактор' : 'Превью'}
          </span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex items-center space-x-1"
        >
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Стили</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex items-center space-x-1"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Настройки</span>
        </Button>
      </div>
    </div>
  );
}
