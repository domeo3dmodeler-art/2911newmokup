// Отключаем prerendering для всех страниц в этой папке
export const dynamic = 'force-dynamic';

export default function ImportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
