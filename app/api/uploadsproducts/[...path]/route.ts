import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { logger } from '@/lib/logging/logger';

// API route для обработки путей вида /api/uploadsproducts/...
// Исправляет путь uploadsproducts/... -> products/...
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    let filePath = resolvedParams.path.join('/');
    
    // Исправляем путь: uploadsproducts/... -> products/...
    // (так как в fullPath уже добавляется "public/uploads")
    if (filePath.startsWith('uploadsproducts/')) {
      filePath = `products/${filePath.substring(17)}`;
    } else if (filePath.startsWith('uploadsproducts')) {
      filePath = `products/${filePath.substring(16)}`;
    } else if (!filePath.includes('products/')) {
      // Если путь не содержит 'products/' и не начинается с 'uploadsproducts',
      // предполагаем, что это путь к продукту (например, cmg50xcgs001cv7mn0tdyk1wo/photo.png)
      // Добавляем 'products/' перед путем
      filePath = `products/${filePath}`;
    }
    
    // Проверяем безопасность пути
    if (filePath.includes('..') || filePath.includes('~')) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }

    // Путь к файлу в папке public/uploads
    const fullPath = join(process.cwd(), 'public', 'uploads', filePath);
    
    logger.debug('Ищем файл (uploadsproducts)', 'uploadsproducts/[...path]', { filePath, fullPath });
    
    // Проверяем существование файла
    if (!existsSync(fullPath)) {
      logger.warn('Файл не найден (uploadsproducts)', 'uploadsproducts/[...path]', { filePath, fullPath });
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Читаем файл
    const fileBuffer = await readFile(fullPath);
    
    // Определяем MIME тип по расширению
    const ext = filePath.split('.').pop()?.toLowerCase();
    let mimeType = 'application/octet-stream';
    
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      case 'svg':
        mimeType = 'image/svg+xml';
        break;
    }

    // Возвращаем файл с правильными заголовками
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    logger.error('Ошибка загрузки файла (uploadsproducts)', 'uploadsproducts/[...path]', error instanceof Error ? { error: error.message, stack: error.stack, filePath } : { error: String(error), filePath });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

