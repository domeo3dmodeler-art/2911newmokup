'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Динамический импорт PageBuilder с отключением SSR
const PageBuilder = dynamic(
  () => import('../../components/page-builder/PageBuilder').then(mod => ({ default: mod.PageBuilder })),
  { 
    ssr: false,
    loading: () => <div className="h-screen w-full flex items-center justify-center">Загрузка...</div>
  }
);

// Отключаем prerendering для этой страницы
export const dynamic = 'force-dynamic';

export default function PageBuilderPage() {
  return (
    <div className="h-screen w-full">
      <PageBuilder />
    </div>
  );
}
