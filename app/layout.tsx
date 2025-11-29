import '../globals.css'
import React from 'react'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth/AuthContext'

export const metadata = { 
  title: 'Domeo', 
  description: 'No‑Code Calculators MVP',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
  other: {
    'charset': 'utf-8',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
