// Отключаем prerendering для всех страниц в этой папке
export const dynamic = 'force-dynamic';

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
