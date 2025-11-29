'use client';

// Отключаем prerendering для этой страницы (динамический контент) - должно быть до импортов
export const dynamic = 'force-dynamic';

import React from 'react';
import dynamicImport from 'next/dynamic';

// Динамический импорт PageBuilder с отключением SSR
const PageBuilder = dynamicImport(
  () => import('../../components/page-builder/PageBuilder').then(mod => ({ default: mod.PageBuilder })),
  { 
    ssr: false,
    loading: () => <div className="h-screen w-full flex items-center justify-center">Загрузка...</div>
  }
);

export default function ProfessionalBuilderPage() {
  return (
    <div className="h-screen w-full">
      <PageBuilder />
    </div>
  );
}

