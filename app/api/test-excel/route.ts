import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';
import * as XLSX from 'xlsx';

// Создание тестового Excel файла
export async function GET(req: NextRequest) {
  try {
    // Создаем тестовые данные
    const testData = [
      ['Название', 'Цена', 'Материал', 'Цвет', 'Размер'],
      ['Дверь 1', 25000, 'Дерево', 'Коричневый', '200x80'],
      ['Дверь 2', 30000, 'Металл', 'Белый', '210x90'],
      ['Дверь 3', 28000, 'Стекло', 'Черный', '200x80']
    ];

    // Создаем рабочую книгу
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(testData);
    XLSX.utils.book_append_sheet(wb, ws, 'Прайс');

    // Конвертируем в буфер
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Возвращаем файл
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="test_doors.xlsx"'
      }
    });
  } catch (error) {
    logger.error('Error creating test file', 'api/test-excel', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json({ error: 'Ошибка создания тестового файла' }, { status: 500 });
  }
}
