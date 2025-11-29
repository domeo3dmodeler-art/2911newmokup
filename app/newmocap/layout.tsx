import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Конфигуратор дверей',
  description: 'Конфигуратор межкомнатных дверей',
};

export default function NewMocapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

