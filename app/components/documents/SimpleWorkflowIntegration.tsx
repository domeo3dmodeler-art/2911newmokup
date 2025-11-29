'use client';

import React, { useState } from 'react';
import { Button } from '../../../components/ui';
import QuickCartSidebar from '../cart/QuickCartSidebar';
import { ShoppingCart } from 'lucide-react';

interface SimpleWorkflowIntegrationProps {
  selectedClientId?: string;
  userRole: 'complectator' | 'executor';
}

export default function SimpleWorkflowIntegration({ 
  selectedClientId, 
  userRole 
}: SimpleWorkflowIntegrationProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sourceDocument, setSourceDocument] = useState<{
    id: string;
    type: 'quote' | 'order' | 'invoice' | 'supplier_order';
    number: string;
  } | undefined>();

  const openCart = () => {
    setSourceDocument(undefined);
    setIsCartOpen(true);
  };

  return (
    <>
      {/* Кнопка корзины убрана по требованию пользователя */}

      {/* Упрощенная корзина */}
      <QuickCartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        selectedClientId={selectedClientId}
        sourceDocument={sourceDocument}
      />
    </>
  );
}
