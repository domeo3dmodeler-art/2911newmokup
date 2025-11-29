import React, { useState } from 'react';
import { Button } from '../ui';
import { FileText, Download, Eye, Edit3, Loader2 } from 'lucide-react';
import { clientLogger } from '@/lib/logging/client-logger';

interface DocumentGeneratorProps {
  className?: string;
}

interface DocumentData {
  documentNumber: string;
  documentDate: string;
  clientName: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyINN: string;
  companyKPP: string;
  companyBank: string;
  companyAccount: string;
  companyBIC: string;
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unit: string;
    price: number;
    total: number;
    sku?: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  validUntil?: string;
  paymentTerms?: string;
}

export default function DocumentGeneratorSimple({ className = "" }: DocumentGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentData, setDocumentData] = useState<Partial<DocumentData>>({});

  const templates = [
    { id: 'commercial-proposal', name: 'Коммерческое предложение', type: 'pdf' },
    { id: 'invoice', name: 'Счет на оплату', type: 'pdf' },
    { id: 'supplier-order-excel', name: 'Заказ поставщику (Excel)', type: 'xlsx' },
    { id: 'supplier-order-pdf', name: 'Заказ поставщику (PDF)', type: 'pdf' }
  ];

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedTemplate,
          data: getDefaultDocumentData()
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка генерации документа');
      }

      // Получаем файл и скачиваем его
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Извлекаем имя файла из заголовка Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
        : `${selectedTemplate}.${templates.find(t => t.id === selectedTemplate)?.type}`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      clientLogger.error('Ошибка генерации:', error);
      alert('Ошибка при генерации документа');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDefaultDocumentData = (): DocumentData => {
    const today = new Date().toLocaleDateString('ru-RU');
    const documentNumber = `DOC-${Date.now()}`;
    
    return {
      documentNumber,
      documentDate: today,
      clientName: documentData.clientName || 'ООО "Клиент"',
      clientAddress: documentData.clientAddress || 'Адрес клиента',
      clientPhone: documentData.clientPhone || '+7 (999) 123-45-67',
      clientEmail: documentData.clientEmail || 'client@example.com',
      companyName: 'ООО "Domeo"',
      companyAddress: 'г. Москва, ул. Примерная, д. 1',
      companyPhone: '+7 (495) 123-45-67',
      companyEmail: 'info@domeo.ru',
      companyINN: '1234567890',
      companyKPP: '123456789',
      companyBank: 'ПАО "Сбербанк"',
      companyAccount: '40702810123456789012',
      companyBIC: '044525225',
      items: [
        {
          name: 'Пример товара 1',
          description: 'Описание товара',
          quantity: 2,
          unit: 'шт',
          price: 1000,
          total: 2000,
          sku: 'SKU001'
        },
        {
          name: 'Пример товара 2',
          description: 'Описание товара',
          quantity: 1,
          unit: 'шт',
          price: 1500,
          total: 1500,
          sku: 'SKU002'
        }
      ],
      subtotal: 3500,
      tax: 630,
      total: 4130,
      notes: 'Автоматически сгенерированный документ',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU'),
      paymentTerms: 'Оплата в течение 14 дней'
    };
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <FileText className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Генератор документов</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите тип документа
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Выберите документ</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Клиент
            </label>
            <input
              type="text"
              value={documentData.clientName || ''}
              onChange={(e) => setDocumentData(prev => ({ ...prev, clientName: e.target.value }))}
              placeholder="Название клиента"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон
            </label>
            <input
              type="text"
              value={documentData.clientPhone || ''}
              onChange={(e) => setDocumentData(prev => ({ ...prev, clientPhone: e.target.value }))}
              placeholder="+7 (999) 123-45-67"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={handleGenerate}
            disabled={!selectedTemplate || isGenerating}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? 'Генерация...' : 'Сгенерировать'}
          </Button>
          
          <Button variant="outline" className="px-3">
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" className="px-3">
            <Edit3 className="h-4 w-4" />
          </Button>
        </div>

        {selectedTemplate && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Предварительный просмотр</h4>
            <p className="text-sm text-gray-600">
              Документ будет сгенерирован в формате {
                templates.find(t => t.id === selectedTemplate)?.type.toUpperCase()
              } и автоматически скачан.
            </p>
            <div className="mt-2 text-xs text-gray-500">
              <p>Номер документа: DOC-{Date.now()}</p>
              <p>Дата: {new Date().toLocaleDateString('ru-RU')}</p>
              <p>Сумма: 4 130 ₽ (пример)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



