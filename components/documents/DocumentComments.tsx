'use client';

import { useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import CommentsModal from '@/components/ui/CommentsModal';

interface DocumentCommentsProps {
  document: any;
}

export function DocumentComments({ document }: DocumentCommentsProps) {
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

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

  // Получаем количество комментариев из document_comments
  const comments = document.document_comments || [];
  const actualCommentsCount = comments.length;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Комментарии ({actualCommentsCount})
            </h2>
          </div>
          <button
            onClick={() => setIsCommentsModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить</span>
          </button>
        </div>

        {/* Краткий список комментариев */}
        {actualCommentsCount === 0 ? (
          <div className="text-center text-gray-500 py-6">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Пока нет комментариев</p>
            <button
              onClick={() => setIsCommentsModalOpen(true)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Добавить первый комментарий
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.slice(0, 3).map((comment: any, index: number) => (
              <div key={comment.id || index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.user?.first_name} {comment.user?.last_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">
                  {comment.text}
                </p>
              </div>
            ))}

            {actualCommentsCount > 3 && (
              <div className="text-center">
                <button
                  onClick={() => setIsCommentsModalOpen(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Показать все {actualCommentsCount} комментариев
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => setIsCommentsModalOpen(true)}
            className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
          >
            Открыть комментарии
          </button>
        </div>
      </div>

      {/* Модальное окно с комментариями */}
      <CommentsModal
        isOpen={isCommentsModalOpen}
        onClose={() => setIsCommentsModalOpen(false)}
        documentId={document.id}
        documentType={document.type}
        documentNumber={document.number}
      />
    </>
  );
}
