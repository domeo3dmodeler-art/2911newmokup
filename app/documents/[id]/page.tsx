import { notFound } from 'next/navigation';
import { DocumentHeader } from '@/components/documents/DocumentHeader';
import { DocumentContent } from '@/components/documents/DocumentContent';
import { DocumentItems } from '@/components/documents/DocumentItems';
import { DocumentHistory } from '@/components/documents/DocumentHistory';
import { DocumentActions } from '@/components/documents/DocumentActions';
import { DocumentComments } from '@/components/documents/DocumentComments';
import { RelatedDocuments } from '@/components/documents/RelatedDocuments';
import { logger } from '@/lib/logging/logger';

interface DocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const { id } = await params;
  
  try {
    // Получаем данные документа
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/documents/${id}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      notFound();
    }

    const document = await response.json();

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumbs */}
          <nav className="mb-6">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <a href="/dashboard" className="hover:text-gray-700">
                  Главная
                </a>
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <a href="/clients" className="hover:text-gray-700">
                  Клиенты
                </a>
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <a href={`/clients/${document.client?.id}`} className="hover:text-gray-700">
                  {document.client?.firstName} {document.client?.lastName}
                </a>
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-900 font-medium">
                  {document.number}
                </span>
              </li>
            </ol>
          </nav>

          {/* Заголовок документа */}
          <DocumentHeader document={document} />

          {/* Основной контент */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Левая колонка - основной контент */}
            <div className="lg:col-span-2 space-y-6">
              <DocumentContent document={document} />
              <DocumentItems document={document} />
              <RelatedDocuments document={document} />
              <DocumentHistory document={document} />
            </div>

            {/* Правая колонка - действия и комментарии */}
            <div className="space-y-6">
              <DocumentActions document={document} />
              <DocumentComments document={document} />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    logger.error('Ошибка загрузки документа:', error);
    notFound();
  }
}
