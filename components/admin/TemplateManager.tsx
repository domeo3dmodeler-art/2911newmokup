'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { clientLogger } from '@/lib/logging/client-logger';

interface TemplateManagerProps {
  catalogCategoryId: string | null;
  catalogCategoryName?: string;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ 
  catalogCategoryId, 
  catalogCategoryName 
}) => {
  const [downloading, setDownloading] = useState(false);

  const downloadTemplate = async () => {
    if (!catalogCategoryId) return;

    setDownloading(true);

    try {
      const response = await fetch(`/api/admin/templates/download?catalogCategoryId=${catalogCategoryId}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `template_${catalogCategoryName || 'template'}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        clientLogger.error('Ошибка при скачивании шаблона');
      }
    } catch (error) {
      clientLogger.error('Ошибка при скачивании шаблона:', error);
    } finally {
      setDownloading(false);
    }
  };

  if (!catalogCategoryId) {
    return null;
  }

  return (
    <button
      onClick={downloadTemplate}
      disabled={downloading}
      className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
    >
      <Download className="h-4 w-4 mr-2" />
      {downloading ? 'Скачивание...' : 'Скачать шаблон'}
    </button>
  );
};

export default TemplateManager;