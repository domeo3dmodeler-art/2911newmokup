'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/ui';
import EnhancedCartSidebar from '../cart/EnhancedCartSidebar';
import { ShoppingCart } from 'lucide-react';
import { clientLogger } from '@/lib/logging/client-logger';

interface DocumentWorkflowIntegrationProps {
  selectedClientId?: string;
  userRole: 'complectator' | 'executor';
}

export default function DocumentWorkflowIntegration({ 
  selectedClientId, 
  userRole 
}: DocumentWorkflowIntegrationProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sourceDocument, setSourceDocument] = useState<{
    id: string;
    type: 'quote' | 'order' | 'invoice' | 'supplier_order';
    number: string;
  } | undefined>();

  // Функция для открытия корзины с контекстом документа
  const openCartWithDocument = (document: {
    id: string;
    type: 'quote' | 'order' | 'invoice' | 'supplier_order';
    number: string;
  }) => {
    setSourceDocument(document);
    setIsCartOpen(true);
  };

  // Функция для открытия корзины без контекста
  const openCart = () => {
    setSourceDocument(undefined);
    setIsCartOpen(true);
  };

  return (
    <>
      {/* Кнопка корзины в зависимости от роли */}
      <div className="flex items-center space-x-2">
        {userRole === 'complectator' && (
          <>
            <Button
              onClick={openCart}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Корзина</span>
            </Button>
            
            <Button
              onClick={() => {
                // Функция открытия конфигуратора дверей будет реализована позже
                clientLogger.debug('Open door configurator');
              }}
              variant="outline"
              size="sm"
            >
              Конфигуратор
            </Button>
          </>
        )}

        {userRole === 'executor' && (
          <Button
            onClick={openCart}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Корзина</span>
          </Button>
        )}
      </div>

      {/* Улучшенная корзина */}
      <EnhancedCartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        selectedClientId={selectedClientId}
        sourceDocument={sourceDocument}
      />
    </>
  );
}

// Хук для работы с документооборотом
export function useDocumentWorkflow() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sourceDocument, setSourceDocument] = useState<{
    id: string;
    type: 'quote' | 'order' | 'invoice' | 'supplier_order';
    number: string;
  } | undefined>();

  const openCartWithDocument = (document: {
    id: string;
    type: 'quote' | 'order' | 'invoice' | 'supplier_order';
    number: string;
  }) => {
    setSourceDocument(document);
    setIsCartOpen(true);
  };

  const openCart = () => {
    setSourceDocument(undefined);
    setIsCartOpen(true);
  };

  const closeCart = () => {
    setIsCartOpen(false);
    setSourceDocument(undefined);
  };

  return {
    isCartOpen,
    sourceDocument,
    openCartWithDocument,
    openCart,
    closeCart
  };
}
