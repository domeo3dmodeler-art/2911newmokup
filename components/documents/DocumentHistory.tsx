'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import HistoryModal from '@/components/ui/HistoryModal';

interface DocumentHistoryProps {
  document: any;
}

export function DocumentHistory({ document }: DocumentHistoryProps) {
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'Счет';
      case 'quote':
        return 'КП';
      case 'order':
        return 'Заказ у поставщика';
      default:
        return 'Документ';
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">История изменений</h2>
          </div>
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
          >
            Показать все
          </button>
        </div>

        {/* Краткая история */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Документ создан</p>
              <p className="text-xs text-gray-500">
                {new Date(document.created_at || document.createdAt).toLocaleString('ru-RU')}
              </p>
            </div>
          </div>

          {document.status && document.status !== 'DRAFT' && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Статус изменен</p>
                <p className="text-xs text-gray-500">
                  Текущий статус: {document.status}
                </p>
              </div>
            </div>
          )}

          {document.updated_at && document.updated_at !== document.created_at && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Документ обновлен</p>
                <p className="text-xs text-gray-500">
                  {new Date(document.updated_at).toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
          >
            Показать полную историю изменений
          </button>
        </div>
      </div>

      {/* Модальное окно с полной историей */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        documentId={document.id}
        documentType={document.type}
        documentNumber={document.number}
      />
    </>
  );
}
