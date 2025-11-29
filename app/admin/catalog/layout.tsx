'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AdminLayout from '../../../components/layout/AdminLayout';

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Определяем заголовок и подзаголовок в зависимости от текущего пути
  const getPageInfo = () => {
    if (pathname.includes('/frontend-categories')) {
      return {
        title: 'Категории конфигуратора',
        subtitle: 'Управление категориями для отображения пользователям'
      };
    }
    if (pathname.includes('/products')) {
      return {
        title: 'Товары',
        subtitle: 'Управление товарами в каталоге'
      };
    }
    if (pathname.includes('/export')) {
      return {
        title: 'Настройки экспорта',
        subtitle: 'Управление настройками экспорта документов'
      };
    }
    if (pathname.includes('/import')) {
      return {
        title: 'Импорт товаров',
        subtitle: 'Загрузка товаров и их свойств из Excel файла'
      };
    }
    if (pathname.includes('/properties/moderate')) {
      return {
        title: 'Модерация свойств',
        subtitle: 'Назначение свойств товаров категориям каталога'
      };
    }
    if (pathname.includes('/properties/assignments')) {
      return {
        title: 'Назначение свойств',
        subtitle: 'Управление назначением свойств товаров категориям каталога'
      };
    }
    if (pathname.includes('/properties')) {
      return {
        title: 'Свойства товаров',
        subtitle: 'Управление характеристиками товаров в каталоге'
      };
    }
    // По умолчанию для корневой страницы каталога
    return {
      title: 'Каталог товаров',
      subtitle: 'Управление деревом категорий и свойствами товаров'
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
