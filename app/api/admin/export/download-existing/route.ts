import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    logger.debug('Скачивание файла экспорта прайса', 'admin/export/download-existing');

    // Ищем существующий файл экспорта
    const files = fs.readdirSync(process.cwd()).filter((file: string) => 
      file.startsWith('price_') && file.endsWith('.csv')
    );

    if (files.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Файл экспорта не найден. Сначала запустите скрипт экспорта.' 
      }, { status: 404 });
    }

    // Берем самый новый файл
    const latestFile = files.sort().pop();
    const filePath = path.join(process.cwd(), latestFile!);
    
    logger.debug('Найден файл', 'admin/export/download-existing', { fileName: latestFile });

    // Читаем содержимое файла
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Возвращаем CSV файл
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${latestFile}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    logger.error('Error downloading file', 'admin/export/download-existing', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { success: false, error: `Failed to download file: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}