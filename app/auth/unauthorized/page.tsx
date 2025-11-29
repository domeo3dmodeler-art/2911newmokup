'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, LogIn } from 'lucide-react';
import { Button } from '@/components/ui';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Доступ запрещен
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            У вас нет прав для доступа к этой странице
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-6">
                Эта страница доступна только пользователям с соответствующими правами доступа.
              </p>
              
              <div className="space-y-3">
                <Link href="/login">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <LogIn className="h-4 w-4 mr-2" />
                    Войти в систему
                  </Button>
                </Link>
                
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    На главную
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Если вы считаете, что это ошибка, обратитесь к администратору системы
          </p>
        </div>
      </div>
    </div>
  );
}
