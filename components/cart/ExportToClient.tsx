'use client';

import React, { useState } from 'react';
import { Button, Modal, Alert } from '@/components/ui';
import ClientSelector from './ClientSelector';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  productId?: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  address: string;
}

interface ExportToClientProps {
  cartItems: CartItem[];
  onSuccess: () => void;
  onClose: () => void;
}

export default function ExportToClient({ cartItems, onSuccess, onClose }: ExportToClientProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [documentType, setDocumentType] = useState<'quote' | 'invoice' | 'order'>('quote');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showClientSelector, setShowClientSelector] = useState(false);

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setShowClientSelector(false);
  };

  const handleExport = async () => {
    if (!selectedClient) {
      setAlert({ type: 'error', message: 'Выберите заказчика' });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/cart/save-to-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          cartItems,
          documentType
        })
      });

      const data = await response.json();

      if (data.success) {
        setAlert({ type: 'success', message: data.message });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setAlert({ type: 'error', message: data.error || 'Ошибка сохранения' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Ошибка сохранения' });
    } finally {
      setLoading(false);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'quote': return 'Коммерческое предложение';
      case 'invoice': return 'Счет';
      case 'order': return 'Заказ';
      default: return type;
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Сохранить в заказчика"
      size="lg"
    >
      <div className="space-y-6">
        {/* Alert */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Cart Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Содержимое корзины</h3>
          <div className="space-y-2">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span className="font-medium">{item.price * item.quantity} ₽</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between font-medium">
              <span>Итого:</span>
              <span>{totalAmount} ₽</span>
            </div>
          </div>
        </div>

        {/* Document Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Тип документа
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['quote', 'invoice', 'order'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setDocumentType(type)}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  documentType === type
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-lg mb-1">
                  {type === 'quote' && '📄'}
                  {type === 'invoice' && '🧾'}
                  {type === 'order' && '📦'}
                </div>
                <div className="text-sm font-medium">
                  {getDocumentTypeLabel(type)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Client Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Заказчик
          </label>
          {selectedClient ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">
                    {selectedClient.lastName} {selectedClient.firstName} {selectedClient.middleName}
                  </h4>
                  <p className="text-sm text-blue-700">{selectedClient.phone}</p>
                  <p className="text-sm text-blue-700">{selectedClient.address}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClientSelector(true)}
                >
                  Изменить
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowClientSelector(true)}
              className="w-full"
            >
              Выбрать заказчика
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={!selectedClient || loading}
            loading={loading}
          >
            Сохранить {getDocumentTypeLabel(documentType)}
          </Button>
        </div>
      </div>

      {/* Client Selector Modal */}
      {showClientSelector && (
        <ClientSelector
          onClientSelect={handleClientSelect}
          onClose={() => setShowClientSelector(false)}
        />
      )}
    </Modal>
  );
}

