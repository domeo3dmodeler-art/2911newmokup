import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Конфигуратор дверей',
  description: 'Конфигуратор межкомнатных дверей',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}

