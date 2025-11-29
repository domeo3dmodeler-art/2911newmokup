import { NextRequest, NextResponse } from 'next/server';
import { ExcelGenerator } from '../../../../lib/documents/excel-generator';
import { logger } from '../../../../lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateType = searchParams.get('type');

    let buffer: Buffer;
    let filename: string;
    let mimeType: string;

    switch (templateType) {
      case 'import':
        buffer = await ExcelGenerator.getInstance().generateImportTemplate();
        filename = 'Шаблон_импорта_товаров.xlsx';
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;

      default:
        return NextResponse.json(
          { error: 'Неподдерживаемый тип шаблона' },
          { status: 400 }
        );
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    logger.error('Ошибка генерации шаблона', 'documents/templates', error instanceof Error ? { error: error.message, stack: error.stack, templateType } : { error: String(error), templateType });
    return NextResponse.json(
      { error: 'Ошибка генерации шаблона' },
      { status: 500 }
    );
  }
}



