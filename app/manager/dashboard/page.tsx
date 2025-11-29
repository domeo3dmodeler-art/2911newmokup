'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import React from 'react';
import dynamicImport from 'next/dynamic';

// Динамический импорт основного компонента dashboard с отключением SSR
const ManagerDashboardComponent = dynamicImport(
  () => import('./ManagerDashboardComponent').then(mod => ({ default: mod.ManagerDashboardComponent })),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-64"><div className="text-gray-500">Загрузка...</div></div>
  }
);

interface ManagerDashboardProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    role: string;
    permissions: string[];
  };
}

export default function ManagerDashboard({ user }: ManagerDashboardProps) {
  return <ManagerDashboardComponent user={user} />;
}

