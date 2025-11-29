'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminLayout from '../../../components/layout/AdminLayout';

export default function ConfiguratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Определяем заголовок и подзаголовок в зависимости от текущего пути
  const getPageInfo = () => {
    if (pathname.includes('/create')) {
      return {
        title: 'Создать категорию',
        subtitle: 'Создание новой категории конфигуратора'
      };
    }
    if (pathname.includes('/import')) {
      return {
        title: 'Импорт товаров',
        subtitle: 'Загрузка товаров в категории конфигуратора'
      };
    }
    if (pathname.includes('/export')) {
      return {
        title: 'Настройки экспорта',
        subtitle: 'Конфигурация экспорта документов для категорий'
      };
    }
    // По умолчанию для списка категорий
    return {
      title: 'Категории конфигуратора',
      subtitle: 'Управление категориями для пользовательского интерфейса'
    };
  };

  const { title, subtitle } = getPageInfo();

  return (
    <AdminLayout 
      title={title} 
      subtitle={subtitle}
    >
      {children}
    </AdminLayout>
  );
}
