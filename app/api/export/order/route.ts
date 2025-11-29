// api/export/order/route.ts
// API роут для экспорта заказа на фабрику

import { NextRequest, NextResponse } from 'next/server';
import { ExportPayload, ExportResponse, ExportError } from '@/lib/export/types';
import { getExportAdapter } from '@/lib/export/registry';
import { buildExportXLSX, getExportFilename, getExportMimeType } from '@/lib/export/services/xlsx';
import { logger } from '@/lib/logging/logger';

export async function POST(req: NextRequest) {
  try {
    const body: ExportPayload = await req.json();
    
    // Валидация входных данных
    const validation = validateExportPayload(body);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error?.message,
          details: validation.error 
        },
        { status: 400 }
      );
    }

    const { kpId, format } = body;

    // Получаем адаптер для категории Doors (пока только она поддерживается)
    const adapter = getExportAdapter('doors');

    // Валидируем КП
    const kpValidation = await adapter.validateKP(kpId);
    if (!kpValidation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: kpValidation.error?.message,
          details: kpValidation.error 
        },
        { status: 400 }
      );
    }

    // Получаем данные КП
    const kpData = await adapter.getKPData(kpId);
    
    // Преобразуем в строки экспорта
    const exportRows = await adapter.toExportRows(kpData);

    if (exportRows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'КП не содержит позиций для экспорта' 
        },
        { status: 400 }
      );
    }

    // Генерируем файл в зависимости от формата
    let fileBuffer: Buffer;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'xlsx':
        fileBuffer = await buildExportXLSX(exportRows);
        filename = getExportFilename('xlsx', kpId);
        mimeType = getExportMimeType('xlsx');
        break;
      
      default:
        return NextResponse.json(
          { 
            success: false, 
            error: `Неподдерживаемый формат экспорта: ${format}` 
          },
          { status: 400 }
        );
    }

    // Возвращаем файл с корректными заголовками
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error: unknown) {
    logger.error('Export error', 'export/order', error instanceof Error ? { error: error.message, stack: error.stack, kpId: body?.kpId, format: body?.format } : { error: String(error), kpId: body?.kpId, format: body?.format });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера при экспорте',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

function validateExportPayload(payload: unknown): { valid: boolean; error?: ExportError } {
  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Тело запроса должно быть объектом',
        field: 'body'
      }
    };
  }

  if (!payload.kpId || typeof payload.kpId !== 'string') {
    return {
      valid: false,
      error: {
        code: 'MISSING_KP_ID',
        message: 'Поле kpId обязательно и должно быть строкой',
        field: 'kpId',
        value: payload.kpId
      }
    };
  }

  if (!payload.format || typeof payload.format !== 'string') {
    return {
      valid: false,
      error: {
        code: 'MISSING_FORMAT',
        message: 'Поле format обязательно и должно быть строкой',
        field: 'format',
        value: payload.format
      }
    };
  }

  const supportedFormats = ['xlsx'];
  if (!supportedFormats.includes(payload.format)) {
    return {
      valid: false,
      error: {
        code: 'UNSUPPORTED_FORMAT',
        message: `Неподдерживаемый формат. Поддерживаемые: ${supportedFormats.join(', ')}`,
        field: 'format',
        value: payload.format
      }
    };
  }

  return { valid: true };
}

