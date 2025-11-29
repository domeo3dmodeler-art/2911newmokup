'use client';

import React, { useState } from 'react';
import ElementsPanel from './ElementsPanel';
import CanvasArea from './CanvasArea';
import PropertiesPanel from './PropertiesPanel';
import ConstructorToolbar from './ConstructorToolbar';
import SmartSuggestions from './SmartSuggestions';
import { ConstructorProvider } from './ConstructorContext';

export default function Constructor() {
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<{id: string, name: string} | null>(null);

  return (
    <ConstructorProvider>
      <div className="flex flex-col h-full bg-gray-100">
        <ConstructorToolbar 
          onToggleSmartSuggestions={() => setShowSmartSuggestions(!showSmartSuggestions)}
          showSmartSuggestions={showSmartSuggestions}
        />
        <div className="flex flex-1 overflow-hidden">
          <ElementsPanel />
          {showSmartSuggestions && (
            <SmartSuggestions 
              categoryId={currentCategory?.id}
              categoryName={currentCategory?.name}
            />
          )}
          <CanvasArea />
          <PropertiesPanel />
        </div>
      </div>
    </ConstructorProvider>
  );
}
