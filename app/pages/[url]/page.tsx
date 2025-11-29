import { notFound } from 'next/navigation';
import { PublishedPageViewer } from '@/components/page-builder/PublishedPageViewer';
import { logger } from '@/lib/logging/logger';

interface PageProps {
  params: {
    url: string;
  };
}

async function getPublishedPage(url: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/pages/publish/${url}`, {
      cache: 'no-store' // Всегда получаем свежие данные
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.page : null;
  } catch (error) {
    logger.error('Error fetching published page:', error);
    return null;
  }
}

export default async function PublishedPage({ params }: PageProps) {
  const page = await getPublishedPage(params.url);

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PublishedPageViewer page={page} />
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const page = await getPublishedPage(params.url);

  if (!page) {
    return {
      title: 'Страница не найдена',
      description: 'Запрашиваемая страница не найдена или не опубликована'
    };
  }

  return {
    title: page.title,
    description: page.description || `Опубликованная страница: ${page.title}`,
    openGraph: {
      title: page.title,
      description: page.description || `Опубликованная страница: ${page.title}`,
      type: 'website',
    }
  };
}

