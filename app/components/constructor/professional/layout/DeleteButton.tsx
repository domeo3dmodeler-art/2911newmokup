'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteButtonProps {
  onDelete: () => void;
  elementName?: string;
  className?: string;
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({ 
  onDelete, 
  elementName = 'элемент',
  className = '' 
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window !== 'undefined' && window.confirm(`Удалить ${elementName}?`)) {
      onDelete();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors ${className}`}
      title={`Удалить ${elementName}`}
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
};
