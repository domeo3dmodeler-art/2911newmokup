'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/ui';
import { FileSpreadsheet, Terminal } from 'lucide-react';

interface PriceListExporterProps {
  catalogCategoryId: string | null;
  catalogCategoryName?: string;
}

export default function PriceListExporter({ catalogCategoryId, catalogCategoryName }: PriceListExporterProps) {
  const [exporting, setExporting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const downloadPriceList = async () => {
    if (!catalogCategoryId) {
      alert('Пожалуйста, выберите категорию для экспорта прайса.');
      return;
    }

    setExporting(true);
    try {
      const response = await fetch(`/api/admin/export/price-list?catalogCategoryId=${catalogCategoryId}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `price_${catalogCategoryName || 'catalog'}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('Прайс успешно экспортирован в Excel! Все товары категории включены.');
      } else {
        const errorData = await response.json();
        clientLogger.error('Failed to export price list:', errorData.error);
        alert(`Ошибка при экспорте прайса: ${errorData.error}`);
      }
    } catch (error) {
      clientLogger.error('Error exporting price list:', error);
      alert('Произошла ошибка при экспорте прайса.');
    } finally {
      setExporting(false);
    }
  };

  const disabled = !catalogCategoryId;

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={downloadPriceList}
        disabled={disabled || exporting}
        className="flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Скачать прайс в Excel (все товары категории)"
      >
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        {exporting ? 'Экспорт...' : 'Скачать прайс'}
      </button>

      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
        title="Показать инструкции"
      >
        <Terminal className="h-4 w-4 mr-2" />
        Инструкции
      </button>

      {showInstructions && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-white border rounded-lg shadow-lg z-10 max-w-md">
          <h3 className="font-semibold mb-2">Инструкции по экспорту прайса:</h3>
          <ol className="text-sm space-y-1">
            <li>1. Выберите категорию в дереве каталога</li>
            <li>2. Нажмите кнопку "Скачать прайс"</li>
            <li>3. Файл Excel (.xlsx) будет скачан с ВСЕМИ товарами</li>
            <li>4. Откройте файл в Microsoft Excel или LibreOffice</li>
          </ol>
          <p className="text-xs text-gray-500 mt-2">
            Категория: {catalogCategoryName || 'Не выбрана'}
          </p>
          <p className="text-xs text-green-600 mt-1">
            ✅ Экспортируются ВСЕ товары без ограничений
          </p>
        </div>
      )}
    </div>
  );
}