'use client';

import React from 'react';
import AdminLayout from '../../../../components/layout/AdminLayout';

export default function CatalogTreeImportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayout 
      title="Импорт дерева каталогов" 
      subtitle="Загрузка структуры категорий из Excel файла"
    >
      {children}
    </AdminLayout>
  );
}



